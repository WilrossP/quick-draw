'use strict';

require('dotenv').config();
const path = require('path');
const express = require('express');
const multer = require('multer');

const { UPLOAD_DIR, rehydrateUploads } = require('./functions');
const buildRouter = require('./endpoints');

const app = express();
app.use(express.json({ limit: '20mb' }));
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
	console.log(`Server running at http://localhost:${port}`);
});
