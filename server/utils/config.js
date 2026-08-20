// Central configuration for Quick Draw. Everything environment-specific lives
// here so no other module has to read process.env directly.

const path = require('path');

const root = path.join(__dirname, '..', '..');

// The current user is identified by their SkyCiv account. Slugified so it is
// safe to use as a folder name.
const username = process.env.SKYCIV_USERNAME || '';

const user_slug = (username || 'local-user')
	.toLowerCase()
	.replace(/[^a-z0-9]+/g, '-')
	.replace(/^-|-$/g, '');

// Personal drawings live under a per-user folder, kept separate from the shared
// library so one user's work never lands in the curated set.
const personal_root = process.env.QUICKDRAW_PERSONAL_DIR
	? path.resolve(process.env.QUICKDRAW_PERSONAL_DIR)
	: path.join(root, 'personal-templates');

module.exports = {

	// Folder scanned for the shared, curated .dxf templates, which ship with the
	// project. Treated as read-only - Quick Draw never writes a drawing here,
	// so the curated set can only change by someone committing to it.
	template_dir: process.env.QUICKDRAW_TEMPLATE_DIR
		? path.resolve(process.env.QUICKDRAW_TEMPLATE_DIR)
		: path.join(root, 'shared-templates'),

	personal_root: personal_root,

	// This user's own folder. Created on demand, when they first add a drawing.
	personal_dir: path.join(personal_root, user_slug),

	user: {
		username: username,
		slug: user_slug,
		// A friendly name for the UI - the local part of the email.
		label: username ? username.split('@')[0] : 'You'
	},

	// Title and category overrides for the shared library. Personal drawings
	// keep their own overrides inside the user's folder, so two users can never
	// collide and nothing personal leaks into the shared file.
	library_file: path.join(root, 'quick-draw-library.json'),
	personal_library_filename: 'library.json',

	// Cap on an uploaded drawing, and the only extension accepted.
	upload: {
		max_bytes: 25 * 1024 * 1024,
		extension: '.dxf'
	},

	// SkyCiv API credentials. Optional - without them Quick Draw still converts
	// the drawing, it just hands the user the file instead of a live link.
	auth: {
		username: username,
		key: process.env.SKYCIV_KEY || ''
	},

	api: {
		host: 'api.skyciv.com',
		path: '/v3'
	},

	// Mirrors CloudCAD's own DXF import dialog, field for field.
	dxf_import: {

		// Canvas content: always "clear existing items (replace canvas)". A
		// fresh model is created on every hand-off and nothing is opened into
		// the session first, so there is never existing content to merge with.
		// This is structural, not a toggle - see cloudcad-convert.publish.
		replace_canvas: true,

		// Import entities > Dimensions: off. A DXF dimension can only come
		// across as dumb lines and text, never as an editable CloudCAD
		// dimension entity, so importing it leaves clutter that has to be
		// deleted before the drawing can be dimensioned properly.
		dimensions: process.env.QUICKDRAW_IMPORT_DIMENSIONS === '1',

		// DXF units (source). Every coordinate is multiplied by that unit's
		// size in mm, because CloudCAD stores real mm internally. All the
		// sample templates declare $INSUNITS = 4 (mm), so the default is a
		// true 1:1 pass-through.
		source_units: process.env.QUICKDRAW_DXF_UNITS || 'mm',

		// Shift X / Shift Y (mm), applied in the drawing's own sense - a
		// positive shift_y moves content up, as it would in the DXF.
		shift_x: parseFloat(process.env.QUICKDRAW_SHIFT_X || '0') || 0,
		shift_y: parseFloat(process.env.QUICKDRAW_SHIFT_Y || '0') || 0,

		// A text element's `size` per mm of real text height:
		//   size = height_in_mm * text_size_per_mm
		//
		// Measured from CloudCAD's own DXF importer, so this is the authoritative
		// value rather than something inferred. A 250mm label becomes size 11.0,
		// and a 1.3mm one becomes 0.057.
		//
		// (The 108 units-per-size implied by a platform export's `boxHeight` does
		// not apply here - that is the text's line box, and it is not how the
		// importer scales a DXF text height. Trusting it made every label ~4.8x
		// too small. Raise this to grow imported text, lower it to shrink it.)
		text_size_per_mm: parseFloat(process.env.QUICKDRAW_TEXT_SIZE_PER_MM || '') || 0.043989
	},

	cloudcad_url: 'https://platform.skyciv.com/cad',

	// Where saved drawings land in the user's SkyCiv cloud storage.
	cloudcad_save_path: 'quick-draw/'

};
