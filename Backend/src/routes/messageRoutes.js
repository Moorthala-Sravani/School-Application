const express = require('express');
const { getMessages, markMessageAsRead, sendMessage, getManagementMessages } = require('../controllers/MessageController');
const protect = require('../middlewares/authMiddleware');
const router = express.Router();

router.get('/admin', protect, getManagementMessages);
router.get('/', protect, getMessages);
router.post('/', protect, sendMessage);
router.put('/:id/read', protect, markMessageAsRead);

module.exports = router;
