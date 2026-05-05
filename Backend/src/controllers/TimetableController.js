const db = require('../config/db');

exports.getTimetable = (req, res) => {
  const teacherId = req.user.id;
  const { day } = req.query; // 'Monday', 'Tuesday', etc.

  let query = 'SELECT * FROM teacher_timetable WHERE teacher_id = ?';
  let params = [teacherId];

  if (day) {
    query += ' AND day_of_week = ?';
    params.push(day);
  }

  query += ' ORDER BY period_number ASC';

  db.query(query, params, (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    res.json(results);
  });
};
