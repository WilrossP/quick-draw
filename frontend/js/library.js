// The template library view: sidebar categories, search and the card grid.
QUICKDRAW.library = (function () {

	let funcs = {};

	const state = () => QUICKDRAW.state;

	// Text going into markup is escaped here - titles and categories are user
	// editable, so they cannot be trusted as HTML.
	const esc = (value) => jQuery('<div>').text(value === undefined || value === null ? '' : value).html();

	/**
	 * Load the library from the server and draw it.
	 */
	const load = () => {

		jQuery('#qd-grid').html(loadingMarkup());

		return QUICKDRAW.ajax.get('/api/library').then((data) => {

			state().set('templates', data.templates);
			state().set('categories', data.categories);
			state().set('cloudcad_ready', data.cloudcad_ready);

			renderSidebar();
			renderGrid();

		}).catch((error) => {

			jQuery('#qd-grid').html(
				'<div class="ui icon negative message qd-message">' +
				'<i class="warning circle icon"></i>' +
				'<div class="content"><div class="header">Could not load the template library</div>' +
				'<p>' + esc(error.message) + '</p>' +
				'<p>Start the server with <b>npm run dev</b>, then reload this page.</p></div></div>'
			);
		});
	};

	const loadingMarkup = () => {
		let html = '';
		// Placeholder cards keep the grid from collapsing while previews load.
		for (let i = 0; i < 6; i++) {
			html += '<div class="qd-card qd-card-loading"><div class="qd-card-preview"></div>' +
				'<div class="qd-card-body"><div class="qd-line"></div><div class="qd-line short"></div></div></div>';
		}
		return html;
	};

	/* -------------------------------------------------- *
	 * Sidebar
	 * -------------------------------------------------- */

	const renderSidebar = () => {

		const templates = state().get('templates') || [];
		const categories = state().get('categories') || [];
		const active = state().get('category') || 'all';

		const favourites = templates.filter((t) => t.favourite).length;

		let html = '';

		html += categoryItem('all', 'All Templates', templates.length, active, 'th large');
		html += categoryItem('favourites', 'Favourites', favourites, active, 'star');

		if (categories.length) {
			html += '<div class="qd-nav-heading">Categories</div>';
			categories.forEach((category) => {
				html += categoryItem(category.name, category.name, category.count, active, 'folder open outline');
			});
		}

		jQuery('#qd-categories').html(html);
	};

	const categoryItem = (key, label, count, active, icon) => {
		return '<a class="qd-nav-item' + (key === active ? ' active' : '') + '" data-category="' + esc(key) + '">' +
			'<i class="' + icon + ' icon"></i>' +
			'<span class="qd-nav-label">' + esc(label) + '</span>' +
			'<span class="qd-nav-count">' + count + '</span>' +
			'</a>';
	};

	/* -------------------------------------------------- *
	 * Grid
	 * -------------------------------------------------- */

	const renderGrid = () => {

		const visible = state().visibleTemplates();
		const total = (state().get('templates') || []).length;

		jQuery('#qd-result-count').text(
			visible.length === total
				? total + (total === 1 ? ' template' : ' templates')
				: visible.length + ' of ' + total + ' templates'
		);

		if (!visible.length) {
			jQuery('#qd-grid').html(
				'<div class="ui icon message qd-message">' +
				'<i class="search icon"></i>' +
				'<div class="content"><div class="header">No templates match</div>' +
				'<p>Try a different category, or clear the search.</p></div></div>'
			);
			return;
		}

		jQuery('#qd-grid').html(visible.map(cardMarkup).join(''));
	};

	const cardMarkup = (template) => {

		const size = QUICKDRAW.settings.PREVIEW.card;
		const preview = QUICKDRAW.ajax.url(
			'/api/templates/' + encodeURIComponent(template.id) +
			'/preview.svg?width=' + size.width + '&height=' + size.height
		);

		const categories = template.categories.map((category) => {
			return '<span class="ui tiny label qd-label">' + esc(category) + '</span>';
		}).join('');

		const tags = template.tags.map((tag) => {
			return '<span class="ui tiny teal basic label qd-label">' + esc(tag) + '</span>';
		}).join('');

		return '' +
			'<div class="qd-card" data-id="' + esc(template.id) + '">' +

				'<div class="qd-card-preview js-detail" title="Click to enlarge">' +
					'<img src="' + preview + '" alt="Preview of ' + esc(template.title) + '" loading="lazy">' +
					'<button class="qd-favourite js-favourite' + (template.favourite ? ' active' : '') + '" ' +
						'title="' + (template.favourite ? 'Remove from favourites' : 'Add to favourites') + '">' +
						'<i class="' + (template.favourite ? 'star' : 'star outline') + ' icon"></i>' +
					'</button>' +
				'</div>' +

				'<div class="qd-card-body">' +
					'<div class="qd-card-title" title="' + esc(template.title) + '">' + esc(template.title) + '</div>' +
					'<div class="qd-card-meta">' + esc(template.file) + ' &middot; ' + template.size_kb + ' KB</div>' +
					'<div class="qd-card-labels">' + categories + tags + '</div>' +
				'</div>' +

				'<div class="qd-card-actions">' +
					'<button class="ui tiny primary button js-open">' +
						'<i class="external alternate icon"></i> Open in CloudCAD' +
					'</button>' +
					'<button class="ui tiny icon button js-edit" title="Edit title and categories">' +
						'<i class="pencil icon"></i>' +
					'</button>' +
					'<button class="ui tiny icon button js-download" title="Download the DXF">' +
						'<i class="download icon"></i>' +
					'</button>' +
				'</div>' +

			'</div>';
	};

	/* -------------------------------------------------- *
	 * Detail modal
	 * -------------------------------------------------- */

	const openDetail = (id) => {

		const template = state().findTemplate(id);
		if (!template) return;

		const size = QUICKDRAW.settings.PREVIEW.detail;
		const preview = QUICKDRAW.ajax.url(
			'/api/templates/' + encodeURIComponent(id) +
			'/preview.svg?width=' + size.width + '&height=' + size.height
		);

		jQuery('#qd-detail-title').text(template.title);
		jQuery('#qd-detail-preview').html('<img src="' + preview + '" alt="Preview of ' + esc(template.title) + '">');
		jQuery('#qd-detail-stats').html('<div class="qd-stat">Loading drawing details...</div>');
		jQuery('#qd-detail-modal').data('id', id);

		jQuery('#qd-detail-modal').modal('show');

		// The thumbnail the platform file manager picks up is generated from
		// whichever drawing the user last looked at.
		QUICKDRAW.thumbnail.generate(id);

		QUICKDRAW.ajax.get('/api/templates/' + encodeURIComponent(id)).then((detail) => {

			const labels = detail.categories.map((c) => '<span class="ui tiny label qd-label">' + esc(c) + '</span>').join('');

			let html = '';
			html += '<div class="qd-stat"><span>Categories</span><b>' + (labels ? labels : '-') + '</b></div>';
			html += '<div class="qd-stat"><span>File</span><b>' + esc(detail.file) + '</b></div>';
			html += '<div class="qd-stat"><span>Size</span><b>' + detail.size_kb + ' KB</b></div>';

			if (detail.extents) {
				html += '<div class="qd-stat"><span>Extents</span><b>' +
					detail.extents.width + ' &times; ' + detail.extents.height + '</b></div>';
			}

			if (detail.stats) {
				html += '<div class="qd-stat"><span>Blocks</span><b>' + detail.stats.blocks + '</b></div>';
				html += '<div class="qd-stat"><span>Layers</span><b>' + detail.stats.layers + '</b></div>';
				html += '<div class="qd-stat"><span>Entities drawn</span><b>' + detail.stats.primitives + '</b></div>';
			}

			if (detail.description) {
				html += '<div class="qd-stat qd-stat-block"><span>Notes</span><p>' + esc(detail.description) + '</p></div>';
			}

			jQuery('#qd-detail-stats').html(html);

		}).catch((error) => {
			jQuery('#qd-detail-stats').html('<div class="qd-stat">' + esc(error.message) + '</div>');
		});
	};

	/* -------------------------------------------------- *
	 * Events
	 * -------------------------------------------------- */

	const bind = () => {

		// Category selection
		jQuery(document).on('click', '.qd-nav-item', function () {
			state().set('category', jQuery(this).data('category'));
			renderSidebar();
			renderGrid();
		});

		// Search, debounced so the grid is not rebuilt on every keystroke.
		let search_timer = null;
		jQuery(document).on('input', '#qd-search', function () {
			const value = jQuery(this).val();
			clearTimeout(search_timer);
			search_timer = setTimeout(() => {
				state().set('search', value);
				renderGrid();
			}, 150);
		});

		jQuery(document).on('click', '#qd-search-clear', () => {
			jQuery('#qd-search').val('');
			state().set('search', '');
			renderGrid();
		});

		jQuery(document).on('click', '#qd-refresh', () => {
			load();
		});

		// Card actions
		jQuery(document).on('click', '.qd-card .js-detail', function () {
			openDetail(jQuery(this).closest('.qd-card').data('id'));
		});

		jQuery(document).on('click', '.qd-card .js-open', function (event) {
			event.stopPropagation();
			QUICKDRAW.cloudcad.open(jQuery(this).closest('.qd-card').data('id'));
		});

		jQuery(document).on('click', '.qd-card .js-edit', function (event) {
			event.stopPropagation();
			QUICKDRAW.editor.open(jQuery(this).closest('.qd-card').data('id'));
		});

		jQuery(document).on('click', '.qd-card .js-download', function (event) {
			event.stopPropagation();
			download(jQuery(this).closest('.qd-card').data('id'));
		});

		jQuery(document).on('click', '.qd-card .js-favourite', function (event) {
			event.stopPropagation();
			const id = jQuery(this).closest('.qd-card').data('id');
			const template = state().findTemplate(id);
			if (!template) return;
			QUICKDRAW.editor.save(id, { favourite: !template.favourite });
		});

		// Detail modal actions
		jQuery(document).on('click', '#qd-detail-open', function () {
			QUICKDRAW.cloudcad.open(jQuery('#qd-detail-modal').data('id'));
		});

		jQuery(document).on('click', '#qd-detail-edit', function () {
			jQuery('#qd-detail-modal').modal('hide');
			QUICKDRAW.editor.open(jQuery('#qd-detail-modal').data('id'));
		});

		jQuery(document).on('click', '#qd-detail-download', function () {
			download(jQuery('#qd-detail-modal').data('id'));
		});
	};

	const download = (id) => {
		window.open(QUICKDRAW.ajax.url('/api/templates/' + encodeURIComponent(id) + '/download'), '_blank');
	};

	funcs.load = load;
	funcs.bind = bind;
	funcs.renderGrid = renderGrid;
	funcs.renderSidebar = renderSidebar;
	funcs.openDetail = openDetail;
	funcs.esc = esc;

	return funcs;

})();
