const express = require('express');
const { generateFeeBill, generateBusBill, downloadFeeBill } = require('../controllers/BillingController');
const protect = require('../middlewares/authMiddleware');
const router = express.Router();

router.post('/fees', protect, generateFeeBill);
router.post('/bus', protect, generateBusBill);
router.get('/download/:feeId', downloadFeeBill);

module.exports = router;
