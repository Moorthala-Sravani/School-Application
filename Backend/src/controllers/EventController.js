const db = require('../config/db');

exports.getEvents = (req, res) => {
  const { month, year } = req.query;

  let query = 'SELECT * FROM events';
  let params = [];

  if (month && year) {
    query += ' WHERE MONTH(date) = ? AND YEAR(date) = ?';
    params = [month, year];
  }

  query += ' ORDER BY date ASC';

  db.query(query, params, (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    res.json(results);
  });
};

exports.createEvent = (req, res) => {
  const { title, date, type, description, time } = req.body;

  if (!title || !date || !type) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  // Ensure type matches enum: 'Event', 'Holiday', 'Exam', 'School', 'Cultural'
  const validTypes = ['Event', 'Holiday', 'Exam', 'School', 'Cultural'];
  const formattedType = validTypes.find(t => t.toLowerCase() === type.toLowerCase()) || 'Event';

  db.query(
    'INSERT INTO events (title, date, type, description, time) VALUES (?, ?, ?, ?, ?)',
    [title, date, formattedType, description, time || null],
    (err, results) => {
      if (err) return res.status(500).json({ message: 'Database error', error: err });
      res.status(201).json({ message: 'Event broadcasted successfully', id: results.insertId });
    }
  );
};
