const db = require('../config/db');

exports.submitMeasurement = (req, res) => {
  const { height, width, required_items } = req.body;
  const parent_id = req.user.id;
  const student_id = req.user.child_id || 'STU-123';

  if (!height || !width) {
    return res.status(400).json({ message: 'Height and Width are required.' });
  }

  db.query(
    'INSERT INTO uniform_measurements (parent_id, student_id, height, width, required_items) VALUES (?, ?, ?, ?, ?)',
    [parent_id, student_id, height, width, JSON.stringify(required_items)],
    (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'Database error', error: err });
      }
      res.status(201).json({
        message: 'Uniform measurements submitted successfully',
        id: result.insertId
      });
    }
  );
};

exports.getMeasurements = (req, res) => {
  db.query(
    'SELECT u.*, p.parent_name, p.child_name FROM uniform_measurements u LEFT JOIN parents p ON u.parent_id = p.id ORDER BY u.created_at DESC',
    (err, results) => {
      if (err) return res.status(500).json({ message: 'Database error', error: err });
      res.json(results);
    }
  );
};

exports.updateMeasurementStatus = (req, res) => {
  const { id } = req.params;
  const { status, admin_note } = req.body;

  if (!status) {
    return res.status(400).json({ message: 'Status is required' });
  }

  db.query(
    'UPDATE uniform_measurements SET status = ?, admin_note = ? WHERE id = ?',
    [status, admin_note || null, id],
    (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'Database error', error: err });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Uniform measurement not found' });
      }
      res.json({ message: 'Status updated successfully' });
    }
  );
};
