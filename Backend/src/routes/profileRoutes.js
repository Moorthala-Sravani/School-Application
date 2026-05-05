const express = require('express');
const router = express.Router();
const profileController = require('../controllers/ProfileController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/parent', authMiddleware, profileController.getParentProfile);
router.put('/parent', authMiddleware, profileController.updateParentProfile);

router.get('/teacher', authMiddleware, profileController.getTeacherProfile);
router.put('/teacher', authMiddleware, profileController.updateTeacherProfile);

router.get('/admin', authMiddleware, profileController.getAdminProfile);
router.put('/admin', authMiddleware, profileController.updateAdminProfile);

router.get('/students/:classGroup', authMiddleware, profileController.getStudentsByClass);
router.get('/teachers/classes', authMiddleware, profileController.getAllClassTeachers);

module.exports = router;
