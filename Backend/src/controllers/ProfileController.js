const db = require('../config/db');

exports.getParentProfile = (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;

  if (role !== 'Parent') return res.status(403).json({ message: 'Forbidden' });

  db.query(
    'SELECT id, firstname, lastname, email, mobile_number, occupation, child_name, child_class, address, profile_pic FROM parents WHERE id = ?',
    [userId],
    (err, results) => {
      if (err) return res.status(500).json({ message: 'Database error', error: err });
      if (results.length === 0) return res.status(404).json({ message: 'User not found' });
      res.json(results[0]);
    }
  );
};

exports.updateParentProfile = (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;

  if (role !== 'Parent') return res.status(403).json({ message: 'Forbidden' });

  const { occupation, child_name, child_class, address, profile_pic } = req.body;

  db.query(
    'UPDATE parents SET occupation = ?, child_name = ?, child_class = ?, address = ?, profile_pic = ? WHERE id = ?',
    [occupation, child_name, child_class, address, profile_pic, userId],
    (err) => {
      if (err) return res.status(500).json({ message: 'Database error', error: err });
      res.json({ message: 'Profile updated successfully' });
    }
  );
};

exports.getTeacherProfile = (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;

  if (role !== 'Teacher') return res.status(403).json({ message: 'Forbidden' });

  db.query(
    'SELECT id, firstname, lastname, email, mobile_number, subject, assigned_classes, profile_pic, class_teacher FROM teachers WHERE id = ?',
    [userId],
    (err, results) => {
      if (err) return res.status(500).json({ message: 'Database error', error: err });
      if (results.length === 0) return res.status(404).json({ message: 'User not found' });
      res.json(results[0]);
    }
  );
};

exports.updateTeacherProfile = (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;

  if (role !== 'Teacher') return res.status(403).json({ message: 'Forbidden' });

  console.log("Updating Teacher Profile, req.body:", req.body);

  const { firstname, lastname, email, mobile_number, subject, assigned_classes, profile_pic, class_teacher } = req.body;

  const assignedClassesJSON = assigned_classes ? JSON.stringify(assigned_classes) : null;

  db.query(
    'UPDATE teachers SET firstname = ?, lastname = ?, email = ?, mobile_number = ?, subject = ?, assigned_classes = ?, profile_pic = ?, class_teacher = ? WHERE id = ?',
    [firstname, lastname, email, mobile_number, subject, assignedClassesJSON, profile_pic, class_teacher || null, userId],
    (err) => {
      if (err) {
        console.error("Database update error:", err);
        return res.status(500).json({ message: 'Database error', error: err });
      }
      console.log(`Updated teacher ${userId} class_teacher to:`, class_teacher);
      res.json({ message: 'Teacher profile updated successfully' });
    }
  );
};

exports.getAdminProfile = (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;

  if (role !== 'Admin') return res.status(403).json({ message: 'Forbidden' });

  db.query(
    'SELECT id, firstname, lastname, email, mobile_number, profile_pic FROM admins WHERE id = ?',
    [userId],
    (err, results) => {
      if (err) return res.status(500).json({ message: 'Database error', error: err });
      if (results.length === 0) return res.status(404).json({ message: 'User not found' });
      res.json(results[0]);
    }
  );
};

exports.updateAdminProfile = (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;

  if (role !== 'Admin') return res.status(403).json({ message: 'Forbidden' });

  const { firstname, lastname, email, mobile_number, profile_pic } = req.body;

  db.query(
    'UPDATE admins SET firstname = ?, lastname = ?, email = ?, mobile_number = ?, profile_pic = ? WHERE id = ?',
    [firstname, lastname, email, mobile_number, profile_pic, userId],
    (err) => {
      if (err) return res.status(500).json({ message: 'Database error', error: err });
      res.json({ message: 'Admin profile updated successfully' });
    }
  );
};

exports.getStudentsByClass = (req, res) => {
  const classGroup = req.params.classGroup;
  const role = req.user.role;

  if (role !== 'Teacher' && role !== 'Admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }

  db.query(
    'SELECT id as parent_id, child_name as name, child_class as standard FROM parents WHERE child_class = ?',
    [classGroup],
    (err, studentResults) => {
      if (err) return res.status(500).json({ message: 'Database error', error: err });
      
      db.query(
        'SELECT firstname, lastname FROM teachers WHERE class_teacher = ? LIMIT 1',
        [classGroup],
        (err, teacherResults) => {
          if (err) return res.status(500).json({ message: 'Database error', error: err });
          
          let classTeacherName = 'Not Assigned';
          if (teacherResults && teacherResults.length > 0) {
            classTeacherName = `${teacherResults[0].firstname} ${teacherResults[0].lastname}`;
          }
          
          res.json({
            students: studentResults,
            classTeacherName
          });
        }
      );
    }
  );
};

exports.getAllClassTeachers = (req, res) => {
  db.query(
    'SELECT firstname, lastname, class_teacher FROM teachers WHERE class_teacher IS NOT NULL AND class_teacher != "Not a class teacher"',
    (err, results) => {
      if (err) return res.status(500).json({ message: 'Database error', error: err });
      
      const teachersMap = {};
      results.forEach(row => {
        teachersMap[row.class_teacher] = `${row.firstname} ${row.lastname}`;
      });
      res.json(teachersMap);
    }
  );
};
