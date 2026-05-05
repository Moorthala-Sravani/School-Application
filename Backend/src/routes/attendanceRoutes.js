const express = require('express');
const { getAttendance, applyLeave, getTeacherLeaves, updateTeacherLeaveStatus, updateParentLeaveStatus, saveBulkAttendance } = require('../controllers/AttendanceController');
const protect = require('../middlewares/authMiddleware');
const router = express.Router();

router.get('/', protect, getAttendance);
router.post('/leave', protect, applyLeave);
router.post('/bulk', protect, saveBulkAttendance);

router.get('/teacher-leaves', protect, getTeacherLeaves);
router.put('/teacher-leaves/:id', protect, updateTeacherLeaveStatus);
router.put('/parent-leaves/:id', protect, updateParentLeaveStatus);

module.exports = router;
