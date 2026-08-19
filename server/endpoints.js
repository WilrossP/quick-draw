// Every endpoint is registered here. The logic itself lives in functions.js.

'use strict';

const express = require('express');

const functions = require('./functions');

module.exports = function buildRouter() {

	const router = express.Router();

	// Wrap a handler so a thrown error becomes a clean JSON response rather than
	// an unhandled rejection.
	const guard = (handler) => {
		return async (req, res) => {
			try {
				await handler(req, res);
			} catch (e) {
				console.error('[quick-draw]', req.method, req.path, e);
				res.status(500).json({ success: false, message: e.message });
			}
		};
	};

	const notFound = (res) => res.status(404).json({ success: false, message: 'Template not found' });

	// Ping endpoint for health checks
	router.get('/ping', (req, res) => {
		res.send('pong');
	});

	// The whole library: templates plus the categories in use.
	router.get('/api/library', guard(async (req, res) => {
		res.json({ success: true, data: functions.getLibrary() });
	}));

	// A single template with its geometry stats.
	router.get('/api/templates/:id', guard(async (req, res) => {
		const template = functions.getTemplate(req.params.id);
		if (!template) return notFound(res);
		res.json({ success: true, data: template });
	}));

	// Edit the title, categories, tags, description or favourite flag.
	router.post('/api/templates/:id', guard(async (req, res) => {
		const updated = functions.updateTemplate(req.params.id, req.body || {});
		if (!updated) return notFound(res);
		res.json({ success: true, data: updated });
	}));

	// Drawing preview as SVG. Served as an image so it can go straight into a
	// plain <img> tag and be cached by the browser.
	router.get('/api/templates/:id/preview.svg', guard(async (req, res) => {

		const options = {
			width: parseInt(req.query.width, 10) || 640,
			height: parseInt(req.query.height, 10) || 440,
			show_text: req.query.text !== '0'
		};

		const svg = functions.getPreview(req.params.id, options);
		if (!svg) return notFound(res);

		res.set('Content-Type', 'image/svg+xml');
		res.set('Cache-Control', 'no-cache');
		res.send(svg);
	}));

	// The original DXF file.
	router.get('/api/templates/:id/download', guard(async (req, res) => {

		const file = functions.getFile(req.params.id);
		if (!file) return notFound(res);

		res.set('Content-Type', 'application/dxf');
		res.set('Content-Disposition', 'attachment; filename="' + file.name + '"');
		res.send(file.buffer);
	}));

	// The converted CloudCAD cad_data, for inspection or manual import.
	router.get('/api/templates/:id/cad-data', guard(async (req, res) => {

		const cad_data = functions.getCadData(req.params.id);
		if (!cad_data) return notFound(res);

		if (req.query.download === '1') {
			res.set('Content-Type', 'application/json');
			res.set('Content-Disposition', 'attachment; filename="' + req.params.id + '.cad.json"');
		}

		res.send(JSON.stringify(cad_data));
	}));

	// Convert and hand off to CloudCAD.
	router.post('/api/templates/:id/cloudcad', guard(async (req, res) => {
		const result = await functions.openInCloudCad(req.params.id);
		if (!result) return notFound(res);
		res.json({ success: true, data: result });
	}));

	return router;

};
