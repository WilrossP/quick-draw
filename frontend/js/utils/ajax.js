// Code to run ajax requests to generalise error handling and response parsing.
QUICKDRAW.ajax = (function () {

	let funcs = {};

	const url = (endpoint) => QUICKDRAW.settings.apiBase() + endpoint;

	/**
	 * Every server response is { success, data, message }. This unwraps that
	 * envelope so callers only ever deal with `data`, and routes every failure
	 * through one place.
	 *
	 * @returns {Promise} resolves with the data, rejects with an Error
	 */
	const request = (method, endpoint, payload) => {

		return new Promise((resolve, reject) => {

			jQuery.ajax({
				url: url(endpoint),
				type: method,
				contentType: 'application/json',
				dataType: 'json',
				data: payload ? JSON.stringify(payload) : undefined
			}).done((response) => {

				if (response && response.success) {
					resolve(response.data);
					return;
				}

				const message = response && response.message ? response.message : 'Unexpected response from the server';
				reject(new Error(message));

			}).fail((xhr) => {

				let message = 'Could not reach the Quick Draw server';

				if (xhr.responseJSON && xhr.responseJSON.message) {
					message = xhr.responseJSON.message;
				} else if (xhr.status) {
					message = 'Request failed (' + xhr.status + ')';
				}

				reject(new Error(message));
			});
		});
	};

	const get = (endpoint) => request('GET', endpoint);
	const post = (endpoint, payload) => request('POST', endpoint, payload);
	const del = (endpoint) => request('DELETE', endpoint);

	/**
	 * Send a file as multipart form data. jQuery must be told not to touch the
	 * body or the Content-Type, so the browser can set the multipart boundary.
	 */
	const upload = (endpoint, form_data) => {

		return new Promise((resolve, reject) => {

			jQuery.ajax({
				url: url(endpoint),
				type: 'POST',
				data: form_data,
				processData: false,
				contentType: false,
				dataType: 'json'
			}).done((response) => {

				if (response && response.success) {
					resolve(response.data);
					return;
				}

				reject(new Error(response && response.message ? response.message : 'The upload failed'));

			}).fail((xhr) => {

				let message = 'The upload failed';
				if (xhr.responseJSON && xhr.responseJSON.message) message = xhr.responseJSON.message;
				reject(new Error(message));
			});
		});
	};

	/**
	 * Fetch a resource as plain text rather than through the JSON envelope -
	 * used for the SVG preview markup.
	 */
	const getText = (endpoint) => {

		return new Promise((resolve, reject) => {
			jQuery.ajax({
				url: url(endpoint),
				type: 'GET',
				dataType: 'text'
			}).done(resolve).fail(() => {
				reject(new Error('Could not load ' + endpoint));
			});
		});
	};

	funcs.url = url;
	funcs.get = get;
	funcs.post = post;
	funcs.del = del;
	funcs.upload = upload;
	funcs.getText = getText;

	return funcs;

})();
