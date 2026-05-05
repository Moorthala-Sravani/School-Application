const express = require('express');
const { getHomework, uploadHomework } = require('../controllers/HomeworkController');
const protect = require('../middlewares/authMiddleware');
const router = express.Router();

router.get('/', protect, getHomework);
router.post('/', protect, uploadHomework);

module.exports = router;
