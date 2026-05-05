const db = require('../config/db');

// @route   POST /api/notifications
// @desc    Broadcast a notification to specific groups
exports.broadcastNotification = (req, res) => {
  const { title, content, targetGroup } = req.body;

  if (!title || !content || !targetGroup) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  // In a robust implementation, this would insert into a dedicated notifications table
  // or push to FCM/APNS. We'll reuse the messages table to simulate broadcasting.
  
  // We'll treat targetGroup as a class_group in our messages table, e.g., "All Teachers", "All Parents", or "6-A"
  db.query(
    'INSERT INTO messages (sender_name, sender_type, receiver_id, receiver_type, title, content, class_group) VALUES (?, ?, ?, ?, ?, ?, ?)',
    ['Management', 'Admin', 0, 'Broadcast', title, content, targetGroup],
    (err, results) => {
      if (err) return res.status(500).json({ message: 'Database error', error: err });
      res.status(201).json({ message: 'Broadcast sent successfully', id: results.insertId });
    }
  );
};
