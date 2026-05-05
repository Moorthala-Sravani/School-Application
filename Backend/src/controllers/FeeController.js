const db = require('../config/db');

exports.getFees = (req, res) => {
  const { studentId } = req.query;

  if (!studentId) {
    return res.status(400).json({ message: 'Student ID is required' });
  }

  db.query(
    'SELECT * FROM fees WHERE student_id = ?',
    [studentId],
    (err, results) => {
      if (err) return res.status(500).json({ message: 'Database error', error: err });
      res.json(results);
    }
  );
};

exports.payFee = (req, res) => {
  const { id } = req.params;

  db.query(
    "UPDATE fees SET status = 'Paid' WHERE id = ?",
    [id],
    (err, results) => {
      if (err) return res.status(500).json({ message: 'Database error', error: err });
      
      if (results.affectedRows === 0) {
        return res.status(404).json({ message: 'Fee record not found' });
      }
      
      res.json({ message: 'Fee marked as paid successfully' });
    }
  );
};
