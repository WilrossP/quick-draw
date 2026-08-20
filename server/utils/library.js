// The drawing template library.
//
// Two scopes are scanned and presented as one list:
//   shared   - the curated .dxf folder, treated as read-only
//   personal - the current user's own folder, which they can add to and remove from
//
// Titles and categories are derived from the file name on first scan, then
// merged with any user overrides. Only overrides are written to disk, so
// deleting an overrides file resets that scope to its derived state without
// touching a drawing. The shared scope keeps its overrides beside the project;
// the personal scope keeps its own inside the user's folder, so two users can
// never collide.

'use strict';

const fs = require('fs');
const path = require('path');

const config = require('./config');
const dxf_parser = require('./dxf-parser');
const dxf_flatten = require('./dxf-flatten');

const LIBRARY = (function () {

	let funcs = {};

	// Personal ids carry this prefix so they can never collide with a shared id.
	// The separator cannot appear in a generated slug, which strips everything
	// outside a-z, 0-9 and the hyphen.
	const PERSONAL_PREFIX = 'my~';

	const SCOPES = {
		shared: {
			key: 'shared',
			prefix: '',
			writable: false,
			dir: () => config.template_dir,
			overridesFile: () => config.library_file
		},
		personal: {
			key: 'personal',
			prefix: PERSONAL_PREFIX,
			writable: true,
			dir: () => config.personal_dir,
			overridesFile: () => path.join(config.personal_dir, config.personal_library_filename)
		}
	};

	// Filename keyword to category, matched against the file name. Short
	// keywords are anchored on word boundaries so they cannot fire on a
	// substring - without that, "template" reads as a steel "plate" and "rc"
	// turns up inside half the words in the language.
	const CATEGORY_RULES = [
		{ match: /(\b(a0|a1|a2|a3|a4)\b|\b20x30\b|title.?block|sheet|border|template)/i, category: 'Sheet Templates' },
		{ match: /(isolated|pad|strip|raft|pile|footing|foundation)/i, category: 'Foundations' },
		{ match: /(tie.?beam|beam|girder|lintel)/i, category: 'Beams' },
		{ match: /(column|pier|pedestal)/i, category: 'Columns' },
		{ match: /(slab|deck|floor)/i, category: 'Slabs' },
		{ match: /(stair|step|landing)/i, category: 'Stairs' },
		{ match: /(wall|retaining)/i, category: 'Walls' },
		{ match: /(roof|truss|purlin|rafter|eave|ridge)/i, category: 'Roof' },
		{ match: /(steel|\bsection\b|\bshs\b|\buc\b|\bub\b)/i, category: 'Steel' },
		{ match: /(connection|splice|weld|bolt|baseplate|base.?plate)/i, category: 'Connections' },
		// Miscellaneous is also the fallback below, so a drawing that matches
		// nothing lands here rather than in a category of its own.
		{ match: /(misc|typical|standard|note)/i, category: 'Miscellaneous' }
	];

	const MATERIAL_RULES = [
		{ match: /(concrete|reinforc|rebar|\brc\b)/i, tag: 'Concrete' },
		{ match: /(steel|\bshs\b|\buc\b|\bub\b|\bplate\b)/i, tag: 'Steel' },
		{ match: /(timber|wood|glulam)/i, tag: 'Timber' },
		{ match: /(masonry|brick|\bblock\b)/i, tag: 'Masonry' }
	];

	const slugFromFile = (file) => path.basename(file, path.extname(file))
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
		if (!found.length) found.push('Miscellaneous');
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
	 * Overrides on disk, one file per scope
	 * -------------------------------------------------- */

	const readOverrides = (scope) => {
		const file = scope.overridesFile();
		try {
			if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'));
		} catch (e) {
			console.warn('[quick-draw] could not read overrides for', scope.key + ':', e.message);
		}
		return {};
	};

	const writeOverrides = (scope, overrides) => {
		const file = scope.overridesFile();
		try {
			fs.mkdirSync(path.dirname(file), { recursive: true });
			fs.writeFileSync(file, JSON.stringify(overrides, null, '\t'), 'utf8');
			return true;
		} catch (e) {
			console.warn('[quick-draw] could not write overrides for', scope.key + ':', e.message);
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
	 * Listing
	 * -------------------------------------------------- */

	const listScope = (scope) => {

		const dir = scope.dir();
		let files = [];

		try {
			files = fs.readdirSync(dir).filter((f) => /\.dxf$/i.test(f));
		} catch (e) {
			// A personal folder that does not exist yet is normal, not an error.
			if (e.code !== 'ENOENT') {
				console.warn('[quick-draw] cannot read', scope.key, 'folder:', e.message);
			}
			return [];
		}

		const overrides = readOverrides(scope);

		return files.map((file) => {

			const slug = slugFromFile(file);
			const full = path.join(dir, file);
			const stat = fs.statSync(full);
			const custom = overrides[slug] || {};

			return {
				id: scope.prefix + slug,
				slug: slug,
				owner: scope.key,
				writable: scope.writable,
				file: file,
				path: full,
				title: custom.title || titleFromFile(file),
				categories: custom.categories || deriveCategories(file),
				tags: custom.tags || deriveTags(file),
				description: custom.description || '',
				favourite: !!custom.favourite,
				customised: !!overrides[slug],
				size_kb: Math.round(stat.size / 1024),
				modified: new Date(stat.mtimeMs).toISOString()
			};
		});
	};

	/**
	 * Every template across both scopes, personal first.
	 */
	const list = () => {

		const personal = listScope(SCOPES.personal).sort((a, b) => a.title.localeCompare(b.title));
		const shared = listScope(SCOPES.shared).sort((a, b) => a.title.localeCompare(b.title));

		return personal.concat(shared);
	};

	const scopeOfId = (id) => {
		return String(id).indexOf(PERSONAL_PREFIX) === 0 ? SCOPES.personal : SCOPES.shared;
	};

	const find = (id) => {
		const all = list();
		for (let i = 0; i < all.length; i++) {
			if (all[i].id === id) return all[i];
		}
		return null;
	};

	/**
	 * Apply a metadata edit. Only the supplied fields are touched, and the edit
	 * is written to the overrides file for that template's own scope.
	 */
	const update = (id, patch) => {

		const entry = find(id);
		if (!entry) return null;

		const scope = scopeOfId(id);
		const overrides = readOverrides(scope);
		const current = overrides[entry.slug] || {};

		if (typeof patch.title === 'string' && patch.title.trim()) {
			current.title = patch.title.trim();
		}

		if (Array.isArray(patch.categories)) {
			current.categories = patch.categories
				.map((c) => String(c).trim())
				.filter((c) => c.length)
				.filter((c, i, arr) => arr.indexOf(c) === i);
			if (!current.categories.length) current.categories = ['Miscellaneous'];
		}

		if (Array.isArray(patch.tags)) {
			current.tags = patch.tags
				.map((t) => String(t).trim())
				.filter((t) => t.length)
				.filter((t, i, arr) => arr.indexOf(t) === i);
		}

		if (typeof patch.description === 'string') current.description = patch.description.trim();
		if (typeof patch.favourite === 'boolean') current.favourite = patch.favourite;

		overrides[entry.slug] = current;
		writeOverrides(scope, overrides);

		return find(id);
	};

	/* -------------------------------------------------- *
	 * Personal templates
	 * -------------------------------------------------- */

	// Reduce whatever the browser sent to a bare, safe file name. Directory
	// separators and traversal segments are stripped rather than escaped, so
	// nothing can be written outside the user's own folder.
	const safeFileName = (name) => {

		const base = path.basename(String(name || '')).replace(/\\/g, '/');
		const stem = base.replace(/\.dxf$/i, '')
			.replace(/[^A-Za-z0-9 _.-]+/g, '-')
			.replace(/\.+/g, '.')
			.replace(/^[.-]+|[.-]+$/g, '')
			.trim();

		return (stem || 'drawing') + config.upload.extension;
	};

	/**
	 * Add a drawing to the current user's personal folder.
	 *
	 * The file is parsed before it is kept, so a drawing that cannot be read is
	 * rejected up front rather than sitting in the library as a broken card.
	 *
	 * @returns {Object} { ok, entry } or { ok: false, message }
	 */
	const addPersonal = (original_name, buffer) => {

		if (!buffer || !buffer.length) {
			return { ok: false, message: 'The uploaded file was empty.' };
		}

		if (buffer.length > config.upload.max_bytes) {
			return {
				ok: false,
				message: 'That drawing is larger than the ' +
					Math.round(config.upload.max_bytes / 1024 / 1024) + ' MB limit.'
			};
		}

		if (!/\.dxf$/i.test(String(original_name || ''))) {
			return { ok: false, message: 'Only .dxf drawings can be added.' };
		}

		// Confirm it is a readable DXF with something in it before keeping it.
		let flat = null;
		try {
			flat = dxf_flatten.run(dxf_parser.parse(buffer.toString('latin1')));
		} catch (e) {
			return { ok: false, message: 'That file could not be read as a DXF drawing.' };
		}

		if (!flat.primitives.length) {
			return { ok: false, message: 'That DXF has no drawable geometry in it.' };
		}

		const dir = config.personal_dir;

		try {
			fs.mkdirSync(dir, { recursive: true });
		} catch (e) {
			return { ok: false, message: 'Could not create your personal folder: ' + e.message };
		}

		// Never overwrite an existing drawing - number the new one instead.
		let file = safeFileName(original_name);
		if (fs.existsSync(path.join(dir, file))) {
			const stem = file.replace(/\.dxf$/i, '');
			let n = 2;
			while (fs.existsSync(path.join(dir, stem + '-' + n + config.upload.extension))) n++;
			file = stem + '-' + n + config.upload.extension;
		}

		try {
			fs.writeFileSync(path.join(dir, file), buffer);
		} catch (e) {
			return { ok: false, message: 'Could not save the drawing: ' + e.message };
		}

		return { ok: true, entry: find(PERSONAL_PREFIX + slugFromFile(file)) };
	};

	/**
	 * Delete one of the current user's own drawings. Shared templates are never
	 * removable - the curated set is read-only.
	 */
	const removePersonal = (id) => {

		const entry = find(id);
		if (!entry) return { ok: false, message: 'Template not found.' };

		if (entry.owner !== 'personal') {
			return { ok: false, message: 'Shared templates cannot be deleted.' };
		}

		// Guard against a path that somehow points outside the personal folder.
		const dir = path.resolve(config.personal_dir);
		if (path.resolve(entry.path).indexOf(dir + path.sep) !== 0) {
			return { ok: false, message: 'That drawing is outside your personal folder.' };
		}

		try {
			fs.unlinkSync(entry.path);
		} catch (e) {
			return { ok: false, message: 'Could not delete the drawing: ' + e.message };
		}

		// Drop its metadata too, so a later drawing with the same name starts clean.
		const scope = SCOPES.personal;
		const overrides = readOverrides(scope);
		if (overrides[entry.slug]) {
			delete overrides[entry.slug];
			writeOverrides(scope, overrides);
		}

		delete cache[entry.id];

		return { ok: true, id: entry.id, title: entry.title };
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

	funcs.list = list;
	funcs.find = find;
	funcs.update = update;
	funcs.categories = categories;
	funcs.flattenOf = flattenOf;
	funcs.addPersonal = addPersonal;
	funcs.removePersonal = removePersonal;

	return funcs;

})();

module.exports = LIBRARY;
