const db = require('../config/db');

exports.getSalary = (req, res) => {
  const teacherId = req.user.id;

  db.query(
    'SELECT * FROM teacher_salary WHERE teacher_id = ? ORDER BY id DESC',
    [teacherId],
    (err, results) => {
      if (err) return res.status(500).json({ message: 'Database error', error: err });
      if (results.length === 0) {
        return res.status(404).json({ message: 'No salary records found' });
      }
      res.json(results[0]); // Return the latest salary slip
    }
  );
};
