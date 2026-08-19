// Settings
QUICKDRAW.settings = (function () {

	let funcs = {};

	// Local port the Quick Draw express server listens on.
	const LOCAL_PORT = 4000;

	// On the platform the API is same-origin, so the base is empty. When the
	// built template is opened straight off disk (npm run build) it has to reach
	// the local server by absolute URL instead.
	const apiBase = () => {

		if (window.location.protocol === 'file:') return 'http://localhost:' + LOCAL_PORT;
		if (!window.location.hostname) return 'http://localhost:' + LOCAL_PORT;

		return '';
	};

	// Preview sizes requested from the server. Cards get a light render, the
	// detail modal a fuller one.
	const PREVIEW = {
		card: { width: 340, height: 230 },
		detail: { width: 1100, height: 760 },
		thumbnail: { width: 500, height: 340 }
	};

	// Categories the editor offers before any custom ones are added. These match
	// the keyword rules the server uses to auto-categorise a new drawing.
	const DEFAULT_CATEGORIES = [
		'Sheet Templates',
		'Foundations',
		'Beams',
		'Columns',
		'Slabs',
		'Stairs',
		'Walls',
		'Connections',
		'Details',
		'Uncategorised'
	];

	funcs.apiBase = apiBase;
	funcs.PREVIEW = PREVIEW;
	funcs.DEFAULT_CATEGORIES = DEFAULT_CATEGORIES;

	return funcs;

})();
