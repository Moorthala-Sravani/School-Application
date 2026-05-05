const express = require('express');
const router = express.Router();
const { register, login, resetPassword, linkStudent } = require('../controllers/AuthControllers');

router.post('/register', register);
router.post('/login', login);
router.post('/reset-password', resetPassword);
router.post('/link-student', linkStudent);

module.exports = router;