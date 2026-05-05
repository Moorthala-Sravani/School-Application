const db = require('../config/db');

// ── GET /api/books — list all active books (optionally filter by class) ──────
exports.getBooks = (req, res) => {
  const { class: classFilter, subject } = req.query;
  let query = 'SELECT * FROM books WHERE status = \'active\'';
  const params = [];
  let i = 1;

  if (classFilter) {
    query += ` AND (required_for_class = $${i} OR required_for_class IS NULL)`;
    params.push(classFilter);
    i++;
  }
  if (subject) {
    query += ` AND subject = $${i}`;
    params.push(subject);
    i++;
  }
  query += ' ORDER BY subject, title';

  db.query(query, params, (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    res.json(results);
  });
};

// ── GET /api/books/:id — single book ─────────────────────────────────────────
exports.getBookById = (req, res) => {
  db.query('SELECT * FROM books WHERE id = ?', [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    if (!results.length) return res.status(404).json({ message: 'Book not found' });
    res.json(results[0]);
  });
};

// ── POST /api/books — admin adds a book ──────────────────────────────────────
exports.createBook = (req, res) => {
  const { role } = req.user;
  if (role !== 'Admin') return res.status(403).json({ message: 'Forbidden' });

  const { title, author, isbn, subject, edition, total_quantity, required_for_class, price } = req.body;
  if (!title) return res.status(400).json({ message: 'Title is required' });

  const qty = parseInt(total_quantity) || 0;
  db.query(
    'INSERT INTO books (title, author, isbn, subject, edition, total_quantity, available_quantity, required_for_class, price) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [title, author || null, isbn || null, subject || null, edition || null, qty, qty, required_for_class || null, price || null],
    (err, result) => {
      if (err) return res.status(500).json({ message: 'Database error', error: err });
      res.status(201).json({ message: 'Book added successfully', id: result.insertId });
    }
  );
};

// ── PUT /api/books/:id — admin updates a book ─────────────────────────────────
exports.updateBook = (req, res) => {
  const { role } = req.user;
  if (role !== 'Admin') return res.status(403).json({ message: 'Forbidden' });

  const { title, author, isbn, subject, edition, total_quantity, available_quantity, required_for_class, price, status } = req.body;
  db.query(
    'UPDATE books SET title = ?, author = ?, isbn = ?, subject = ?, edition = ?, total_quantity = ?, available_quantity = ?, required_for_class = ?, price = ?, status = ? WHERE id = ?',
    [title, author, isbn, subject, edition, total_quantity, available_quantity, required_for_class, price, status || 'active', req.params.id],
    (err, result) => {
      if (err) return res.status(500).json({ message: 'Database error', error: err });
      if (!result.affectedRows) return res.status(404).json({ message: 'Book not found' });
      res.json({ message: 'Book updated successfully' });
    }
  );
};

// ── GET /api/books/requests/my — parent views their child's requests ──────────
exports.getMyRequests = (req, res) => {
  const { id: parentId, role } = req.user;
  if (role !== 'Parent') return res.status(403).json({ message: 'Forbidden' });

  db.query(
    `SELECT br.*, b.title, b.author, b.subject, b.edition, b.price
     FROM book_requests br
     JOIN books b ON br.book_id = b.id
     WHERE br.parent_id = ?
     ORDER BY br.created_at DESC`,
    [parentId],
    (err, results) => {
      if (err) return res.status(500).json({ message: 'Database error', error: err });
      res.json(results);
    }
  );
};

// ── POST /api/books/requests — parent submits a book request ─────────────────
exports.submitRequest = (req, res) => {
  const { id: parentId, role } = req.user;
  if (role !== 'Parent') return res.status(403).json({ message: 'Forbidden' });

  const { book_ids, special_request } = req.body;
  if (!book_ids || !Array.isArray(book_ids) || book_ids.length === 0) {
    return res.status(400).json({ message: 'At least one book must be selected' });
  }

  db.query('SELECT child_name, child_class FROM parents WHERE id = ?', [parentId], (err, parentRes) => {
    if (err || !parentRes.length) return res.status(500).json({ message: 'Parent not found' });

    const { child_name, child_class } = parentRes[0];
    const created = [];
    let pending = book_ids.length;

    book_ids.forEach(bookId => {
      db.query(
        'SELECT id FROM book_requests WHERE parent_id = ? AND book_id = ? AND status NOT IN (\'returned\', \'rejected\')',
        [parentId, bookId],
        (err2, existing) => {
          if (err2 || existing.length > 0) {
            pending--;
            if (pending === 0) res.status(201).json({ message: `${created.length} request(s) submitted`, created });
            return;
          }

          db.query(
            'INSERT INTO book_requests (parent_id, book_id, student_name, student_class, status, special_request) VALUES (?, ?, ?, ?, \'pending\', ?)',
            [parentId, bookId, child_name, child_class, special_request || null],
            (err3, result) => {
              if (!err3) created.push(result.insertId);
              pending--;
              if (pending === 0) res.status(201).json({ message: `${created.length} request(s) submitted`, created });
            }
          );
        }
      );
    });
  });
};

// ── GET /api/books/requests/pending — teacher sees pending requests for class ─
exports.getPendingRequests = (req, res) => {
  const { role } = req.user;
  if (role !== 'Teacher' && role !== 'Admin') return res.status(403).json({ message: 'Forbidden' });

  const { class_group, status: statusFilter } = req.query;
  let query = `SELECT br.*, b.title, b.author, b.subject, b.available_quantity, b.price
               FROM book_requests br
               JOIN books b ON br.book_id = b.id`;
  const params = [];
  const conditions = [];
  let i = 1;

  if (class_group) {
    conditions.push(`br.student_class = $${i++}`);
    params.push(class_group);
  }
  if (statusFilter) {
    conditions.push(`br.status = $${i++}`);
    params.push(statusFilter);
  } else {
    conditions.push(`br.status IN ('pending', 'approved', 'collected')`);
  }

  if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
  query += ' ORDER BY br.created_at DESC';

  db.query(query, params, (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    res.json(results);
  });
};

// ── PUT /api/books/requests/:id/approve — teacher approves/rejects ────────────
exports.updateRequestStatus = (req, res) => {
  const { id: teacherId, role } = req.user;
  if (role !== 'Teacher' && role !== 'Admin') return res.status(403).json({ message: 'Forbidden' });

  const { status, approval_notes } = req.body;
  const validStatuses = ['approved', 'rejected', 'collected', 'returned'];
  if (!validStatuses.includes(status)) return res.status(400).json({ message: 'Invalid status' });

  db.query('SELECT * FROM book_requests WHERE id = ?', [req.params.id], (err, rows) => {
    if (err || !rows.length) return res.status(404).json({ message: 'Request not found' });
    const request = rows[0];

    const updates = {
      status,
      teacher_id: teacherId,
      approval_notes: approval_notes || null,
      approval_date: status === 'approved' ? new Date().toISOString() : request.approval_date,
      collection_date: status === 'collected' ? new Date().toISOString() : request.collection_date,
      return_date: status === 'returned' ? new Date().toISOString() : request.return_date,
    };

    db.query(
      'UPDATE book_requests SET status = ?, teacher_id = ?, approval_notes = ?, approval_date = ?, collection_date = ?, return_date = ? WHERE id = ?',
      [updates.status, updates.teacher_id, updates.approval_notes, updates.approval_date, updates.collection_date, updates.return_date, req.params.id],
      (err2, result) => {
        if (err2) return res.status(500).json({ message: 'Database error', error: err2 });

        // Update available quantity when collected or returned
        if (status === 'collected' && request.status === 'approved') {
          db.query('UPDATE books SET available_quantity = available_quantity - 1 WHERE id = ? AND available_quantity > 0', [request.book_id]);
        } else if (status === 'returned' && request.status === 'collected') {
          db.query('UPDATE books SET available_quantity = available_quantity + 1 WHERE id = ?', [request.book_id]);
        }

        // Log the transaction
        db.query(
          'INSERT INTO book_transactions (action, user_id, book_id, request_id, notes) VALUES (?, ?, ?, ?, ?)',
          [status, teacherId, request.book_id, request.id, approval_notes || null]
        );

        res.json({ message: `Request ${status} successfully` });
      }
    );
  });
};

// ── GET /api/books/requests/all — admin sees all requests ────────────────────
exports.getAllRequests = (req, res) => {
  const { role } = req.user;
  if (role !== 'Admin') return res.status(403).json({ message: 'Forbidden' });

  const { status: statusFilter, class_group } = req.query;
  let query = `SELECT br.*, b.title, b.author, b.subject, b.price
               FROM book_requests br
               JOIN books b ON br.book_id = b.id`;
  const params = [];
  const conditions = [];
  let i = 1;

  if (statusFilter) { conditions.push(`br.status = $${i++}`); params.push(statusFilter); }
  if (class_group)  { conditions.push(`br.student_class = $${i++}`); params.push(class_group); }

  if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
  query += ' ORDER BY br.created_at DESC';

  db.query(query, params, (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    res.json(results);
  });
};

// ── GET /api/books/inventory — admin inventory summary ───────────────────────
exports.getInventory = (req, res) => {
  const { role } = req.user;
  if (role !== 'Admin' && role !== 'Teacher') return res.status(403).json({ message: 'Forbidden' });

  db.query(
    `SELECT b.*,
       COUNT(CASE WHEN br.status = 'pending'   THEN 1 END) AS pending_requests,
       COUNT(CASE WHEN br.status = 'approved'  THEN 1 END) AS approved_requests,
       COUNT(CASE WHEN br.status = 'collected' THEN 1 END) AS collected_count,
       COUNT(CASE WHEN br.status = 'returned'  THEN 1 END) AS returned_count
     FROM books b
     LEFT JOIN book_requests br ON b.id = br.book_id
     GROUP BY b.id
     ORDER BY b.subject, b.title`,
    [],
    (err, results) => {
      if (err) return res.status(500).json({ message: 'Database error', error: err });
      res.json(results);
    }
  );
};
