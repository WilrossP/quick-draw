const path = require('path');
const fs = require('fs');
const express = require('express');

// Register all the endpoints in this file, keep the logic seperate 
module.exports = function buildRouter() {
	
	const router = express.Router();

	// Ping endpoint for health checks
	router.get('/ping', (req, res) => {
		res.send('pong');
	});
	
	return router;

};
