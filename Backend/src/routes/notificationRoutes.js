const express = require('express');
const { broadcastNotification } = require('../controllers/NotificationController');
const protect = require('../middlewares/authMiddleware');
const router = express.Router();

router.post('/', protect, broadcastNotification);

module.exports = router;
