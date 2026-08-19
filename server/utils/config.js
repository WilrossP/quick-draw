// Central configuration for Quick Draw. Everything environment-specific lives
// here so no other module has to read process.env directly.

const path = require('path');

const root = path.join(__dirname, '..', '..');

module.exports = {

	// Folder scanned for .dxf drawing templates. Defaults to the folder holding
	// the project, which is where the sample templates sit during local testing.
	template_dir: process.env.QUICKDRAW_TEMPLATE_DIR
		? path.resolve(process.env.QUICKDRAW_TEMPLATE_DIR)
		: path.join(root, '..'),

	// User overrides for title/categories are stored here. Deleting this file
	// resets the library back to its auto-derived state.
	library_file: path.join(root, 'quick-draw-library.json'),

	// SkyCiv API credentials. Optional - without them Quick Draw still converts
	// the drawing, it just hands the user the file instead of a live link.
	auth: {
		username: process.env.SKYCIV_USERNAME || '',
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
