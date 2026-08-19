
QUICKDRAW.state = (function () {

	let funcs = {};

	let state = {};

	const get = (key) => {
		return state[key];
	};

	const set = (key, value) => {
		state[key] = value;
	};

	const reset = () => {
		state = {};
	};

	/**
	 * The templates left after the active category, favourites and search
	 * filters are applied. Kept here rather than in the view so the grid and the
	 * result count never disagree.
	 */
	const visibleTemplates = () => {

		const templates = get('templates') || [];
		const category = get('category');
		const search = (get('search') || '').toLowerCase().trim();

		return templates.filter((template) => {

			if (category === 'favourites' && !template.favourite) return false;

			if (category && category !== 'all' && category !== 'favourites') {
				if (template.categories.indexOf(category) === -1) return false;
			}

			if (!search) return true;

			// Match on anything the user can see on the card.
			const haystack = [
				template.title,
				template.file,
				template.description,
				template.categories.join(' '),
				template.tags.join(' ')
			].join(' ').toLowerCase();

			return haystack.indexOf(search) !== -1;
		});
	};

	const findTemplate = (id) => {
		const templates = get('templates') || [];
		for (let i = 0; i < templates.length; i++) {
			if (templates[i].id === id) return templates[i];
		}
		return null;
	};

	// Replace one template in place after an edit, so the grid can re-render
	// without another round trip to the server.
	const replaceTemplate = (template) => {
		const templates = get('templates') || [];
		for (let i = 0; i < templates.length; i++) {
			if (templates[i].id === template.id) {
				templates[i] = template;
				break;
			}
		}
		set('templates', templates);
	};

	funcs.get = get;
	funcs.set = set;
	funcs.reset = reset;
	funcs.visibleTemplates = visibleTemplates;
	funcs.findTemplate = findTemplate;
	funcs.replaceTemplate = replaceTemplate;

	return funcs;

})();
