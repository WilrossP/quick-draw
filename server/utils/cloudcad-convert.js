// Convert flattened DXF primitives into a CloudCAD cad_data object, and push
// that object to SkyCiv to get a CloudCAD link back.
//
// Two coordinate rules apply on the way in:
//   - CloudCAD y points down, so every y is negated.
//   - The canvas is dark, so text colour must stay light.

'use strict';
const skyciv = require('./skyciv-api.js')
const config = require('./config');

const CLOUDCAD_CONVERT = (function () {

	let funcs = {};

	// Deterministic ids keep repeat conversions of the same template stable,
	// which makes the output diffable and avoids a random dependency.
	let counter = 0;

	const nextId = (prefix) => {
		counter++;
		return prefix + '-' + counter;
	};

	const round = (n) => Math.round(n * 1000) / 1000;

	// How many mm one unit of the source drawing is worth. CloudCAD stores real
	// mm internally regardless of the display unit, so this is the only place a
	// scale factor is ever applied.
	const MM_PER_UNIT = {
		unitless: 1, mm: 1, cm: 10, m: 1000,
		in: 25.4, inch: 25.4, inches: 25.4,
		ft: 304.8, foot: 304.8, feet: 304.8,
		yd: 914.4
	};

	// Keeps a very small label from collapsing to nothing. Small-text drawings
	// (an A3 title block's text is only ~1.3mm) need the extra decimals - at
	// three the rounding alone was a few percent out.
	const MIN_TEXT_SIZE = 0.001;

	// Convert a real text height in mm into CloudCAD's `size` scalar, using the
	// same ratio CloudCAD's own DXF importer applies.
	const textSize = (height_mm) => {
		const size = height_mm * config.dxf_import.text_size_per_mm;
		if (!isFinite(size) || size <= 0) return MIN_TEXT_SIZE;
		return Math.max(MIN_TEXT_SIZE, Math.round(size * 10000) / 10000);
	};

	const unitScale = (units) => {
		const scale = MM_PER_UNIT[String(units || 'mm').toLowerCase()];
		if (!scale) {
			console.warn('[quick-draw] unknown source unit "' + units + '", treating as mm');
			return 1;
		}
		return scale;
	};

	// Annotation sizes are driven by the drawing extent, per the CloudCAD sizing
	// guidance - a fixed value looks wrong at every scale but the one it was
	// picked for.
	const buildAttributeStyle = (bbox, scale) => {

		// Span in real mm, so annotation sizes stay right whatever the source unit.
		const span = (Math.max(bbox.width, bbox.height) || 1000) * scale;
		const text_size = Math.max(2, Math.round(span / 60));
		const arrow = Math.max(1, Math.round(text_size * 0.6));

		return {
			id: 'as-default',
			name: 'Quick Draw Default',
			settings: {
				linearArrowShape: 'arrow',
				linearArrowLength: arrow,
				linearArrowWidth: arrow,
				linearExtLineStartOffset: 0,
				linearExtLineEndOffset: 0,
				linearTextOffset: 0,
				linearTextHorizontalOffset: 0,
				linearTextHorizontalPosition: 'center',
				dimensionTextSize: text_size,
				angleArrowShape: 'arrow',
				angleArrowLength: arrow,
				angleArrowWidth: arrow,
				angleDimensionTextSize: text_size,
				angleTextOffset: Math.round(text_size * 1.6),
				angleTextOrientation: 'horizontal',
				radiusArrowShape: 'arrow',
				radiusArrowLength: arrow,
				radiusArrowWidth: arrow,
				radiusDimensionTextSize: text_size,
				radiusTextOffset: 0,
				leaderArrowShape: 'arrow',
				leaderArrowLength: arrow,
				leaderTextSize: text_size,
				leaderTextOffsetHorizontal: 0,
				leaderTextOffsetVertical: 0,
				axisExtension: Math.round(span / 12),
				axisCircleDiameter: Math.round(text_size * 2.8),
				axisTextSize: Math.round(text_size * 0.86),
				axisDashLength: arrow,
				axisDashGap: Math.round(arrow / 2),
				textSizeInput: 14,
				textSizeOverride: false,
				fontFamily: 'monospace',
				tableFontSize: text_size
			}
		};
	};

	/**
	 * Build a full cad_data object from a flattened DXF.
	 *
	 * This mirrors CloudCAD's own DXF import options: the result always replaces
	 * the canvas rather than adding to it (a fresh model is created every time,
	 * and nothing is ever opened into the session first), and dimensions are left
	 * out unless `config.dxf_import.dimensions` is switched on. DXF dimensions can
	 * only come across as dumb line-work and text, not as editable CloudCAD
	 * dimension entities, so importing them just leaves clutter that has to be
	 * deleted before the drawing can be dimensioned properly.
	 *
	 * @param {Object} flat - output of dxf-flatten.run
	 * @param {Object} meta - { title }
	 */
	const build = (flat, meta) => {

		counter = 0;

		const info = meta || {};
		const lines = [];
		const polylines = [];
		const texts = [];
		const hatches = [];
		const layer_map = {};

		const options = config.dxf_import;
		const skip_dimensions = !options.dimensions;
		const scale = unitScale(options.source_units);
		const shift_x = options.shift_x;
		const shift_y = options.shift_y;

		// Source units and shift first, then the y flip - CloudCAD y points down
		// where DXF y points up. The shift is applied in the drawing's own sense,
		// so a positive shift_y moves content up as it would in the DXF.
		const P = (x, y) => ({
			x: round(x * scale + shift_x),
			y: round(-(y * scale + shift_y))
		});

		const assignLayer = (name, type, id, color) => {
			const key = name || '0';
			if (!layer_map[key]) {
				layer_map[key] = {
					id: 'layer-' + Object.keys(layer_map).length,
					name: key,
					color: color || '#e2e8f0',
					visible: true,
					locked: false,
					lineThickness: 1,
					lineType: 'solid',
					patternScale: 1,
					items: []
				};
			}
			layer_map[key].items.push({ type: type, id: id });
		};

		flat.primitives.forEach((p) => {

			// Dimension line-work, dropped the same way CloudCAD's import dialog
			// drops it when "Dimensions" is left unchecked. The count is already
			// on flat.stats.dimension_primitives for the caller's summary.
			if (p.dim && skip_dimensions) return;

			if (p.k === 'poly') {

				// A true circle or arc survives as a curve rather than dozens of
				// straight segments - large templates carry hundreds of these.
				if (p.curve && p.curve.type === 'circle') {
					const id = nextId('pl');
					polylines.push({
						type: 'circle',
						center: P(p.curve.cx, p.curve.cy),
						radius: round(p.curve.r * scale),
						radiusPoint: P(p.curve.cx + p.curve.r, p.curve.cy),
						segments: 100,
						id: id
					});
					assignLayer(p.layer, 'circle', id, p.color);
					return;
				}

				if (p.curve && p.curve.type === 'arc') {

					const c = p.curve;
					const a0 = c.a0 * Math.PI / 180;
					let a1 = c.a1 * Math.PI / 180;
					while (a1 <= a0) a1 += Math.PI * 2;
					const mid = (a0 + a1) / 2;

					const id = nextId('pl');
					polylines.push({
						type: 'arc',
						// start, end, then a control point sitting on the arc
						points: [
							P(c.cx + c.r * Math.cos(a0), c.cy + c.r * Math.sin(a0)),
							P(c.cx + c.r * Math.cos(a1), c.cy + c.r * Math.sin(a1)),
							P(c.cx + c.r * Math.cos(mid), c.cy + c.r * Math.sin(mid))
						],
						segments: 100,
						id: id
					});
					assignLayer(p.layer, 'arc', id, p.color);
					return;
				}

				// Everything else becomes connected line segments sharing a
				// groupId, which is how CloudCAD represents a polygon.
				const group_id = nextId('grp');
				for (let i = 0; i < p.pts.length - 1; i++) {
					const a = p.pts[i];
					const b = p.pts[i + 1];
					if (a.x === b.x && a.y === b.y) continue;
					const id = nextId('ln');
					lines.push({ p1: P(a.x, a.y), p2: P(b.x, b.y), id: id, groupId: group_id });
					assignLayer(p.layer, 'line', id, p.color);
				}
				return;
			}

			if (p.k === 'text') {
				const id = nextId('tx');
				texts.push({
					position: P(p.x, p.y),
					text: p.text,
					// The DXF's own text height, carried through the same unit
					// scale as the geometry so labels stay true to the drawing.
					size: textSize(p.h * scale),
					color: p.color,
					backgroundColor: '#000000',
					backgroundColorOpacity: 0,
					// The position already accounts for the DXF anchor, so
					// alignment stays "left" to stop CloudCAD applying a second
					// horizontal shift on top of it.
					alignment: 'left',
					textPosition: 'middle-center',
					rotation: round(p.rot),
					bold: false,
					italic: false,
					id: id,
					attributeStyleId: 'as-default'
				});
				assignLayer(p.layer, 'text', id, p.color);
				return;
			}

			if (p.k === 'fill') {

				const loops = p.loops.filter((l) => l.length >= 3).map((loop) => {
					const segments = [];
					for (let i = 0; i < loop.length; i++) {
						const a = loop[i];
						const b = loop[(i + 1) % loop.length];
						segments.push({ type: 'line', start: P(a.x, a.y), end: P(b.x, b.y) });
					}
					return { segments: segments };
				});

				if (!loops.length) return;

				const id = nextId('ht');
				hatches.push({
					id: id,
					type: 'hatch',
					color: p.color,
					opacity: p.hatch ? 0.35 : 0.8,
					loops: loops
				});
				assignLayer(p.layer, 'hatch', id, p.color);
			}
		});

		return {
			settings: {
				canvasLengthUnits: 'mm',
				displayColorByLayers: false
			},
			attributeStyles: [buildAttributeStyle(flat.bbox, scale)],
			blockReferences: [],
			canvases: [
				{
					version: '2.0.0',
					schema: 'canvas-json-v2-optimized',
					name: info.title || 'Quick Draw Template',
					drawing_type: 'Plan',
					is_base: true,
					points: [],
					lines: lines,
					polylines: polylines,
					dimensions: [],
					angleDimensions: [],
					radiusDimensions: [],
					leaderTexts: [],
					multiLeaderTexts: [],
					texts: texts,
					tables: [],
					axes: [],
					constructionLines: [],
					revisionClouds: [],
					hatches: hatches,
					images: [],
					block_instances: [],
					layers: Object.keys(layer_map).map((k) => layer_map[k])
				}
			]
		};
	};

	/**
	 * Push a cad_data object to SkyCiv and get a CloudCAD link back.
	 * Resolves with { ok: false, reason } rather than rejecting, so the caller
	 * can fall back to the download route instead of handling an exception.
	 */
	const publish = (cad_data, name) => {

		return new Promise((resolve) => {

			if (!config.auth.username || !config.auth.key) {
				resolve({ ok: false, reason: 'no-credentials' });
				return;
			}

			const payload = JSON.stringify({
				auth: { username: config.auth.username, key: config.auth.key },
				options: { validate_input: true },
				functions: [
					{ function: 'S3D.session.start', arguments: { keep_open: false } },
					{ function: 'cloudcad.model.create', arguments: { cad_data: cad_data } },
					{
						function: 'cloudcad.file.save',
						arguments: {
							name: name,
							path: config.cloudcad_save_path,
							public_share: true
						}
					}
				]
			});

			// skyciv.request only logs transport errors - its callback never fires
			// on a failed connection, which would leave this promise pending and
			// the caller's request hanging. This makes sure one answer always
			// comes back.
			let settled = false;
			const answer = (result) => {
				if (settled) return;
				settled = true;
				clearTimeout(timer);
				resolve(result);
			};

			const timer = setTimeout(() => {
				answer({
					ok: false,
					reason: 'timeout',
					detail: 'The SkyCiv API did not respond within 120 seconds.'
				});
			}, 120000);

			skyciv.request(payload, (parsed) => {

				try {
					if (typeof parsed == "string") parsed = JSON.parse(parsed);
				} catch (e) {
					answer({ ok: false, reason: 'bad-response', detail: String(parsed).slice(0, 400) });
					return;
				}

				if (!parsed || typeof parsed !== 'object') {
					answer({ ok: false, reason: 'bad-response', detail: 'The API returned nothing usable.' });
					return;
				}

				const envelope = parsed.response || {};
				const results = Array.isArray(parsed.functions) ? parsed.functions : [];
				const save = results.length ? results[results.length - 1] : null;

				// status 0 is success, anything else puts the reason in msg -
				// most often that the credentials did not authenticate.
				if (envelope.status !== 0) {
					answer({
						ok: false,
						reason: 'api-error',
						detail: envelope.msg || 'The SkyCiv API rejected the request.'
					});
					return;
				}

				const url = save && save.data ? save.data : envelope.data;

				if (typeof url === 'string' && url.indexOf('http') === 0) {
					answer({
						ok: true,
						url: url,
						public_link: save && save.public_link ? save.public_link : null
					});
					return;
				}

				answer({
					ok: false,
					reason: 'no-link',
					detail: envelope.msg || 'The drawing saved but no CloudCAD link came back.'
				});
			});
		});

	};

	funcs.build = build;
	funcs.publish = publish;

	return funcs;

})();

module.exports = CLOUDCAD_CONVERT;
