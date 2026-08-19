// Render flattened DXF primitives to an SVG preview.
//
// DXF y runs up and SVG y runs down, so every y is negated on the way out and
// text is counter-rotated to stay upright.

'use strict';

const SVG_PREVIEW = (function () {

	let funcs = {};

	// Matches the CloudCAD canvas so the preview reads as the same drawing.
	const BACKGROUND = '#151d2b';

	const esc = (s) => String(s)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');

	// Coordinates are rounded to keep the payload small - a preview does not need
	// sub-micron precision and these drawings run to hundreds of thousands of
	// points. The step is derived from the drawing size so a 400mm sheet and a
	// 140m site plan both keep about the same on-screen accuracy.
	const rounder = (diag) => {
		const step = diag / 20000;
		const decimals = Math.max(0, Math.min(3, Math.ceil(-Math.log10(step))));
		const factor = Math.pow(10, decimals);
		return (n) => Math.round(n * factor) / factor;
	};

	// Drop points that land closer together than the eye can separate at preview
	// size. Consecutive-point distance is enough here - the tessellated curves
	// this runs over have no long straight runs for a fuller algorithm to win on.
	const simplify = (pts, tolerance) => {

		if (pts.length < 3 || tolerance <= 0) return pts;

		const out = [pts[0]];
		let last = pts[0];

		for (let i = 1; i < pts.length - 1; i++) {
			const dx = pts[i].x - last.x;
			const dy = pts[i].y - last.y;
			if (dx * dx + dy * dy >= tolerance * tolerance) {
				out.push(pts[i]);
				last = pts[i];
			}
		}

		out.push(pts[pts.length - 1]);

		return out;
	};

	/**
	 * @param {Object} flat - output of dxf-flatten.run
	 * @param {Object} options - { width, height, show_text }
	 * @returns {string} SVG markup
	 */
	const render = (flat, options) => {

		const opts = options || {};
		const width = opts.width || 640;
		const height = opts.height || 440;
		const show_text = opts.show_text === false ? false : true;
		const bbox = flat.bbox;

		// Pad by 3% so strokes at the very edge are not clipped.
		const pad = Math.max(bbox.width, bbox.height) * 0.03 || 1;
		const vb_x = bbox.min_x - pad;
		const vb_y = -(bbox.max_y + pad);
		const vb_w = Math.max(bbox.width + pad * 2, 1e-6);
		const vb_h = Math.max(bbox.height + pad * 2, 1e-6);

		const diag = Math.sqrt(vb_w * vb_w + vb_h * vb_h);
		const stroke = diag / 900;
		const r2 = rounder(diag);

		// Text far below this height turns into unreadable specks at thumbnail
		// scale, so it is dropped rather than rendered as noise.
		const min_text_height = diag * 0.004;

		// Anything finer than roughly half a rendered pixel cannot be seen.
		const tolerance = diag / Math.max(width, height) / 2;

		const parts = [];

		parts.push(
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="' +
			r2(vb_x) + ' ' + r2(vb_y) + ' ' + r2(vb_w) + ' ' + r2(vb_h) + '" ' +
			'width="' + width + '" height="' + height + '" ' +
			'preserveAspectRatio="xMidYMid meet" role="img">'
		);

		parts.push(
			'<rect x="' + r2(vb_x) + '" y="' + r2(vb_y) + '" ' +
			'width="' + r2(vb_w) + '" height="' + r2(vb_h) + '" fill="' + BACKGROUND + '"/>'
		);

		parts.push(
			'<g fill="none" stroke-width="' + r2(stroke) + '" ' +
			'stroke-linecap="round" stroke-linejoin="round">'
		);

		// Fills first, so outlines and labels stay on top of them.
		flat.primitives.forEach((p) => {
			if (p.k !== 'fill') return;
			const d = p.loops.map((loop) => {
				if (loop.length < 3) return '';
				return 'M' + loop.map((pt) => r2(pt.x) + ' ' + r2(-pt.y)).join('L') + 'Z';
			}).join('');
			if (!d) return;
			parts.push(
				'<path d="' + d + '" fill="' + p.color + '" ' +
				'fill-opacity="' + (p.hatch ? 0.28 : 0.75) + '" stroke="none"/>'
			);
		});

		// Paths are grouped by colour so the stroke attribute is written once per
		// colour rather than once per path. Real drawings use a handful of
		// colours across thousands of paths.
		const by_color = {};

		flat.primitives.forEach((p) => {
			if (p.k !== 'poly' || p.pts.length < 2) return;
			const pts = simplify(p.pts, tolerance);
			if (pts.length < 2) return;
			const d = 'M' + pts.map((pt) => r2(pt.x) + ' ' + r2(-pt.y)).join('L') + (p.closed ? 'Z' : '');
			if (!by_color[p.color]) by_color[p.color] = [];
			by_color[p.color].push(d);
		});

		Object.keys(by_color).forEach((color) => {
			parts.push('<path stroke="' + color + '" d="' + by_color[color].join('') + '"/>');
		});

		if (show_text) {
			flat.primitives.forEach((p) => {
				if (p.k !== 'text' || p.h < min_text_height) return;
				const x = r2(p.x);
				const y = r2(-p.y);
				// SVG rotation is clockwise-positive, DXF is counter-clockwise.
				const transform = p.rot
					? ' transform="rotate(' + r2(-p.rot) + ' ' + x + ' ' + y + ')"'
					: '';
				parts.push(
					'<text x="' + x + '" y="' + y + '" fill="' + p.color + '" stroke="none" ' +
					'font-size="' + r2(p.h) + '" font-family="monospace" ' +
					'text-anchor="' + p.anchor + '"' + transform + '>' +
					esc(p.text) + '</text>'
				);
			});
		}

		parts.push('</g></svg>');

		return parts.join('');
	};

	funcs.render = render;
	funcs.BACKGROUND = BACKGROUND;

	return funcs;

})();

module.exports = SVG_PREVIEW;
