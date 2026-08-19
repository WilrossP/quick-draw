// Editing a template's title, categories, tags and notes.
QUICKDRAW.editor = (function () {

	let funcs = {};

	/**
	 * Build the category dropdown options from the defaults plus everything
	 * already in use, so existing categories stay one click away.
	 */
	const categoryOptions = (selected) => {

		const used = (QUICKDRAW.state.get('categories') || []).map((c) => c.name);
		const all = QUICKDRAW.settings.DEFAULT_CATEGORIES.concat(used).concat(selected || []);
		const unique = all.filter((c, i, arr) => arr.indexOf(c) === i).sort();

		return unique.map((category) => {
			const is_selected = (selected || []).indexOf(category) !== -1;
			return '<option value="' + QUICKDRAW.library.esc(category) + '"' +
				(is_selected ? ' selected' : '') + '>' + QUICKDRAW.library.esc(category) + '</option>';
		}).join('');
	};

	const open = (id) => {

		const template = QUICKDRAW.state.findTemplate(id);
		if (!template) return;

		jQuery('#qd-edit-modal').data('id', id);
		jQuery('#qd-edit-title').val(template.title);
		jQuery('#qd-edit-description').val(template.description);
		jQuery('#qd-edit-file').text(template.file);

		jQuery('#qd-edit-categories').html(categoryOptions(template.categories));
		jQuery('#qd-edit-tags').html(categoryOptions(template.tags));

		// allowAdditions lets the user type a category that does not exist yet.
		jQuery('#qd-edit-categories').parent('.ui.dropdown').dropdown('destroy');
		jQuery('#qd-edit-tags').parent('.ui.dropdown').dropdown('destroy');

		jQuery('#qd-edit-categories').parent('.ui.dropdown').dropdown({ allowAdditions: true });
		jQuery('#qd-edit-tags').parent('.ui.dropdown').dropdown({ allowAdditions: true });

		jQuery('#qd-edit-categories').parent('.ui.dropdown').dropdown('set exactly', template.categories);
		jQuery('#qd-edit-tags').parent('.ui.dropdown').dropdown('set exactly', template.tags);

		jQuery('#qd-edit-modal').modal('show');
	};

	/**
	 * Send a metadata patch to the server and refresh what is on screen.
	 */
	const save = (id, patch) => {

		return QUICKDRAW.ajax.post('/api/templates/' + encodeURIComponent(id), patch).then((updated) => {

			QUICKDRAW.state.replaceTemplate(updated);

			// Categories may have appeared or emptied out, so the sidebar counts
			// are refetched rather than guessed at.
			return QUICKDRAW.ajax.get('/api/library').then((data) => {
				QUICKDRAW.state.set('categories', data.categories);
				QUICKDRAW.library.renderSidebar();
				QUICKDRAW.library.renderGrid();
				return updated;
			});

		}).catch((error) => {
			SKYCIV_UTILS.alert.sideNotify({
				title: 'Could not save',
				content: error.message,
				type: 'error'
			});
		});
	};

	const submit = () => {

		const id = jQuery('#qd-edit-modal').data('id');
		const title = jQuery('#qd-edit-title').val();

		if (!title || !title.trim()) {
			SKYCIV_UTILS.alert.sideNotify({
				title: 'Title required',
				content: 'Give the template a title before saving.',
				type: 'warning'
			});
			return;
		}

		const patch = {
			title: title,
			description: jQuery('#qd-edit-description').val(),
			categories: jQuery('#qd-edit-categories').parent('.ui.dropdown').dropdown('get values'),
			tags: jQuery('#qd-edit-tags').parent('.ui.dropdown').dropdown('get values')
		};

		save(id, patch).then(() => {
			jQuery('#qd-edit-modal').modal('hide');
			SKYCIV_UTILS.alert.sideNotify({
				title: 'Template updated',
				content: patch.title + ' has been saved.',
				type: 'success'
			});
		});
	};

	const bind = () => {
		jQuery(document).on('click', '#qd-edit-save', submit);
	};

	funcs.open = open;
	funcs.save = save;
	funcs.bind = bind;

	return funcs;

})();
