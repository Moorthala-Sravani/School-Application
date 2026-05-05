const express = require('express');
const router = express.Router();
const busController = require('../controllers/BusController');

router.get('/', busController.getBusRoute);

module.exports = router;
