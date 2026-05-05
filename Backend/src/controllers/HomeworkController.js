const db = require('../config/db');

// @route   GET /api/homework
// @desc    Get homework for a specific class (Parent) or all homework by teacher (Teacher)
const getHomework = (req, res) => {
  const { role, id: userId } = req.user;

  if (role === 'Parent') {
    // Parents see homework for their child's class
    db.query(
      'SELECT child_class FROM parents WHERE id = ?',
      [userId],
      (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        if (results.length === 0) return res.status(404).json({ message: 'Parent not found' });
        
        const childClass = results[0].child_class;
        if (!childClass) return res.json([]); // No class assigned yet

        db.query(
          'SELECT h.*, t.firstname as teacher_firstname, t.lastname as teacher_lastname FROM homework h JOIN teachers t ON h.teacher_id = t.id WHERE h.class_group = ? ORDER BY h.created_at DESC',
          [childClass],
          (err, hwResults) => {
            if (err) return res.status(500).json({ message: 'Database error', error: err });
            res.json(hwResults);
          }
        );
      }
    );
  } else if (role === 'Teacher') {
    // Teachers see homework they uploaded
    db.query(
      'SELECT * FROM homework WHERE teacher_id = ? ORDER BY created_at DESC',
      [userId],
      (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json(results);
      }
    );
  } else {
    res.status(403).json({ message: 'Forbidden' });
  }
};

// @route   POST /api/homework
// @desc    Upload new homework (Teacher only)
const uploadHomework = (req, res) => {
  const { role, id: userId } = req.user;
  const { title, description, class_group } = req.body;

  if (role !== 'Teacher') {
    return res.status(403).json({ message: 'Only teachers can upload homework' });
  }

  if (!title || !description || !class_group) {
    return res.status(400).json({ message: 'Title, description, and class_group are required' });
  }

  const targetClasses = class_group.split(',');
  const values = targetClasses.map(cls => [userId, title, description, cls]);

  db.query(
    'INSERT INTO homework (teacher_id, title, description, class_group) VALUES ?',
    [values],
    (err, results) => {
      if (err) return res.status(500).json({ message: 'Database error', error: err });
      res.status(201).json({ message: 'Homework uploaded successfully', insertedRows: results.affectedRows });
    }
  );
};

module.exports = { getHomework, uploadHomework };
