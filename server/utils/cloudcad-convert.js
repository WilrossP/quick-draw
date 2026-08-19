// Convert flattened DXF primitives into a CloudCAD cad_data object, and push
// that object to SkyCiv to get a CloudCAD link back.
//
// Two coordinate rules apply on the way in:
//   - CloudCAD y points down, so every y is negated.
//   - The canvas is dark, so text colour must stay light.

'use strict';

const https = require('https');
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

	// Annotation sizes are driven by the drawing extent, per the CloudCAD sizing
	// guidance - a fixed value looks wrong at every scale but the one it was
	// picked for.
	const buildAttributeStyle = (bbox) => {

		const span = Math.max(bbox.width, bbox.height) || 1000;
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

		// CloudCAD y is inverted relative to DXF.
		const P = (x, y) => ({ x: round(x), y: round(-y) });

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

			if (p.k === 'poly') {

				// A true circle or arc survives as a curve rather than dozens of
				// straight segments - large templates carry hundreds of these.
				if (p.curve && p.curve.type === 'circle') {
					const id = nextId('pl');
					polylines.push({
						type: 'circle',
						center: P(p.curve.cx, p.curve.cy),
						radius: round(p.curve.r),
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
					size: 14,
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
			attributeStyles: [buildAttributeStyle(flat.bbox)],
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

			const req = https.request({
				host: config.api.host,
				path: config.api.path,
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Content-Length': Buffer.byteLength(payload)
				}
			}, (res) => {

				let body = '';
				res.on('data', (chunk) => { body += chunk; });

				res.on('end', () => {

					let parsed = null;
					try {
						parsed = JSON.parse(body);
					} catch (e) {
						parsed = null;
					}

					if (!parsed) {
						resolve({ ok: false, reason: 'bad-response', detail: body.slice(0, 400) });
						return;
					}

					// The save result comes back keyed by function name.
					const save = parsed['cloudcad.file.save'] || parsed[2] || null;

					if (save && save.data) {
						resolve({ ok: true, url: save.data, public_link: save.public_link || null });
					} else {
						resolve({ ok: false, reason: 'api-error', detail: parsed });
					}
				});
			});

			req.on('error', (err) => {
				resolve({ ok: false, reason: 'network', detail: String(err.message) });
			});

			req.write(payload);
			req.end();
		});
	};

	funcs.build = build;
	funcs.publish = publish;

	return funcs;

})();

module.exports = CLOUDCAD_CONVERT;
