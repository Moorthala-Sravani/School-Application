const db = require('../config/db');

exports.getAttendance = (req, res) => {
    const { id: userId, role } = req.user;
    
    if (role === 'Parent') {
        db.query(
            'SELECT * FROM attendance WHERE user_id = ? AND user_role = ? ORDER BY date DESC',
            [userId, role],
            (err, results) => {
                if (err) return res.status(500).json({ message: 'Database error', error: err });
                res.json(results);
            }
        );
    } else if (role === 'Teacher') {
        // Teacher needs to see attendance for the class they selected
        // We will pass class_group in query params
        const { class_group } = req.query;
        if (!class_group) return res.status(400).json({ message: 'class_group is required for teachers' });

        const classGroups = class_group.split(','); // handle "1-A,1-B"

        db.query(
            'SELECT a.*, p.child_name as student_name FROM attendance a JOIN parents p ON a.user_id = p.id WHERE a.class_group IN (?) ORDER BY a.date DESC',
            [classGroups],
            (err, results) => {
                if (err) return res.status(500).json({ message: 'Database error', error: err });
                res.json(results);
            }
        );
    } else if (role === 'Admin') {
        const { target_role, class_group } = req.query;
        if (target_role === 'Teacher') {
            db.query(
                'SELECT a.*, t.firstname, t.lastname FROM attendance a JOIN teachers t ON a.user_id = t.id WHERE a.user_role = "Teacher" ORDER BY a.date DESC',
                (err, results) => {
                    if (err) return res.status(500).json({ message: 'Database error', error: err });
                    res.json(results);
                }
            );
        } else {
            const cls = class_group || '6-A';
            db.query(
                'SELECT a.*, p.child_name as student_name FROM attendance a JOIN parents p ON a.user_id = p.id WHERE a.class_group = ? ORDER BY a.date DESC',
                [cls],
                (err, results) => {
                    if (err) return res.status(500).json({ message: 'Database error', error: err });
                    res.json(results);
                }
            );
        }
    }
};

exports.applyLeave = (req, res) => {
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
            'SELECT child_class, child_name FROM parents WHERE id = ?',
            [userId],
            (err, results) => {
                if (err) return res.status(500).json({ message: 'Database error', error: err });
                if (results.length === 0) return res.status(404).json({ message: 'Parent not found' });
                
                const childClass = results[0].child_class;
                const childName = results[0].child_name;
                
                // Prevent duplicate leave applications for the same date
                db.query('SELECT id FROM attendance WHERE user_id = ? AND date = ? AND user_role = "Parent"', [userId, date], (err, existing) => {
                    if (err) return res.status(500).json({ message: 'Database error', error: err });
                    
                    const handleSuccess = (recordId) => {
                        // Generate automated message for the teacher
                        db.query('SELECT id FROM teachers WHERE class_teacher = ?', [childClass], (err, tRes) => {
                            if (!err && tRes && tRes.length > 0) {
                                const msgTitle = 'Leave Request: Needs Attention';
                                const msgContent = `Leave requested for ${date}. Reason: ${reason}`;
                                db.query(
                                    'INSERT INTO messages (sender_name, sender_type, receiver_id, receiver_type, title, content, class_group) VALUES (?, "Parent", ?, "Teacher", ?, ?, ?)',
                                    [`Parent of ${childName}`, tRes[0].id, msgTitle, msgContent, childClass]
                                );
                            }
                            res.status(existing.length > 0 ? 200 : 201).json({ message: 'Leave application submitted successfully', id: recordId });
                        });
                    };

                    if (existing.length > 0) {
                        db.query(
                            'UPDATE attendance SET status = ?, reason = ? WHERE id = ?',
                            ['leave_pending', reason, existing[0].id],
                            (err) => {
                                if (err) return res.status(500).json({ message: 'Database error', error: err });
                                handleSuccess(existing[0].id);
                            }
                        );
                    } else {
                        db.query(
                            'INSERT INTO attendance (user_id, user_role, date, status, reason, class_group) VALUES (?, ?, ?, ?, ?, ?)',
                            [userId, role, date, 'leave_pending', reason, childClass],
                            (err, insertRes) => {
                                if (err) return res.status(500).json({ message: 'Database error', error: err });
                                handleSuccess(insertRes.insertId);
                            }
                        );
                    }
                });
            }
        );
    } else if (role === 'Teacher') {
        db.query(
            'INSERT INTO attendance (user_id, user_role, date, status, reason, class_group) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, role, date, 'leave_pending', reason, null],
            (err, results) => {
                if (err) return res.status(500).json({ message: 'Database error', error: err });
                res.status(201).json({ message: 'Teacher leave application submitted for admin approval', id: results.insertId });
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

    if (!status || !['leave_pending', 'leave_approved', 'leave_rejected', 'absent'].includes(status)) {
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
};

exports.updateParentLeaveStatus = (req, res) => {
    const { role, id: teacherId } = req.user;
    if (role !== 'Teacher') return res.status(403).json({ message: 'Forbidden' });

    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['leave_pending', 'leave_approved', 'leave_rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }

    // First fetch the attendance record to know who the parent is and the date
    db.query('SELECT user_id, date, class_group FROM attendance WHERE id = ? AND user_role = "Parent"', [id], (err, records) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        if (records.length === 0) return res.status(404).json({ message: 'Leave record not found' });
        
        const record = records[0];
        
        db.query(
            'UPDATE attendance SET status = ? WHERE id = ?',
            [status, id],
            (err, results) => {
                if (err) return res.status(500).json({ message: 'Database error', error: err });
                
                // Dynamically notify the parent
                db.query('SELECT firstname, lastname FROM teachers WHERE id = ?', [teacherId], (err, tRes) => {
                    const teacherName = tRes && tRes.length > 0 ? `${tRes[0].firstname} ${tRes[0].lastname}` : 'Teacher';
                    const dateStr = new Date(record.date).toISOString().split('T')[0];
                    
                    const msgTitle = status === 'leave_approved' ? 'Leave Approved ✅' : 'Leave Rejected ❌';
                    const msgContent = status === 'leave_approved' 
                        ? `Your leave request for ${dateStr} has been approved by the class teacher.` 
                        : `Your leave request for ${dateStr} has been rejected. Please contact the teacher for more details.`;
                        
                    db.query(
                        'INSERT INTO messages (sender_name, sender_type, receiver_id, receiver_type, title, content, class_group) VALUES (?, "Teacher", ?, "Parent", ?, ?, ?)',
                        [teacherName, record.user_id, msgTitle, msgContent, record.class_group]
                    );
                    
                    res.json({ message: 'Student leave status updated successfully' });
                });
            }
        );
    });
};

exports.saveBulkAttendance = (req, res) => {
    const { role } = req.user;
    if (role !== 'Teacher') {
        return res.status(403).json({ message: 'Only teachers can save bulk attendance' });
    }

    const { date, class_group, records } = req.body;
    if (!date || !class_group || !records || !Array.isArray(records)) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    db.query('SELECT id, user_id, status, reason FROM attendance WHERE class_group = ? AND date = ? AND user_role = "Parent"', [class_group, date], (err, existing) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });

        const existingMap = {};
        existing.forEach(e => existingMap[e.user_id] = e);

        // Fetch teacher name to send message
        db.query('SELECT firstname, lastname FROM teachers WHERE id = ?', [req.user.id], (err, teacherRes) => {
            const senderName = teacherRes && teacherRes.length > 0 ? `${teacherRes[0].firstname} ${teacherRes[0].lastname}` : 'Teacher';
            
            const queries = [];
            const messageQueries = [];

            records.forEach(r => {
                if (existingMap[r.parent_id]) {
                    const e = existingMap[r.parent_id];
                    if (e.status !== r.status || e.reason !== r.remarks) {
                        queries.push(new Promise((resolve, reject) => {
                            db.query('UPDATE attendance SET status = ?, reason = ? WHERE id = ?', [r.status, r.remarks || null, e.id], (err) => err ? reject(err) : resolve());
                        }));
                    }
                } else {
                    queries.push(new Promise((resolve, reject) => {
                        db.query('INSERT INTO attendance (user_id, user_role, date, status, reason, class_group) VALUES (?, "Parent", ?, ?, ?, ?)', [r.parent_id, date, r.status, r.remarks || null, class_group], (err) => err ? reject(err) : resolve());
                    }));
                }

                // If marked absent, queue a message to the parent
                if (r.status === 'absent') {
                    const msgTitle = "Attendance Alert: Absent";
                    const msgContent = r.remarks ? `Update regarding today's attendance (${date}): ${r.remarks}` : `Your child was marked absent today (${date}). Please submit a leave request or contact the teacher.`;
                    messageQueries.push(new Promise((resolve, reject) => {
                        db.query(
                            'INSERT INTO messages (sender_name, sender_type, receiver_id, receiver_type, title, content, class_group) VALUES (?, ?, ?, ?, ?, ?, ?)',
                            [senderName, 'Teacher', r.parent_id, 'Parent', msgTitle, msgContent, class_group],
                            (err) => err ? reject(err) : resolve()
                        );
                    }));
                }
            });

            Promise.all([...queries, ...messageQueries])
                .then(() => res.json({ message: 'Attendance saved successfully and notifications sent' }))
                .catch(err => res.status(500).json({ message: 'Database error', error: err }));
        });
    });
};
