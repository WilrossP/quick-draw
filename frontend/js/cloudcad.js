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
		if (pending_tab) writeLoadingPage(pending_tab, template.title);

		// Converting a large drawing takes a moment, so the button reports it.
		const button = jQuery('.qd-card[data-id="' + id + '"] .js-open');
		button.addClass('loading disabled');

		QUICKDRAW.ajax.post('/api/templates/' + encodeURIComponent(id) + '/cloudcad').then((result) => {

			if (result.status === 'opened') {
				if (pending_tab && !pending_tab.closed) pending_tab.location = result.url;
				else window.open(result.url, '_blank');
				SKYCIV_UTILS.alert.sideNotify({
					title: 'Opening in CloudCAD',
					content: template.title + ' has been saved to your SkyCiv storage and opened in CloudCAD.',
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

		}).then(() => {
			button.removeClass('loading disabled');
		});
	};

	// A same-origin placeholder for the tab opened ahead of the API call, so it
	// is not left showing a blank white page while the conversion runs.
	const writeLoadingPage = (tab, title) => {
		try {
			tab.document.title = 'Opening in CloudCAD...';
			tab.document.body.style.cssText = 'background:#151d2b;color:#e2e8f0;' +
				'font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;';
			tab.document.body.innerHTML = '<p>Converting <b>' + QUICKDRAW.library.esc(title) +
				'</b> and opening in CloudCAD...</p>';
		} catch (e) {
			// A cross-origin or otherwise locked-down tab just stays blank - not
			// worth failing the whole hand-off over.
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
				summary.texts + ' labels and ' + summary.hatches + ' filled regions.</p>' +
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

	return funcs;

})();
