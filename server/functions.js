// Business logic for the Quick Draw endpoints. endpoints.js only routes and
// validates - all the actual work happens here.

'use strict';

const fs = require('fs');

const config = require('./utils/config');
const library = require('./utils/library');
const svg_preview = require('./utils/svg-preview');
const cloudcad = require('./utils/cloudcad-convert');

const FUNCTIONS = (function () {

	let funcs = {};

	// Only the fields the frontend needs - `path` is deliberately not sent.
	const publicEntry = (entry) => ({
		id: entry.id,
		file: entry.file,
		owner: entry.owner,
		writable: entry.writable,
		title: entry.title,
		categories: entry.categories,
		tags: entry.tags,
		description: entry.description,
		favourite: entry.favourite,
		customised: entry.customised,
		size_kb: entry.size_kb,
		modified: entry.modified
	});

	/**
	 * The full library plus the categories in use.
	 */
	const getLibrary = () => {

		const templates = library.list().map(publicEntry);

		return {
			templates: templates,
			categories: library.categories(),
			counts: {
				personal: templates.filter((t) => t.owner === 'personal').length,
				shared: templates.filter((t) => t.owner === 'shared').length
			},
			user: {
				label: config.user.label,
				identified: !!config.user.username
			},
			cloudcad_ready: !!(config.auth.username && config.auth.key),
			// Sent so the frontend never has to hold its own copy of the URL.
			cloudcad_url: config.cloudcad_url
		};
	};

	/**
	 * Add a drawing to the current user's personal folder.
	 */
	const addPersonalTemplate = (original_name, buffer) => {
		const result = library.addPersonal(original_name, buffer);
		if (!result.ok) return result;
		return { ok: true, entry: publicEntry(result.entry) };
	};

	const removePersonalTemplate = (id) => library.removePersonal(id);

	/**
	 * One template's metadata, with geometry stats from the parsed drawing.
	 */
	const getTemplate = (id) => {

		const entry = library.find(id);
		if (!entry) return null;

		const result = publicEntry(entry);

		try {
			const flat = library.flattenOf(entry);
			result.stats = flat.stats;
			result.extents = {
				width: Math.round(flat.bbox.width),
				height: Math.round(flat.bbox.height)
			};
		} catch (e) {
			// A drawing that will not parse should still list and download.
			result.stats = null;
			result.parse_error = e.message;
		}

		return result;
	};

	/**
	 * SVG preview markup for a template.
	 */
	const getPreview = (id, options) => {

		const entry = library.find(id);
		if (!entry) return null;

		const flat = library.flattenOf(entry);

		return svg_preview.render(flat, options);
	};

	/**
	 * The raw DXF file, for download.
	 */
	const getFile = (id) => {

		const entry = library.find(id);
		if (!entry) return null;

		return {
			name: entry.file,
			buffer: fs.readFileSync(entry.path)
		};
	};

	/**
	 * The CloudCAD cad_data object for a template.
	 */
	const getCadData = (id) => {

		const entry = library.find(id);
		if (!entry) return null;

		const flat = library.flattenOf(entry);

		return cloudcad.build(flat, { title: entry.title });
	};

	/**
	 * Convert a template and hand it to CloudCAD.
	 *
	 * With API credentials configured this saves the drawing to the user's
	 * SkyCiv cloud storage and returns a link that opens it. Without them it
	 * still returns the converted cad_data so the frontend can fall back to
	 * downloading the drawing and opening CloudCAD directly.
	 */
	const openInCloudCad = async (id) => {

		const entry = library.find(id);
		if (!entry) return null;

		const flat = library.flattenOf(entry);
		const cad_data = cloudcad.build(flat, { title: entry.title });

		const canvas = cad_data.canvases[0];
		const summary = {
			lines: canvas.lines.length,
			polylines: canvas.polylines.length,
			texts: canvas.texts.length,
			hatches: canvas.hatches.length
		};

		const published = await cloudcad.publish(cad_data, entry.id);

		if (published.ok) {
			return {
				status: 'opened',
				url: published.url,
				public_link: published.public_link,
				summary: summary
			};
		}

		return {
			status: 'converted',
			reason: published.reason,
			detail: published.detail || null,
			cloudcad_url: config.cloudcad_url,
			cad_data: cad_data,
			summary: summary
		};
	};

	funcs.getLibrary = getLibrary;
	funcs.addPersonalTemplate = addPersonalTemplate;
	funcs.removePersonalTemplate = removePersonalTemplate;
	funcs.getTemplate = getTemplate;
	funcs.getPreview = getPreview;
	funcs.getFile = getFile;
	funcs.getCadData = getCadData;
	funcs.openInCloudCad = openInCloudCad;
	funcs.updateTemplate = (id, patch) => {
		const updated = library.update(id, patch);
		return updated ? publicEntry(updated) : null;
	};

	return funcs;

})();

module.exports = FUNCTIONS;
