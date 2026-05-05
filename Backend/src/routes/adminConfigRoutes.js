const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const c = require('../controllers/AdminConfigController');

router.get('/config',            auth, c.getFullConfig);
router.get('/settings',          auth, c.getSettings);
router.put('/settings',          auth, c.updateSettings);

router.get('/uniforms',          auth, c.getUniforms);
router.post('/uniforms',         auth, c.createUniform);
router.put('/uniforms/:id',      auth, c.updateUniform);
router.delete('/uniforms/:id',   auth, c.deleteUniform);

router.get('/fee-types',         auth, c.getFeeTypes);
router.post('/fee-types',        auth, c.createFeeType);
router.put('/fee-types/:id',     auth, c.updateFeeType);
router.delete('/fee-types/:id',  auth, c.deleteFeeType);

router.get('/leave-types',       auth, c.getLeaveTypes);
router.post('/leave-types',      auth, c.createLeaveType);
router.put('/leave-types/:id',   auth, c.updateLeaveType);
router.delete('/leave-types/:id',auth, c.deleteLeaveType);

module.exports = router;
