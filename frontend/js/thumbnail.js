// Thumbnail generation for the platform file manager.
//
// The file manager reads a global THUMBNAIL_DATA holding a base64 image. Quick
// Draw fills it from whichever drawing the user last opened.
QUICKDRAW.thumbnail = (function () {

	let funcs = {};

	/**
	 * Render a template's preview to a PNG data URL and publish it as
	 * THUMBNAIL_DATA.
	 *
	 * The SVG is fetched as text and inlined as a data URL before being drawn.
	 * Pointing the image straight at the server URL would taint the canvas and
	 * make toDataURL throw, since the built page and the API are different
	 * origins during local testing.
	 *
	 * @returns {Promise} resolves with the data URL, or null if it could not be built
	 */
	const generate = (id) => {

		const size = QUICKDRAW.settings.PREVIEW.thumbnail;
		const endpoint = '/api/templates/' + encodeURIComponent(id) +
			'/preview.svg?width=' + size.width + '&height=' + size.height;

		return QUICKDRAW.ajax.getText(endpoint).then((svg) => {

			return new Promise((resolve) => {

				const image = new Image();

				image.onload = function () {

					const canvas = document.createElement('canvas');
					canvas.width = size.width;
					canvas.height = size.height;

					const context = canvas.getContext('2d');

					// The preview has a dark background, so the canvas is filled
					// to match rather than left transparent.
					context.fillStyle = '#151d2b';
					context.fillRect(0, 0, canvas.width, canvas.height);
					context.drawImage(image, 0, 0, canvas.width, canvas.height);

					let data = null;
					try {
						data = canvas.toDataURL('image/png');
					} catch (e) {
						data = null;
					}

					window.THUMBNAIL_DATA = data;
					resolve(data);
				};

				image.onerror = function () {
					resolve(null);
				};

				// unescape/encodeURIComponent keeps btoa working on the non-ASCII
				// characters that appear in drawing labels.
				image.src = 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(svg)));
			});

		}).catch(() => {
			return null;
		});
	};

	funcs.generate = generate;

	return funcs;

})();
