// Hand a drawing template over to SkyCiv CloudCAD.
//
// The server converts the DXF into a CloudCAD cad_data model. With SkyCiv API
// credentials configured it also saves that model to the user's cloud storage
// and returns a link that opens the drawing directly. Without credentials the
// conversion still happens, and the user is offered the converted model and the
// original DXF to import by hand.
QUICKDRAW.cloudcad = (function () {

	let funcs = {};

	const open = (id) => {

		const template = QUICKDRAW.state.findTemplate(id);
		if (!template) return;

		// The tab has to open synchronously inside this click handler, or the
		// browser's popup blocker silently kills it - by the time the CloudCAD
		// URL comes back from an awaited API call, the click that triggered it
		// is no longer "current" as far as the browser is concerned. Opening a
		// blank tab now and redirecting it once the URL is known keeps the whole
		// thing inside one user gesture.
		const pending_tab = window.open('', '_blank');
		if (pending_tab) writeLoadingPage(pending_tab, template);

		// Converting a large drawing takes a moment, so the button reports it too.
		const button = jQuery('.qd-card[data-id="' + id + '"] .js-open');
		button.addClass('loading disabled');

		// A big template can take several seconds. Saying so beats a spinner that
		// looks stuck.
		let done = false;
		const slow_timer = setTimeout(() => {
			if (!done) {
				setLoadingStatus(pending_tab, 'Still working - larger drawings can take a few seconds.');
			}
		}, QUICKDRAW.settings.SLOW_HANDOFF_MS);

		const finish = () => {
			done = true;
			clearTimeout(slow_timer);
			button.removeClass('loading disabled');
		};

		QUICKDRAW.ajax.post('/api/templates/' + encodeURIComponent(id) + '/cloudcad').then((result) => {

			if (result.status === 'opened') {
				// Handing over to CloudCAD - say so before the tab navigates, so
				// the page never sits on a finished-looking spinner.
				setLoadingStatus(pending_tab, 'Opening the drawing...');
				if (pending_tab && !pending_tab.closed) pending_tab.location = result.url;
				else window.open(result.url, '_blank');
				SKYCIV_UTILS.alert.sideNotify({
					title: 'Opening in CloudCAD',
					content: template.title + ' has been saved to your SkyCiv storage and opened in CloudCAD.' +
						dimensionNote(result.summary),
					type: 'success'
				});
				return;
			}

			if (pending_tab && !pending_tab.closed) pending_tab.close();
			showFallback(template, result);

		}).catch((error) => {

			if (pending_tab && !pending_tab.closed) pending_tab.close();

			SKYCIV_UTILS.alert({
				title: 'Could not open in CloudCAD',
				content: error.message,
				showClose: true
			});

		}).then(finish);
	};

	// Dimensions are deliberately left out of the import, so a drawing arriving
	// without them is never a surprise. A drawing whose own declared units
	// disagree with the configured source units is worth flagging too, since
	// that lands the geometry at the wrong scale.
	const dimensionNote = (summary) => {

		if (!summary) return '';

		let note = '';

		if (!summary.dimensions_imported && summary.dimensions_skipped) {
			note += ' Dimensions were not imported (' + summary.dimensions_skipped + ' items left out).';
		}

		if (summary.declared_units && summary.source_units &&
			summary.declared_units !== summary.source_units) {
			note += ' Warning: this drawing declares its units as ' + summary.declared_units +
				', but the import is set to ' + summary.source_units +
				' - the geometry may be at the wrong scale.';
		}

		return note;
	};

	// A same-origin placeholder for the tab opened ahead of the API call, so it
	// is not left showing a blank white page while the conversion runs.
	// The loading page is a standalone document in a brand new tab, so it cannot
	// use the platform's stylesheets - everything it needs is inlined here.
	const loadingStyles = () => {
		return '' +
			'*{box-sizing:border-box}' +
			'body{margin:0;height:100vh;display:flex;align-items:center;justify-content:center;' +
				'background:' + QUICKDRAW.settings.CANVAS_COLOUR + ';color:#e2e8f0;' +
				'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}' +
			'.qd-load{text-align:center;padding:32px;max-width:460px}' +
			'.qd-logo{width:40px;height:40px;opacity:.95}' +
			// The drawing being opened, so the tab is clearly about this template.
			'.qd-shot{margin:20px auto 0;width:100%;max-width:380px;border:1px solid rgba(255,255,255,.1);' +
				'border-radius:6px;overflow:hidden;background:rgba(0,0,0,.25)}' +
			'.qd-shot img{display:block;width:100%;height:auto;opacity:.9}' +
			'.qd-spin{width:34px;height:34px;margin:24px auto 0;border-radius:50%;' +
				'border:3px solid rgba(255,255,255,.14);border-top-color:#2185d0;' +
				'animation:qd-rot .8s linear infinite}' +
			'@keyframes qd-rot{to{transform:rotate(360deg)}}' +
			'h1{margin:18px 0 4px;font-size:1.08rem;font-weight:600;letter-spacing:.01em}' +
			'.qd-name{margin:0;color:#9fb0c8;font-size:.9rem}' +
			'.qd-status{margin:14px 0 0;color:#75849c;font-size:.8rem;min-height:1.2em}' +
			// Respect a reduced-motion preference rather than animating regardless.
			'@media(prefers-reduced-motion:reduce){.qd-spin{animation:none;' +
				'border-top-color:rgba(255,255,255,.14)}}';
	};

	/**
	 * Paint a branded loading page into the tab opened ahead of the API call, so
	 * it shows the drawing being converted rather than a blank white page.
	 */
	const loadingHtml = (template) => {

		const size = QUICKDRAW.settings.PREVIEW.card;
		const preview = QUICKDRAW.ajax.url(
			'/api/templates/' + encodeURIComponent(template.id) +
			'/preview.svg?width=' + size.width + '&height=' + size.height
		);

		return '' +
				'<!doctype html><html lang="en"><head><meta charset="utf-8">' +
				'<meta name="viewport" content="width=device-width,initial-scale=1">' +
				'<title>Opening in CloudCAD...</title>' +
				'<style>' + loadingStyles() + '</style>' +
				'</head><body>' +
					'<div class="qd-load">' +
						'<img class="qd-logo" src="' + QUICKDRAW.settings.LOGO_URL + '" alt="SkyCiv">' +
						'<div class="qd-shot"><img src="' + preview + '" alt=""></div>' +
						'<div class="qd-spin"></div>' +
						'<h1>Opening in CloudCAD</h1>' +
						'<p class="qd-name">' + QUICKDRAW.library.esc(template.title) + '</p>' +
						'<p class="qd-status" id="qd-status">Converting the drawing...</p>' +
					'</div>' +
				'</body></html>';
	};

	const writeLoadingPage = (tab, template) => {

		try {
			// document.write builds a complete document in a fresh about:blank
			// tab, which setting innerHTML alone does not.
			tab.document.open();
			tab.document.write(loadingHtml(template));
			tab.document.close();

		} catch (e) {
			// A cross-origin or otherwise locked-down tab just stays blank - not
			// worth failing the whole hand-off over.
		}
	};

	// Once the tab navigates to CloudCAD it is cross-origin and unreachable, so
	// every touch of it has to tolerate throwing.
	const setLoadingStatus = (tab, text) => {
		try {
			if (!tab || tab.closed) return;
			const el = tab.document.getElementById('qd-status');
			if (el) el.textContent = text;
		} catch (e) {
			// Already navigated away - nothing to update.
		}
	};

	/**
	 * Shown when the drawing converted but could not be saved to the cloud -
	 * almost always because no API credentials are configured.
	 */
	const showFallback = (template, result) => {

		const base = QUICKDRAW.settings.apiBase();
		const cad_url = base + '/api/templates/' + encodeURIComponent(template.id) + '/cad-data?download=1';
		const dxf_url = base + '/api/templates/' + encodeURIComponent(template.id) + '/download';

		// A string detail is a message from SkyCiv itself - almost always more
		// useful than the reason code, so it is shown verbatim.
		let reason = 'The drawing converted, but SkyCiv did not return a link (' + result.reason + ').';

		if (result.reason === 'no-credentials') {
			reason = 'No SkyCiv API credentials are configured on the server, so the drawing could not be saved to your cloud storage automatically.';
		} else if (typeof result.detail === 'string' && result.detail.length) {
			reason = 'SkyCiv said: <b>' + QUICKDRAW.library.esc(result.detail) + '</b>';
		}

		// The setup hint only helps when credentials are the thing missing.
		const hint = result.reason === 'no-credentials'
			? '<p>Add <code>SKYCIV_USERNAME</code> and <code>SKYCIV_KEY</code> to the server <code>.env</code> ' +
				'and restart it, to have Quick Draw open drawings in CloudCAD in one click.</p>'
			: '';

		const summary = result.summary;

		SKYCIV_UTILS.alert({
			title: 'Ready for CloudCAD',
			content:
				'<p><b>' + QUICKDRAW.library.esc(template.title) + '</b> converted successfully into ' +
				summary.lines + ' lines, ' + summary.polylines + ' curves, ' +
				summary.texts + ' labels and ' + summary.hatches + ' filled regions.' +
				dimensionNote(summary) + '</p>' +
				'<p>' + reason + '</p>' + hint,
			buttons: {
				'Open CloudCAD': function () {
					window.open(result.cloudcad_url, '_blank');
				},
				'Download CAD Model': function () {
					window.open(cad_url, '_blank');
				},
				'Download DXF': function () {
					window.open(dxf_url, '_blank');
				}
			},
			showClose: true,
			closeName: 'Cancel'
		});
	};

	funcs.open = open;
	// Exported so the loading page can be rendered and reviewed on its own.
	funcs.loadingHtml = loadingHtml;

	return funcs;

})();
