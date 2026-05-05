const express = require('express');
const router = express.Router();
const eventController = require('../controllers/EventController');
const verifyToken = require('../middlewares/authMiddleware');

router.get('/', eventController.getEvents);
router.post('/', verifyToken, eventController.createEvent);

module.exports = router;
