// The drawing template library: scans the template folder, derives a title and
// categories for each .dxf, and merges in any user overrides.
//
// Only the overrides are ever written to disk, so deleting the overrides file
// simply resets the library to its derived state.

'use strict';

const fs = require('fs');
const path = require('path');

const config = require('./config');
const dxf_parser = require('./dxf-parser');
const dxf_flatten = require('./dxf-flatten');

const LIBRARY = (function () {

	let funcs = {};

	// Filename keyword to category, matched against the file name. Short
	// keywords are anchored on word boundaries so they cannot fire on a
	// substring - without that, "template" reads as a steel "plate" and "rc"
	// turns up inside half the words in the language.
	const CATEGORY_RULES = [
		{ match: /(\b(a0|a1|a2|a3|a4)\b|title.?block|sheet|border|template)/i, category: 'Sheet Templates' },
		{ match: /(isolated|pad|strip|raft|pile|footing|foundation)/i, category: 'Foundations' },
		{ match: /(tie.?beam|beam|girder|lintel)/i, category: 'Beams' },
		{ match: /(column|pier|pedestal)/i, category: 'Columns' },
		{ match: /(slab|deck|floor)/i, category: 'Slabs' },
		{ match: /(stair|step|landing)/i, category: 'Stairs' },
		{ match: /(wall|retaining)/i, category: 'Walls' },
		{ match: /(connection|splice|weld|bolt|baseplate|base.?plate)/i, category: 'Connections' },
		{ match: /(misc|detail|typical|standard|note)/i, category: 'Details' }
	];

	const MATERIAL_RULES = [
		{ match: /(concrete|reinforc|rebar|\brc\b)/i, tag: 'Concrete' },
		{ match: /(steel|\bshs\b|\buc\b|\bub\b|\bplate\b)/i, tag: 'Steel' },
		{ match: /(timber|wood|glulam)/i, tag: 'Timber' },
		{ match: /(masonry|brick|\bblock\b)/i, tag: 'Masonry' }
	];

	const idFromFile = (file) => path.basename(file, path.extname(file))
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');

	const titleFromFile = (file) => path.basename(file, path.extname(file))
		.replace(/[-_]+/g, ' ')
		.replace(/\s+/g, ' ')
		.trim()
		.replace(/\b\w/g, (c) => c.toUpperCase());

	const deriveCategories = (file) => {
		const found = [];
		CATEGORY_RULES.forEach((rule) => {
			if (rule.match.test(file) && found.indexOf(rule.category) === -1) found.push(rule.category);
		});
		// A drawing with no keyword match still needs somewhere to live.
		if (!found.length) found.push('Uncategorised');
		return found;
	};

	const deriveTags = (file) => {
		const found = [];
		MATERIAL_RULES.forEach((rule) => {
			if (rule.match.test(file) && found.indexOf(rule.tag) === -1) found.push(rule.tag);
		});
		return found;
	};

	/* -------------------------------------------------- *
	 * Overrides on disk
	 * -------------------------------------------------- */

	let overrides = {};

	const loadOverrides = () => {
		try {
			if (fs.existsSync(config.library_file)) {
				overrides = JSON.parse(fs.readFileSync(config.library_file, 'utf8'));
			}
		} catch (e) {
			console.warn('[quick-draw] could not read library overrides:', e.message);
			overrides = {};
		}
	};

	const saveOverrides = () => {
		try {
			fs.writeFileSync(config.library_file, JSON.stringify(overrides, null, '\t'), 'utf8');
			return true;
		} catch (e) {
			console.warn('[quick-draw] could not write library overrides:', e.message);
			return false;
		}
	};

	/* -------------------------------------------------- *
	 * Parsed-drawing cache, keyed on file identity
	 * -------------------------------------------------- */

	const cache = {};

	/**
	 * Parse and flatten a template, reusing the cached result while the file on
	 * disk is unchanged. The larger templates take a moment to parse and the
	 * gallery asks for every preview at once.
	 */
	const flattenOf = (entry) => {

		const stat = fs.statSync(entry.path);
		const key = stat.size + ':' + stat.mtimeMs;

		if (cache[entry.id] && cache[entry.id].key === key) return cache[entry.id].flat;

		// DXF is written in a single-byte codepage, not UTF-8.
		const text = fs.readFileSync(entry.path, 'latin1');
		const flat = dxf_flatten.run(dxf_parser.parse(text));

		cache[entry.id] = { key: key, flat: flat };

		return flat;
	};

	/* -------------------------------------------------- *
	 * Library listing
	 * -------------------------------------------------- */

	/**
	 * Every .dxf in the template folder, with its merged metadata.
	 */
	const list = () => {

		let files = [];

		try {
			files = fs.readdirSync(config.template_dir).filter((f) => /\.dxf$/i.test(f));
		} catch (e) {
			console.warn('[quick-draw] cannot read template folder:', e.message);
			return [];
		}

		return files.map((file) => {

			const id = idFromFile(file);
			const full = path.join(config.template_dir, file);
			const stat = fs.statSync(full);
			const custom = overrides[id] || {};

			return {
				id: id,
				file: file,
				path: full,
				title: custom.title || titleFromFile(file),
				categories: custom.categories || deriveCategories(file),
				tags: custom.tags || deriveTags(file),
				description: custom.description || '',
				favourite: !!custom.favourite,
				customised: !!overrides[id],
				size_kb: Math.round(stat.size / 1024),
				modified: new Date(stat.mtimeMs).toISOString()
			};

		}).sort((a, b) => a.title.localeCompare(b.title));
	};

	const find = (id) => {
		const all = list();
		for (let i = 0; i < all.length; i++) {
			if (all[i].id === id) return all[i];
		}
		return null;
	};

	/**
	 * Apply a metadata edit. Only the supplied fields are touched.
	 */
	const update = (id, patch) => {

		const entry = find(id);
		if (!entry) return null;

		const current = overrides[id] || {};

		if (typeof patch.title === 'string' && patch.title.trim()) {
			current.title = patch.title.trim();
		}

		if (Array.isArray(patch.categories)) {
			current.categories = patch.categories
				.map((c) => String(c).trim())
				.filter((c) => c.length)
				.filter((c, i, arr) => arr.indexOf(c) === i);
			if (!current.categories.length) current.categories = ['Uncategorised'];
		}

		if (Array.isArray(patch.tags)) {
			current.tags = patch.tags
				.map((t) => String(t).trim())
				.filter((t) => t.length)
				.filter((t, i, arr) => arr.indexOf(t) === i);
		}

		if (typeof patch.description === 'string') current.description = patch.description.trim();
		if (typeof patch.favourite === 'boolean') current.favourite = patch.favourite;

		overrides[id] = current;
		saveOverrides();

		return find(id);
	};

	/**
	 * Every category in use, with how many templates sit in each.
	 */
	const categories = () => {

		const counts = {};

		list().forEach((entry) => {
			entry.categories.forEach((c) => {
				counts[c] = (counts[c] || 0) + 1;
			});
		});

		return Object.keys(counts).sort().map((name) => ({ name: name, count: counts[name] }));
	};

	loadOverrides();

	funcs.list = list;
	funcs.find = find;
	funcs.update = update;
	funcs.categories = categories;
	funcs.flattenOf = flattenOf;

	return funcs;

})();

module.exports = LIBRARY;
