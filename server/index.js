'use strict';

require('dotenv').config();

const path = require('path');
const express = require('express');

const config = require('./utils/config');
const buildRouter = require('./endpoints');

const app = express();

// cad_data for a large drawing template runs to several megabytes.
app.use(express.json({ limit: '50mb' }));

app.use(express.static(path.join(__dirname, '..', 'template')));
app.use('/frontend', express.static(path.join(__dirname, '..', 'frontend')));

// Add some middleware
app.use((req, res, next) => {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
	res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

	if (req.method === 'OPTIONS') {
		return res.sendStatus(204);
	}

	next();
});

app.use(buildRouter());

const port = 4000;
app.listen(port, () => {
	console.log('Quick Draw server running at http://localhost:' + port);
	console.log('Drawing templates:', config.template_dir);
	if (!config.auth.username || !config.auth.key) {
		console.log('No SKYCIV_USERNAME / SKYCIV_KEY set - CloudCAD hand-off will use the download fallback.');
	}
});
