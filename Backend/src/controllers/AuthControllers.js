const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.register = (req, res) => {
  console.log('Incoming Register Request:', req.body);
  const { 
    firstname, lastname, email, mobile_number, password, role, subject, created_at, 
    child_name, child_class, roll_number, relationship,
    employee_id, department, assigned_classes,
    school_name, school_code, access_level
  } = req.body;

  let tableName = 'parents';
  if (role === 'Teacher') tableName = 'teachers';
  else if (role === 'Admin') tableName = 'admins';

  // Check for existing duplicates first to avoid AUTO_INCREMENT gaps
  db.query(
    `SELECT id FROM ${tableName} WHERE email = ? OR mobile_number = ?`,
    [email, mobile_number],
    (err, results) => {
      if (err) return res.status(500).json({ message: 'Database error occurred', error: err });

      if (results.length > 0) {
        return res.status(400).json({ message: 'Email or Mobile number already exists!' });
      }

      // No duplicates found, safe to insert
      const hashedPassword = bcrypt.hashSync(password, 10);
      const timestamp = created_at || new Date().toISOString().slice(0, 19).replace('T', ' ');

      let queryStr = '';
      let queryParams = [];

      if (role === 'Teacher') {
        queryStr = `INSERT INTO teachers (firstname, lastname, email, mobile_number, password, subject, employee_id, department, assigned_classes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        queryParams = [firstname, lastname, email, mobile_number, hashedPassword, subject, employee_id || null, department || null, assigned_classes || null, timestamp];
      } else if (role === 'Admin') {
        queryStr = `INSERT INTO admins (firstname, lastname, email, mobile_number, password, school_name, school_code, access_level, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        queryParams = [firstname, lastname, email, mobile_number, hashedPassword, school_name || null, school_code || null, access_level || 'Admin', timestamp];
      } else {
        queryStr = `INSERT INTO parents (firstname, lastname, email, mobile_number, password, created_at, child_name, child_class, roll_number, relationship) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        queryParams = [firstname, lastname, email, mobile_number, hashedPassword, timestamp, child_name || null, child_class || null, roll_number || null, relationship || null];
      }

      db.query(queryStr, queryParams, (insertErr) => {
        if (insertErr) return res.status(500).json({ message: 'Database error occurred', error: insertErr });
        res.json({ message: 'User registered' });
      });
    }
  );
};

exports.login = (req, res) => {
  console.log('Incoming Login Request:', req.body);
  const { mobile, password, role } = req.body;

  let tableName = 'parents';
  if (role === 'Teacher') tableName = 'teachers';
  else if (role === 'Admin') tableName = 'admins';

  db.query(
    `SELECT * FROM ${tableName} WHERE mobile_number = ?`,
    [mobile],
    (err, results) => {
      if (err) return res.status(500).json({ message: 'Database error occurred', error: err });

      if (results.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      const user = results[0];
      const valid = bcrypt.compareSync(password, user.password);

      if (!valid) {
        return res.status(401).json({ message: 'Wrong password' });
      }

      const token = jwt.sign({ id: user.id, role }, 'secret', {
        expiresIn: '1d',
      });

      res.json({ token, mobile: user.mobile_number, role, firstname: user.firstname, lastname: user.lastname });
    }
  );
};

exports.resetPassword = (req, res) => {
  const { mobile, email, role, newPassword } = req.body;

  let tableName = 'parents';
  if (role === 'Teacher') tableName = 'teachers';
  else if (role === 'Admin') tableName = 'admins';

  db.query(
    `SELECT id FROM ${tableName} WHERE mobile_number = ? AND email = ?`,
    [mobile, email],
    (err, results) => {
      if (err) return res.status(500).json({ message: 'Database error occurred', error: err });

      if (results.length === 0) {
        return res.status(404).json({ message: 'No account matches this mobile number and email!' });
      }

      const hashedPassword = bcrypt.hashSync(newPassword, 10);

      db.query(
        `UPDATE ${tableName} SET password = ? WHERE mobile_number = ?`,
        [hashedPassword, mobile],
        (updateErr) => {
          if (updateErr) return res.status(500).json({ message: 'Failed to update password', error: updateErr });
          
          res.json({ message: 'Password reset successfully!' });
        }
      );
    }
  );
};
exports.linkStudent = (req, res) => {
  const { parentId, studentId } = req.body;

  db.query(
    'SELECT * FROM students WHERE student_id = ?',
    [studentId],
    (err, results) => {
      if (err) return res.status(500).json({ message: 'Database error', error: err });
      if (results.length === 0) return res.status(404).json({ message: 'Student not found' });

      db.query(
        'UPDATE students SET parent_id = ? WHERE student_id = ?',
        [parentId, studentId],
        (updateErr) => {
          if (updateErr) return res.status(500).json({ message: 'Failed to link student', error: updateErr });
          res.json({ message: 'Student linked successfully!', student: results[0] });
        }
      );
    }
  );
};
