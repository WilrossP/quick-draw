// Resolve a parsed DXF document into flat drawing primitives.
//
// Output primitives, all in DXF world coordinates (y up):
//   { k: 'poly', pts: [{x,y}], closed, color, layer, curve }
//   { k: 'text', x, y, h, rot, text, anchor, color, layer }
//   { k: 'fill', loops: [ [{x,y}] ], color, layer, hatch }
//
// Curves are tessellated so arbitrary INSERT transforms (including mirrored and
// non-uniform scales) stay correct without special cases. Where the transform
// preserves a circle or arc, the true curve is recorded on `curve` as well so
// the CloudCAD converter can emit a real curve instead of dozens of segments.

'use strict';

const dxf = require('./dxf-parser');
const colors = require('./aci-colors');

const DXF_FLATTEN = (function () {

	let funcs = {};

	const TAU = Math.PI * 2;
	const MAX_DEPTH = 12;      // guards against blocks that reference each other
	const ARC_SEGMENTS = 48;   // tessellation resolution for a full circle

	// $INSUNITS codes, so a drawing that is not in the expected units can be
	// spotted rather than silently converted at the wrong scale.
	const INSUNITS = {
		0: 'unitless', 1: 'in', 2: 'ft', 3: 'mi', 4: 'mm',
		5: 'cm', 6: 'm', 7: 'km', 8: 'microin', 9: 'mil', 10: 'yd'
	};

	/* -------------------------------------------------- *
	 * 2D affine transform: [a, b, c, d, e, f]
	 * -------------------------------------------------- */

	const identity = () => [1, 0, 0, 1, 0, 0];

	const multiply = (m, n) => [
		m[0] * n[0] + m[2] * n[1],
		m[1] * n[0] + m[3] * n[1],
		m[0] * n[2] + m[2] * n[3],
		m[1] * n[2] + m[3] * n[3],
		m[0] * n[4] + m[2] * n[5] + m[4],
		m[1] * n[4] + m[3] * n[5] + m[5]
	];

	const apply = (m, x, y) => ({
		x: m[0] * x + m[2] * y + m[4],
		y: m[1] * x + m[3] * y + m[5]
	});

	// Average scale factor, used to carry text height through a transform.
	const scaleOf = (m) => {
		const sx = Math.sqrt(m[0] * m[0] + m[1] * m[1]);
		const sy = Math.sqrt(m[2] * m[2] + m[3] * m[3]);
		return (sx + sy) / 2;
	};

	const rotationOf = (m) => Math.atan2(m[1], m[0]) * 180 / Math.PI;

	// True when a transform is a pure rotate plus uniform scale - no mirror, no
	// shear. Only then does a circle stay a circle and an arc stay an arc.
	const conformal = (m) => {

		const det = m[0] * m[3] - m[1] * m[2];
		if (det <= 0) return null;

		const sx = Math.sqrt(m[0] * m[0] + m[1] * m[1]);
		const sy = Math.sqrt(m[2] * m[2] + m[3] * m[3]);
		if (Math.abs(sx - sy) > 1e-6 * Math.max(sx, sy)) return null;

		const skew = m[0] * m[2] + m[1] * m[3];
		if (Math.abs(skew) > 1e-6 * sx * sy) return null;

		return { scale: sx, rotation: Math.atan2(m[1], m[0]) * 180 / Math.PI };
	};

	/* -------------------------------------------------- *
	 * Curve helpers
	 * -------------------------------------------------- */

	const arcPoints = (cx, cy, r, start_deg, end_deg) => {

		let a0 = start_deg * Math.PI / 180;
		let a1 = end_deg * Math.PI / 180;
		while (a1 <= a0) a1 += TAU;

		const sweep = a1 - a0;
		const steps = Math.max(2, Math.ceil(ARC_SEGMENTS * (sweep / TAU)));
		const pts = [];

		for (let i = 0; i <= steps; i++) {
			const a = a0 + (sweep * i) / steps;
			pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
		}

		return pts;
	};

	// A polyline bulge is the tangent of a quarter of the arc's included angle.
	const bulgeArc = (p1, p2, bulge) => {

		if (!bulge) return [p2];

		const theta = 4 * Math.atan(bulge);
		const dx = p2.x - p1.x;
		const dy = p2.y - p1.y;
		const chord = Math.sqrt(dx * dx + dy * dy);
		if (chord === 0) return [p2];

		const radius = chord / (2 * Math.sin(Math.abs(theta) / 2));

		// The centre sits off the chord midpoint, on the side the bulge sign picks.
		const h = Math.sqrt(Math.max(0, radius * radius - (chord / 2) * (chord / 2)));
		const sign = (theta > 0 ? 1 : -1) * (Math.abs(theta) > Math.PI ? -1 : 1);
		const cx = (p1.x + p2.x) / 2 - sign * h * (dy / chord);
		const cy = (p1.y + p2.y) / 2 + sign * h * (dx / chord);

		const a0 = Math.atan2(p1.y - cy, p1.x - cx);
		const a1 = Math.atan2(p2.y - cy, p2.x - cx);

		let sweep = a1 - a0;
		if (theta > 0) { while (sweep <= 0) sweep += TAU; }
		else { while (sweep >= 0) sweep -= TAU; }

		const steps = Math.max(2, Math.ceil(ARC_SEGMENTS * (Math.abs(sweep) / TAU)));
		const pts = [];

		for (let i = 1; i <= steps; i++) {
			const a = a0 + (sweep * i) / steps;
			pts.push({ x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) });
		}

		return pts;
	};

	// Splines are approximated by Chaikin-smoothing their control polygon. Much
	// closer to the real curve than the raw control points, and it needs no knot
	// vector handling.
	//
	// Each round roughly doubles the point count, so a spline with many control
	// points gets fewer rounds. Without this cap a drawing of dense splines
	// expands into tens of thousands of segments for no visible gain.
	const chaikinRounds = (count) => {
		if (count > 200) return 0;
		if (count > 60) return 1;
		if (count > 20) return 2;
		return 3;
	};

	const chaikin = (pts, rounds) => {
		let cur = pts;
		for (let r = 0; r < rounds && cur.length > 2; r++) {
			const next = [cur[0]];
			for (let i = 0; i < cur.length - 1; i++) {
				const a = cur[i];
				const b = cur[i + 1];
				next.push({ x: a.x * 0.75 + b.x * 0.25, y: a.y * 0.75 + b.y * 0.25 });
				next.push({ x: a.x * 0.25 + b.x * 0.75, y: a.y * 0.25 + b.y * 0.75 });
			}
			next.push(cur[cur.length - 1]);
			cur = next;
		}
		return cur;
	};

	const ellipsePoints = (cx, cy, maj_x, maj_y, ratio, start_param, end_param) => {

		const major = Math.sqrt(maj_x * maj_x + maj_y * maj_y);
		const minor = major * ratio;
		const tilt = Math.atan2(maj_y, maj_x);

		const a0 = start_param;
		let a1 = end_param;
		if (Math.abs(a1 - a0) < 1e-9) a1 = a0 + TAU;
		while (a1 <= a0) a1 += TAU;

		const sweep = a1 - a0;
		const steps = Math.max(2, Math.ceil(ARC_SEGMENTS * (sweep / TAU)));
		const pts = [];

		for (let i = 0; i <= steps; i++) {
			const t = a0 + (sweep * i) / steps;
			const ex = major * Math.cos(t);
			const ey = minor * Math.sin(t);
			pts.push({
				x: cx + ex * Math.cos(tilt) - ey * Math.sin(tilt),
				y: cy + ex * Math.sin(tilt) + ey * Math.cos(tilt)
			});
		}

		return pts;
	};

	/* -------------------------------------------------- *
	 * Text cleanup
	 * -------------------------------------------------- */

	// MTEXT carries inline formatting codes that must not reach the label.
	const cleanMText = (raw) => {
		return String(raw || '')
			.replace(/\\P/g, ' ')
			.replace(/\\[A-Za-z][^;\\]*;/g, '')
			.replace(/[{}]/g, '')
			.replace(/%%[dD]/g, ' deg')
			.replace(/%%[cC]/g, 'dia ')
			.replace(/%%[pP]/g, '+/-')
			.replace(/\\/g, '')
			.trim();
	};

	const cleanText = (raw) => {
		return String(raw || '')
			.replace(/%%[dD]/g, ' deg')
			.replace(/%%[cC]/g, 'dia ')
			.replace(/%%[pP]/g, '+/-')
			.replace(/%%[uUoO]/g, '')
			.trim();
	};

	/* -------------------------------------------------- *
	 * Entity walking
	 * -------------------------------------------------- */

	// `in_dimension` marks everything emitted from inside a DIMENSION's
	// anonymous block, so a consumer can drop dimension line-work without
	// needing the drawing parsed a second time.
	const walk = (entities, doc, matrix, depth, out, inherited_color, in_dimension) => {

		if (depth > MAX_DEPTH) return;

		for (let i = 0; i < entities.length; i++) {

			const ent = entities[i];
			const layer_name = dxf.str(ent, 8, '0');
			const layer = doc.layers[layer_name];

			// Colour resolution: entity override, then the colour handed down by
			// the containing block (ByBlock), then the layer (ByLayer).
			let aci = dxf.num(ent, 62, null);
			if (aci === null || aci === 256) {
				aci = layer ? layer.color : 7;
			} else if (aci === 0) {
				aci = inherited_color ? inherited_color : (layer ? layer.color : 7);
			}

			const meta = {
				color: colors.forDarkCanvas(colors.toHex(aci)),
				layer: layer_name
			};

			emit(ent, doc, matrix, depth, out, meta, aci, in_dimension);
		}
	};

	const emit = (ent, doc, matrix, depth, out, meta, aci, in_dimension) => {

		const T = (p) => apply(matrix, p.x, p.y);

		const push = (pts, closed, curve) => {
			if (pts.length < 2) return;
			const prim = {
				k: 'poly',
				pts: pts.map(T),
				closed: !!closed,
				color: meta.color,
				layer: meta.layer
			};
			if (curve) prim.curve = curve;
			if (in_dimension) prim.dim = true;
			out.push(prim);
		};

		switch (ent.type) {

			case 'LINE': {
				push([
					{ x: dxf.num(ent, 10, 0), y: dxf.num(ent, 20, 0) },
					{ x: dxf.num(ent, 11, 0), y: dxf.num(ent, 21, 0) }
				]);
				break;
			}

			case 'LWPOLYLINE': {
				const verts = dxf.points(ent, 10, 20, 42);
				if (verts.length < 2) break;
				const closed = (dxf.num(ent, 70, 0) & 1) === 1;
				const pts = [verts[0]];
				for (let v = 0; v < verts.length - 1; v++) {
					const seg = bulgeArc(verts[v], verts[v + 1], verts[v].extra);
					for (let s = 0; s < seg.length; s++) pts.push(seg[s]);
				}
				if (closed) {
					const seg = bulgeArc(verts[verts.length - 1], verts[0], verts[verts.length - 1].extra);
					for (let s = 0; s < seg.length; s++) pts.push(seg[s]);
				}
				push(pts, closed);
				break;
			}

			case 'POLYLINE': {
				// Old-style polylines keep vertices in following VERTEX entities,
				// stitched on by stitchPolylines before we get here.
				const verts = ent.vertices || [];
				if (verts.length < 2) break;
				const closed = (dxf.num(ent, 70, 0) & 1) === 1;
				const pts = [verts[0]];
				for (let v = 0; v < verts.length - 1; v++) {
					const seg = bulgeArc(verts[v], verts[v + 1], verts[v].extra);
					for (let s = 0; s < seg.length; s++) pts.push(seg[s]);
				}
				if (closed) {
					const seg = bulgeArc(verts[verts.length - 1], verts[0], verts[verts.length - 1].extra);
					for (let s = 0; s < seg.length; s++) pts.push(seg[s]);
				}
				push(pts, closed);
				break;
			}

			case 'CIRCLE': {
				const cx = dxf.num(ent, 10, 0);
				const cy = dxf.num(ent, 20, 0);
				const r = dxf.num(ent, 40, 0);
				const cf = conformal(matrix);
				const c = apply(matrix, cx, cy);
				push(
					arcPoints(cx, cy, r, 0, 360),
					true,
					cf ? { type: 'circle', cx: c.x, cy: c.y, r: r * cf.scale } : null
				);
				break;
			}

			case 'ARC': {
				const cx = dxf.num(ent, 10, 0);
				const cy = dxf.num(ent, 20, 0);
				const r = dxf.num(ent, 40, 0);
				const a0 = dxf.num(ent, 50, 0);
				const a1 = dxf.num(ent, 51, 360);
				const cf = conformal(matrix);
				const c = apply(matrix, cx, cy);
				push(
					arcPoints(cx, cy, r, a0, a1),
					false,
					cf ? {
						type: 'arc',
						cx: c.x, cy: c.y, r: r * cf.scale,
						a0: a0 + cf.rotation, a1: a1 + cf.rotation
					} : null
				);
				break;
			}

			case 'ELLIPSE': {
				push(ellipsePoints(
					dxf.num(ent, 10, 0), dxf.num(ent, 20, 0),
					dxf.num(ent, 11, 1), dxf.num(ent, 21, 0),
					dxf.num(ent, 40, 1),
					dxf.num(ent, 41, 0), dxf.num(ent, 42, TAU)
				));
				break;
			}

			case 'SPLINE': {
				const fit = dxf.points(ent, 11, 21);
				const ctrl = dxf.points(ent, 10, 20);
				const closed = (dxf.num(ent, 70, 0) & 1) === 1;
				if (fit.length >= 2) push(fit, closed);
				else if (ctrl.length >= 2) push(chaikin(ctrl, chaikinRounds(ctrl.length)), closed);
				break;
			}

			case 'LEADER': {
				push(dxf.points(ent, 10, 20));
				break;
			}

			case 'POINT': {
				// Drawn as a small cross so it stays visible at preview scale.
				const px = dxf.num(ent, 10, 0);
				const py = dxf.num(ent, 20, 0);
				push([{ x: px - 1, y: py }, { x: px + 1, y: py }]);
				push([{ x: px, y: py - 1 }, { x: px, y: py + 1 }]);
				break;
			}

			case 'SOLID':
			case 'TRACE': {
				// Corners are stored 10, 11, 13, 12 - the last two are swapped.
				const corners = [
					{ x: dxf.num(ent, 10, 0), y: dxf.num(ent, 20, 0) },
					{ x: dxf.num(ent, 11, 0), y: dxf.num(ent, 21, 0) },
					{ x: dxf.num(ent, 13, dxf.num(ent, 12, 0)), y: dxf.num(ent, 23, dxf.num(ent, 22, 0)) },
					{ x: dxf.num(ent, 12, 0), y: dxf.num(ent, 22, 0) }
				];
				out.push({ k: 'fill', loops: [corners.map(T)], color: meta.color, layer: meta.layer, dim: !!in_dimension });
				break;
			}

			case 'HATCH': {
				const loops = hatchLoops(ent);
				if (!loops.length) break;
				out.push({
					k: 'fill',
					loops: loops.map((loop) => loop.map(T)),
					color: meta.color,
					layer: meta.layer,
					hatch: true,
					dim: !!in_dimension
				});
				break;
			}

			case 'TEXT':
			case 'ATTRIB': {
				const value = cleanText(dxf.str(ent, 1, ''));
				if (!value) break;
				const h_align = dxf.num(ent, 72, 0);
				const v_align = dxf.num(ent, 73, 0);
				// When aligned, the second point (11/21) is the real anchor.
				const use_alt = (h_align !== 0 || v_align !== 0) && dxf.num(ent, 11, null) !== null;
				const p = apply(
					matrix,
					use_alt ? dxf.num(ent, 11, 0) : dxf.num(ent, 10, 0),
					use_alt ? dxf.num(ent, 21, 0) : dxf.num(ent, 20, 0)
				);
				out.push({
					k: 'text',
					x: p.x,
					y: p.y,
					h: dxf.num(ent, 40, 2.5) * scaleOf(matrix),
					rot: dxf.num(ent, 50, 0) + rotationOf(matrix),
					text: value,
					anchor: h_align === 1 ? 'middle' : (h_align === 2 ? 'end' : 'start'),
					color: meta.color,
					layer: meta.layer,
					dim: !!in_dimension
				});
				break;
			}

			case 'MTEXT': {
				const value = cleanMText(dxf.all(ent, 3).join('') + dxf.str(ent, 1, ''));
				if (!value) break;
				const p = apply(matrix, dxf.num(ent, 10, 0), dxf.num(ent, 20, 0));
				// Attachment point 1-9 reads top-left to bottom-right, so the
				// column within the 3x3 grid gives the horizontal anchor.
				const column = (dxf.num(ent, 71, 1) - 1) % 3;
				out.push({
					k: 'text',
					x: p.x,
					y: p.y,
					h: dxf.num(ent, 40, 2.5) * scaleOf(matrix),
					rot: dxf.num(ent, 50, 0) + rotationOf(matrix),
					text: value,
					anchor: column === 1 ? 'middle' : (column === 2 ? 'end' : 'start'),
					color: meta.color,
					layer: meta.layer,
					dim: !!in_dimension
				});
				break;
			}

			case 'INSERT': {

				const block = doc.blocks[dxf.str(ent, 2, '')];
				if (!block) break;

				const sx = dxf.num(ent, 41, 1) || 1;
				const sy = dxf.num(ent, 42, 1) || 1;
				const rot = dxf.num(ent, 50, 0) * Math.PI / 180;
				const cols = Math.max(1, dxf.num(ent, 70, 1));
				const rows = Math.max(1, dxf.num(ent, 71, 1));
				const col_space = dxf.num(ent, 44, 0);
				const row_space = dxf.num(ent, 45, 0);
				const ix = dxf.num(ent, 10, 0);
				const iy = dxf.num(ent, 20, 0);

				const cos = Math.cos(rot);
				const sin = Math.sin(rot);

				for (let c = 0; c < cols; c++) {
					for (let r = 0; r < rows; r++) {
						// translate to insert point, rotate, scale, then shift by
						// the block's own base point
						const local = multiply(
							[1, 0, 0, 1, ix + c * col_space, iy + r * row_space],
							multiply(
								[cos, sin, -sin, cos, 0, 0],
								[sx, 0, 0, sy, -block.base.x * sx, -block.base.y * sy]
							)
						);
						walk(block.entities, doc, multiply(matrix, local), depth + 1, out, aci, in_dimension);
					}
				}
				break;
			}

			case 'DIMENSION': {
				// Dimensions render through an anonymous block holding their
				// lines, arrows and value text, already in world coordinates.
				const block = doc.blocks[dxf.str(ent, 2, '')];
				// Tagged as dimension line-work so the CloudCAD converter can drop
				// it - imported dimensions arrive as dumb geometry, not editable
				// CloudCAD dimension entities.
				if (block) walk(block.entities, doc, matrix, depth + 1, out, aci, true);
				break;
			}

			default:
				break;
		}
	};

	// Hatch boundaries: walk the boundary-definition portion of the entity and
	// group vertices by path. Everything from the pattern data onward (codes 75,
	// 76, 47, 98) is ignored.
	const hatchLoops = (ent) => {

		const loops = [];
		let current = null;
		let stopped = false;

		for (let i = 0; i < ent.pairs.length; i++) {

			const code = ent.pairs[i][0];
			const value = ent.pairs[i][1];

			if (code === 75 || code === 76 || code === 47 || code === 98) stopped = true;
			if (stopped) continue;

			if (code === 92) {
				if (current && current.length > 2) loops.push(current);
				current = [];
			} else if (code === 10 && current) {
				current.push({ x: parseFloat(value), y: 0 });
			} else if (code === 20 && current && current.length) {
				current[current.length - 1].y = parseFloat(value);
			}
		}

		if (current && current.length > 2) loops.push(current);

		return loops;
	};

	// POLYLINE stores its vertices as separate following entities. Stitch them
	// onto their owner so the emitter can treat it like any other polyline.
	const stitchPolylines = (entities) => {

		const out = [];
		let owner = null;

		for (let i = 0; i < entities.length; i++) {
			const ent = entities[i];
			if (ent.type === 'POLYLINE') {
				owner = ent;
				owner.vertices = [];
				out.push(ent);
			} else if (ent.type === 'VERTEX' && owner) {
				owner.vertices.push({
					x: dxf.num(ent, 10, 0),
					y: dxf.num(ent, 20, 0),
					extra: dxf.num(ent, 42, 0)
				});
			} else if (ent.type === 'SEQEND') {
				owner = null;
			} else {
				out.push(ent);
			}
		}

		return out;
	};

	/**
	 * Flatten a parsed document into primitives plus a measured bounding box.
	 * @param {Object} doc - output of dxf-parser.parse
	 * @returns {Object} { primitives, bbox, stats }
	 */
	const run = (doc) => {

		// The units the drawing itself declares, if it declares any.
		const insunits_raw = doc.header['$INSUNITS'];
		const insunits_code = insunits_raw ? Object.keys(insunits_raw).map((k) => insunits_raw[k])[0] : undefined;

		// Vertices need stitching inside blocks too, not just at the top level.
		Object.keys(doc.blocks).forEach((name) => {
			doc.blocks[name].entities = stitchPolylines(doc.blocks[name].entities);
		});

		const primitives = [];
		walk(stitchPolylines(doc.entities), doc, identity(), 0, primitives, null, false);

		let min_x = Infinity;
		let min_y = Infinity;
		let max_x = -Infinity;
		let max_y = -Infinity;

		const track = (x, y) => {
			if (!isFinite(x) || !isFinite(y)) return;
			if (x < min_x) min_x = x;
			if (y < min_y) min_y = y;
			if (x > max_x) max_x = x;
			if (y > max_y) max_y = y;
		};

		primitives.forEach((p) => {
			if (p.k === 'poly') p.pts.forEach((pt) => track(pt.x, pt.y));
			else if (p.k === 'fill') p.loops.forEach((loop) => loop.forEach((pt) => track(pt.x, pt.y)));
			else if (p.k === 'text') track(p.x, p.y);
		});

		// An empty or unreadable drawing still needs a usable box.
		if (!isFinite(min_x)) {
			min_x = 0;
			min_y = 0;
			max_x = 1;
			max_y = 1;
		}

		return {
			primitives: primitives,
			bbox: {
				min_x: min_x,
				min_y: min_y,
				max_x: max_x,
				max_y: max_y,
				width: max_x - min_x,
				height: max_y - min_y
			},
			stats: {
				entities: doc.entities.length,
				blocks: Object.keys(doc.blocks).length,
				layers: Object.keys(doc.layers).length,
				primitives: primitives.length,
				// How much of the drawing is dimension line-work, which the
				// CloudCAD conversion leaves out by default.
				dimension_primitives: primitives.filter((p) => p.dim).length,
				// What the file says its units are - compared against the
				// configured source units before converting.
				declared_units: insunits_code === undefined ? null : (INSUNITS[insunits_code] || null)
			}
		};
	};

	funcs.run = run;

	return funcs;

})();

module.exports = DXF_FLATTEN;
