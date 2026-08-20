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

	// Folder scanned for the shared, curated .dxf templates. Defaults to the
	// folder holding the project, which is where the samples sit during local
	// testing. Treated as read-only - Quick Draw never writes a drawing here.
	template_dir: process.env.QUICKDRAW_TEMPLATE_DIR
		? path.resolve(process.env.QUICKDRAW_TEMPLATE_DIR)
		: path.join(root, '..'),

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

	cloudcad_url: 'https://platform.skyciv.com/cad',

	// Where saved drawings land in the user's SkyCiv cloud storage.
	cloudcad_save_path: 'quick-draw/'

};
