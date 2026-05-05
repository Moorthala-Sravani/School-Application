const db = require('../config/db');

// @route   GET /api/messages
// @desc    Get messages for the logged-in user
const getMessages = (req, res) => {
  const { role, id: userId } = req.user;
  const reqClassGroup = req.query.class_group;

  if (reqClassGroup === 'Management') {
    // 1-on-1 chat with management
    const threadId = `Management_${role}_${userId}`;
    db.query('SELECT * FROM messages WHERE class_group = ? ORDER BY created_at ASC', [threadId], (err, results) => {
      if (err) return res.status(500).json({ message: 'Database error', error: err });
      res.json(results);
    });
    return;
  }

  // Retrieve messages where class_group matches
  if (role === 'Parent') {
    db.query(
      'SELECT child_class FROM parents WHERE id = ?',
      [userId],
      (err, results) => {
        if (err || results.length === 0) return res.status(500).json({ message: 'Database error' });
        const childClass = results[0].child_class;
        db.query(
          'SELECT * FROM messages WHERE class_group = ? ORDER BY created_at ASC',
          [childClass],
          (err, msgResults) => {
            if (err) return res.status(500).json({ message: 'Database error', error: err });
            res.json(msgResults);
          }
        );
      }
    );
  } else if (role === 'Teacher') {
    const classGroups = Array.isArray(reqClassGroup) 
      ? reqClassGroup 
      : (reqClassGroup ? String(reqClassGroup).split(',') : ['6-A']);

    db.query(
      'SELECT * FROM messages WHERE class_group IN (?) ORDER BY created_at ASC',
      [classGroups],
      (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json(results);
      }
    );
  }
};

// @route   PUT /api/messages/:id/read
// @desc    Mark a message as read
const markMessageAsRead = (req, res) => {
  const { role, id: userId } = req.user;
  const messageId = req.params.id;

  db.query(
    'UPDATE messages SET is_read = TRUE WHERE id = ? AND receiver_id = ? AND receiver_type = ?',
    [messageId, userId, role],
    (err, results) => {
      if (err) return res.status(500).json({ message: 'Database error', error: err });
      if (results.affectedRows === 0) return res.status(404).json({ message: 'Message not found or not yours' });
      res.json({ message: 'Message marked as read' });
    }
  );
};

// @route   POST /api/messages
// @desc    Send a message
const sendMessage = (req, res) => {
  const { role, id: userId } = req.user;
  const { content, class_group } = req.body;

  const table = role === 'Parent' ? 'parents' : (role === 'Admin' ? 'admins' : 'teachers');

  db.query(`SELECT firstname, lastname${role === 'Parent' ? ', child_class' : ''} FROM ${table} WHERE id = ?`, [userId], (err, results) => {
    if (err || results.length === 0) return res.status(500).json({ message: 'Error finding user' });
    
    const senderName = `${results[0].firstname} ${results[0].lastname}`;
    
    let targetClasses = [];
    if (class_group === 'Management') {
      targetClasses = [`Management_${role}_${userId}`];
    } else if (role === 'Parent') {
      targetClasses = [results[0].child_class];
    } else {
      if (Array.isArray(class_group)) {
        targetClasses = class_group;
      } else {
        targetClasses = class_group ? String(class_group).split(',') : ['6-A'];
      }
    }

    // Deduplicate array
    targetClasses = [...new Set(targetClasses)];

    // Insert a message for each class
    const msgTitle = req.body.title || 'Message';
    const rawTargetRole = req.body.targetRole || req.body.target_role || req.body.receiver_type || req.body.receiver_role;
    
    // Validate target role to prevent enum crash
    let targetRole = 'Parent';
    if (rawTargetRole && ['Teacher', 'Admin', 'Parent'].includes(rawTargetRole)) {
      targetRole = rawTargetRole;
    } else if (rawTargetRole === 'Management') {
      targetRole = 'Admin';
    }

    const values = targetClasses.map(cls => [senderName, role, 0, targetRole, msgTitle, content, cls]);

    db.query(
      'INSERT INTO messages (sender_name, sender_type, receiver_id, receiver_type, title, content, class_group) VALUES ?',
      [values],
      (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.status(201).json({ message: 'Message sent successfully', insertedRows: results.affectedRows });
      }
    );
  });
};

const getManagementMessages = (req, res) => {
  db.query("SELECT * FROM messages WHERE class_group LIKE 'Management_%' ORDER BY created_at DESC", (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    res.json(results);
  });
};

module.exports = { getMessages, markMessageAsRead, sendMessage, getManagementMessages };
