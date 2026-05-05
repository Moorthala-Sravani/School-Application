const express = require('express');
const router = express.Router();
const feeController = require('../controllers/FeeController');
const verifyToken = require('../middlewares/authMiddleware');

router.get('/', feeController.getFees);
router.put('/:id/pay', verifyToken, feeController.payFee);

module.exports = router;
