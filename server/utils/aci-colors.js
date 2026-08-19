// AutoCAD Color Index (ACI) to hex.
//
// Indices 1-9 and the greyscale tail 250-255 are fixed by the spec. Indices
// 10-249 walk a colour cube of 24 hues by 10 shades, reproduced here closely
// rather than exactly - close enough for a preview, and real drawing templates
// overwhelmingly use 1-9 plus ByLayer anyway.

'use strict';

const ACI_COLORS = (function () {

	let funcs = {};

	const FIXED = {
		0: '#ffffff',   // ByBlock - resolved before it reaches here, white as a safety net
		1: '#ff0000',
		2: '#ffff00',
		3: '#00ff00',
		4: '#00ffff',
		5: '#0000ff',
		6: '#ff00ff',
		7: '#ffffff',
		8: '#808080',
		9: '#c0c0c0',
		250: '#333333',
		251: '#5b5b5b',
		252: '#848484',
		253: '#adadad',
		254: '#d6d6d6',
		255: '#ffffff'
	};

	// Shade index within a hue: pairs of full/half saturation, stepping darker.
	const VALUES = [1.0, 1.0, 0.75, 0.75, 0.55, 0.55, 0.40, 0.40, 0.28, 0.28];
	const SATS = [1.0, 0.45, 1.0, 0.45, 1.0, 0.45, 1.0, 0.45, 1.0, 0.45];

	const hsvToHex = (h, s, v) => {

		const c = v * s;
		const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
		const m = v - c;

		let r = 0;
		let g = 0;
		let b = 0;

		if (h < 60) { r = c; g = x; }
		else if (h < 120) { r = x; g = c; }
		else if (h < 180) { g = c; b = x; }
		else if (h < 240) { g = x; b = c; }
		else if (h < 300) { r = x; b = c; }
		else { r = c; b = x; }

		const channel = (n) => {
			const value = Math.round((n + m) * 255);
			return (value < 16 ? '0' : '') + value.toString(16);
		};

		return '#' + channel(r) + channel(g) + channel(b);
	};

	/**
	 * Convert an ACI index to a hex colour.
	 */
	const toHex = (index) => {

		const i = Math.abs(parseInt(index, 10) || 0);

		if (FIXED[i]) return FIXED[i];
		if (i < 10 || i > 249) return '#ffffff';

		const group = i - 10;
		const hue = (Math.floor(group / 10) * 15) % 360;
		const shade = group % 10;

		return hsvToHex(hue, SATS[shade], VALUES[shade]);
	};

	/**
	 * The preview canvas is dark, matching CloudCAD. Pure white and near-black
	 * both need nudging so they stay legible against it.
	 */
	const forDarkCanvas = (hex) => {
		if (hex === '#ffffff') return '#e2e8f0';
		if (hex === '#000000') return '#e2e8f0';
		return hex;
	};

	funcs.toHex = toHex;
	funcs.forDarkCanvas = forDarkCanvas;

	return funcs;

})();

module.exports = ACI_COLORS;
