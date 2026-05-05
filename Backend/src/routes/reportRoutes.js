const express = require('express');
const router = express.Router();
const reportController = require('../controllers/ReportController');

router.get('/', reportController.getReportCard);
router.post('/', reportController.createReportCard);

module.exports = router;
