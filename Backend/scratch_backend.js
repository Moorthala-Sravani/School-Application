const fs = require('fs');

const controllerPath = 'c:/Users/Sravani/Desktop/App/Backend/src/controllers/AttendanceController.js';
let controller = fs.readFileSync(controllerPath, 'utf-8');

const oldApplyLeave = `exports.applyLeave = (req, res) => {
    const { id: userId, role } = req.user;
    const { date, reason } = req.body;

    if (role !== 'Parent') return res.status(403).json({ message: 'Only parents can apply for leave' });

    if (!date || !reason) {
        return res.status(400).json({ message: 'Date and reason are required' });
    }

    db.query(
        'SELECT child_class FROM parents WHERE id = ?',
        [userId],
        (err, results) => {
            if (err) return res.status(500).json({ message: 'Database error', error: err });
            if (results.length === 0) return res.status(404).json({ message: 'Parent not found' });
            
            const childClass = results[0].child_class;
            
            db.query(
                'INSERT INTO attendance (user_id, user_role, date, status, reason, class_group) VALUES (?, ?, ?, ?, ?, ?)',
                [userId, role, date, 'leave_pending', reason, childClass],
                (err, results) => {
                    if (err) return res.status(500).json({ message: 'Database error', error: err });
                    res.status(201).json({ message: 'Leave application submitted successfully', id: results.insertId });
                }
            );
        }
    );
};`;

const newApplyLeave = `exports.applyLeave = (req, res) => {
    const { id: userId, role } = req.user;
    const { date, reason } = req.body;

    if (role !== 'Parent' && role !== 'Teacher') {
        return res.status(403).json({ message: 'Only parents and teachers can apply for leave' });
    }

    if (!date || !reason) {
        return res.status(400).json({ message: 'Date and reason are required' });
    }

    if (role === 'Parent') {
        db.query(
            'SELECT child_class FROM parents WHERE id = ?',
            [userId],
            (err, results) => {
                if (err) return res.status(500).json({ message: 'Database error', error: err });
                if (results.length === 0) return res.status(404).json({ message: 'Parent not found' });
                
                const childClass = results[0].child_class;
                
                db.query(
                    'INSERT INTO attendance (user_id, user_role, date, status, reason, class_group) VALUES (?, ?, ?, ?, ?, ?)',
                    [userId, role, date, 'leave_pending', reason, childClass],
                    (err, results) => {
                        if (err) return res.status(500).json({ message: 'Database error', error: err });
                        res.status(201).json({ message: 'Leave application submitted successfully', id: results.insertId });
                    }
                );
            }
        );
    } else if (role === 'Teacher') {
        // Teachers don't need a specific class_group for their own leave
        db.query(
            'INSERT INTO attendance (user_id, user_role, date, status, reason, class_group) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, role, date, 'leave_pending', reason, null],
            (err, results) => {
                if (err) return res.status(500).json({ message: 'Database error', error: err });
                res.status(201).json({ message: 'Teacher leave application submitted successfully', id: results.insertId });
            }
        );
    }
};

exports.getTeacherLeaves = (req, res) => {
    const { role } = req.user;
    if (role !== 'Admin') return res.status(403).json({ message: 'Forbidden' });

    db.query(
        'SELECT a.*, t.firstname, t.lastname, t.email FROM attendance a JOIN teachers t ON a.user_id = t.id WHERE a.user_role = "Teacher" AND a.status IN ("leave_pending", "leave_approved") ORDER BY a.created_at DESC',
        (err, results) => {
            if (err) return res.status(500).json({ message: 'Database error', error: err });
            res.json(results);
        }
    );
};

exports.updateTeacherLeaveStatus = (req, res) => {
    const { role } = req.user;
    if (role !== 'Admin') return res.status(403).json({ message: 'Forbidden' });

    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['leave_pending', 'leave_approved', 'absent'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }

    db.query(
        'UPDATE attendance SET status = ? WHERE id = ? AND user_role = "Teacher"',
        [status, id],
        (err, results) => {
            if (err) return res.status(500).json({ message: 'Database error', error: err });
            if (results.affectedRows === 0) return res.status(404).json({ message: 'Leave record not found' });
            res.json({ message: 'Leave status updated successfully' });
        }
    );
};`;

controller = controller.replace(oldApplyLeave, newApplyLeave);
fs.writeFileSync(controllerPath, controller);


const routesPath = 'c:/Users/Sravani/Desktop/App/Backend/src/routes/attendanceRoutes.js';
let routes = fs.readFileSync(routesPath, 'utf-8');

routes = routes.replace("const { getAttendance, applyLeave } = require('../controllers/AttendanceController');", 
                        "const { getAttendance, applyLeave, getTeacherLeaves, updateTeacherLeaveStatus } = require('../controllers/AttendanceController');");

routes = routes.replace("module.exports = router;", 
`
router.get('/teacher-leaves', protect, getTeacherLeaves);
router.put('/teacher-leaves/:id', protect, updateTeacherLeaveStatus);

module.exports = router;`);

fs.writeFileSync(routesPath, routes);
