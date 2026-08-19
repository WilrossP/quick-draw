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

		// Converting a large drawing takes a moment, so the button reports it.
		const button = jQuery('.qd-card[data-id="' + id + '"] .js-open');
		button.addClass('loading disabled');

		QUICKDRAW.ajax.post('/api/templates/' + encodeURIComponent(id) + '/cloudcad').then((result) => {

			if (result.status === 'opened') {
				window.open(result.url, '_blank');
				SKYCIV_UTILS.alert.sideNotify({
					title: 'Opening in CloudCAD',
					content: template.title + ' has been saved to your SkyCiv storage and opened in CloudCAD.',
					type: 'success'
				});
				return;
			}

			showFallback(template, result);

		}).catch((error) => {

			SKYCIV_UTILS.alert({
				title: 'Could not open in CloudCAD',
				content: error.message,
				showClose: true
			});

		}).then(() => {
			button.removeClass('loading disabled');
		});
	};

	/**
	 * Shown when the drawing converted but could not be saved to the cloud -
	 * almost always because no API credentials are configured.
	 */
	const showFallback = (template, result) => {

		const base = QUICKDRAW.settings.apiBase();
		const cad_url = base + '/api/templates/' + encodeURIComponent(template.id) + '/cad-data?download=1';
		const dxf_url = base + '/api/templates/' + encodeURIComponent(template.id) + '/download';

		const reason = result.reason === 'no-credentials'
			? 'No SkyCiv API credentials are configured on the server, so the drawing could not be saved to your cloud storage automatically.'
			: 'The drawing converted, but SkyCiv did not return a link (' + result.reason + ').';

		const summary = result.summary;

		SKYCIV_UTILS.alert({
			title: 'Ready for CloudCAD',
			content:
				'<p><b>' + QUICKDRAW.library.esc(template.title) + '</b> converted successfully into ' +
				summary.lines + ' lines, ' + summary.polylines + ' curves, ' +
				summary.texts + ' labels and ' + summary.hatches + ' filled regions.</p>' +
				'<p>' + reason + '</p>' +
				'<p>Add <code>SKYCIV_USERNAME</code> and <code>SKYCIV_KEY</code> to the server <code>.env</code> ' +
				'to have Quick Draw open drawings in CloudCAD in one click.</p>',
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
