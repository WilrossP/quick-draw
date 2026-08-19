// ASCII DXF tokenizer and parser.
//
// A DXF file is a flat stream of (group code, value) pairs, one per two lines.
// This module turns that stream into { header, layers, blocks, entities } and
// exposes the small readers other modules need to pull values back out of an
// entity record.

'use strict';

const DXF_PARSER = (function () {

	let funcs = {};

	const tokenize = (text) => {
		const lines = text.split(/\r\n|\r|\n/);
		const pairs = [];
		for (let i = 0; i + 1 < lines.length; i += 2) {
			const code = parseInt(lines[i].trim(), 10);
			if (isNaN(code)) continue;
			pairs.push([code, lines[i + 1]]);
		}
		return pairs;
	};

	// Split a pair stream into entity records. Every record starts on a code 0.
	const readEntities = (pairs, from, to) => {
		const entities = [];
		let current = null;
		for (let i = from; i < to; i++) {
			const code = pairs[i][0];
			const value = pairs[i][1];
			if (code === 0) {
				if (value === 'ENDSEC' || value === 'ENDBLK') break;
				current = { type: value.trim(), pairs: [] };
				entities.push(current);
			} else if (current) {
				current.pairs.push([code, value]);
			}
		}
		return entities;
	};

	// Entities carry repeated group codes (polyline vertices, spline points), so
	// the raw ordered pair list is kept and these readers work over it.

	const num = (ent, code, fallback) => {
		for (let i = 0; i < ent.pairs.length; i++) {
			if (ent.pairs[i][0] === code) {
				const v = parseFloat(ent.pairs[i][1]);
				if (!isNaN(v)) return v;
			}
		}
		return fallback;
	};

	const str = (ent, code, fallback) => {
		for (let i = 0; i < ent.pairs.length; i++) {
			if (ent.pairs[i][0] === code) return ent.pairs[i][1];
		}
		return fallback;
	};

	const all = (ent, code) => {
		const out = [];
		for (let i = 0; i < ent.pairs.length; i++) {
			if (ent.pairs[i][0] === code) out.push(ent.pairs[i][1]);
		}
		return out;
	};

	// Collect coordinate runs that share an index, e.g. repeated (10,20) vertex
	// pairs. Codes arrive interleaved, so walk in order and close off the
	// current point each time the x code comes round again.
	const points = (ent, x_code, y_code, extra_code) => {
		const out = [];
		let pt = null;
		for (let i = 0; i < ent.pairs.length; i++) {
			const code = ent.pairs[i][0];
			const value = parseFloat(ent.pairs[i][1]);
			if (code === x_code) {
				if (pt) out.push(pt);
				pt = { x: value, y: 0, extra: 0 };
			} else if (code === y_code && pt) {
				pt.y = value;
			} else if (extra_code !== undefined && code === extra_code && pt) {
				pt.extra = value;
			}
		}
		if (pt) out.push(pt);
		return out;
	};

	// $EXTMIN / $EXTMAX are read as a hint only. The real bounding box is
	// measured from the geometry, because saved extents are routinely stale or
	// still cover erased entities.
	const readHeader = (pairs, from, to, out) => {
		for (let i = from; i < to; i++) {
			if (pairs[i][0] !== 9) continue;
			const key = pairs[i][1].trim();
			if (key === '$EXTMIN' || key === '$EXTMAX' || key === '$INSUNITS') {
				const vals = {};
				for (let j = i + 1; j < to && pairs[j][0] !== 9; j++) {
					vals[pairs[j][0]] = parseFloat(pairs[j][1]);
				}
				out[key] = vals;
			}
		}
	};

	const readLayers = (pairs, from, to, out) => {
		let in_layer_table = false;
		let current = null;
		for (let i = from; i < to; i++) {
			const code = pairs[i][0];
			const value = pairs[i][1];
			if (code === 0 && value === 'TABLE') {
				in_layer_table = pairs[i + 1] && pairs[i + 1][0] === 2 && pairs[i + 1][1].trim() === 'LAYER';
				current = null;
			} else if (code === 0 && value === 'ENDTAB') {
				in_layer_table = false;
				current = null;
			} else if (in_layer_table && code === 0 && value === 'LAYER') {
				current = { name: '', color: 7, line_type: 'CONTINUOUS' };
			} else if (current) {
				if (code === 2) {
					current.name = value.trim();
					out[current.name] = current;
				} else if (code === 62) {
					// A negative colour means the layer is switched off, but the
					// index itself is still the absolute value.
					current.color = Math.abs(parseInt(value.trim(), 10));
				} else if (code === 6) {
					current.line_type = value.trim();
				}
			}
		}
	};

	const readBlocks = (pairs, from, to, out) => {
		let i = from;
		while (i < to) {

			if (!(pairs[i][0] === 0 && pairs[i][1] === 'BLOCK')) {
				i++;
				continue;
			}

			const block = { name: '', base: { x: 0, y: 0 }, entities: [] };

			// The block header runs until the first nested code 0.
			let j = i + 1;
			while (j < to && pairs[j][0] !== 0) {
				if (pairs[j][0] === 2 && !block.name) block.name = pairs[j][1].trim();
				else if (pairs[j][0] === 10) block.base.x = parseFloat(pairs[j][1]);
				else if (pairs[j][0] === 20) block.base.y = parseFloat(pairs[j][1]);
				j++;
			}

			let end = j;
			while (end < to && !(pairs[end][0] === 0 && pairs[end][1] === 'ENDBLK')) end++;

			block.entities = readEntities(pairs, j, end);
			if (block.name) out[block.name] = block;

			i = end + 1;
		}
	};

	/**
	 * Parse a DXF document.
	 * @param {string} text - raw DXF file contents (read as latin1)
	 * @returns {Object} { header, layers, blocks, entities }
	 */
	const parse = (text) => {

		const pairs = tokenize(text);

		const doc = {
			header: {},
			layers: {},
			blocks: {},
			entities: []
		};

		let i = 0;
		while (i < pairs.length) {

			if (pairs[i][0] !== 0 || pairs[i][1] !== 'SECTION') {
				i++;
				continue;
			}

			// The section name is the code 2 immediately after SECTION.
			let name = '';
			if (pairs[i + 1] && pairs[i + 1][0] === 2) name = pairs[i + 1][1].trim();

			let end = i + 2;
			while (end < pairs.length && !(pairs[end][0] === 0 && pairs[end][1] === 'ENDSEC')) end++;

			if (name === 'HEADER') readHeader(pairs, i + 2, end, doc.header);
			else if (name === 'TABLES') readLayers(pairs, i + 2, end, doc.layers);
			else if (name === 'BLOCKS') readBlocks(pairs, i + 2, end, doc.blocks);
			else if (name === 'ENTITIES') doc.entities = readEntities(pairs, i + 2, end);

			i = end + 1;
		}

		return doc;
	};

	funcs.parse = parse;
	funcs.num = num;
	funcs.str = str;
	funcs.all = all;
	funcs.points = points;

	return funcs;

})();

module.exports = DXF_PARSER;
