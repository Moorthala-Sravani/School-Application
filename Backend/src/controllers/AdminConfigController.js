const db = require('../config/db');

const isAdmin = (req, res) => {
  if (req.user?.role !== 'Admin') {
    res.status(403).json({ message: 'Forbidden' });
    return false;
  }
  return true;
};

// ── SCHOOL SETTINGS ──────────────────────────────────────────────────────────

exports.getSettings = (req, res) => {
  db.query('SELECT setting_key, setting_value FROM school_settings', [], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    const settings = {};
    rows.forEach(r => { settings[r.setting_key] = r.setting_value; });
    res.json(settings);
  });
};

exports.updateSettings = (req, res) => {
  if (!isAdmin(req, res)) return;
  const { working_days, min_attendance } = req.body;
  const updates = [];
  if (working_days !== undefined) updates.push(['working_days', String(working_days)]);
  if (min_attendance !== undefined) updates.push(['min_attendance', String(min_attendance)]);

  if (!updates.length) return res.json({ message: 'No changes' });

  let done = 0;
  let hasErr = null;
  updates.forEach(([key, val]) => {
    db.query(
      "INSERT INTO school_settings (setting_key, setting_value) VALUES (?, ?) ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = NOW()",
      [key, val],
      (err) => {
        if (err) hasErr = err;
        done++;
        if (done === updates.length) {
          if (hasErr) return res.status(500).json({ message: 'Database error', error: hasErr });
          res.json({ message: 'Settings saved' });
        }
      }
    );
  });
};

// ── UNIFORM CLASSES ───────────────────────────────────────────────────────────

exports.getUniforms = (req, res) => {
  db.query("SELECT * FROM uniform_classes WHERE status = 'active' ORDER BY id", [], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    res.json(rows);
  });
};

exports.createUniform = (req, res) => {
  if (!isAdmin(req, res)) return;
  const { class_range, components, annual_cost } = req.body;
  if (!class_range) return res.status(400).json({ message: 'class_range is required' });
  db.query(
    'INSERT INTO uniform_classes (class_range, components, annual_cost) VALUES (?, ?, ?)',
    [class_range, components || '', parseFloat(annual_cost) || 0],
    (err, result) => {
      if (err) return res.status(500).json({ message: 'Database error', error: err });
      res.status(201).json({ message: 'Uniform class added', id: result.insertId });
    }
  );
};

exports.updateUniform = (req, res) => {
  if (!isAdmin(req, res)) return;
  const { class_range, components, annual_cost } = req.body;
  db.query(
    'UPDATE uniform_classes SET class_range = ?, components = ?, annual_cost = ? WHERE id = ?',
    [class_range, components, parseFloat(annual_cost) || 0, req.params.id],
    (err, result) => {
      if (err) return res.status(500).json({ message: 'Database error', error: err });
      if (!result.affectedRows) return res.status(404).json({ message: 'Not found' });
      res.json({ message: 'Updated' });
    }
  );
};

exports.deleteUniform = (req, res) => {
  if (!isAdmin(req, res)) return;
  db.query("UPDATE uniform_classes SET status = 'inactive' WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    res.json({ message: 'Removed' });
  });
};

// ── FEE TYPES ─────────────────────────────────────────────────────────────────

exports.getFeeTypes = (req, res) => {
  db.query("SELECT * FROM fee_types WHERE status = 'active' ORDER BY id", [], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    res.json(rows);
  });
};

exports.createFeeType = (req, res) => {
  if (!isAdmin(req, res)) return;
  const { name, monthly_amount } = req.body;
  if (!name) return res.status(400).json({ message: 'name is required' });
  db.query(
    'INSERT INTO fee_types (name, monthly_amount) VALUES (?, ?)',
    [name, parseFloat(monthly_amount) || 0],
    (err, result) => {
      if (err) return res.status(500).json({ message: 'Database error', error: err });
      res.status(201).json({ message: 'Fee type added', id: result.insertId });
    }
  );
};

exports.updateFeeType = (req, res) => {
  if (!isAdmin(req, res)) return;
  const { name, monthly_amount } = req.body;
  db.query(
    'UPDATE fee_types SET name = ?, monthly_amount = ? WHERE id = ?',
    [name, parseFloat(monthly_amount) || 0, req.params.id],
    (err, result) => {
      if (err) return res.status(500).json({ message: 'Database error', error: err });
      if (!result.affectedRows) return res.status(404).json({ message: 'Not found' });
      res.json({ message: 'Updated' });
    }
  );
};

exports.deleteFeeType = (req, res) => {
  if (!isAdmin(req, res)) return;
  db.query("UPDATE fee_types SET status = 'inactive' WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    res.json({ message: 'Removed' });
  });
};

// ── LEAVE TYPES ───────────────────────────────────────────────────────────────

exports.getLeaveTypes = (req, res) => {
  db.query("SELECT * FROM leave_types WHERE status = 'active' ORDER BY id", [], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    res.json(rows);
  });
};

exports.createLeaveType = (req, res) => {
  if (!isAdmin(req, res)) return;
  const { type_name, days_allowed, applicable_to } = req.body;
  if (!type_name) return res.status(400).json({ message: 'type_name is required' });
  db.query(
    'INSERT INTO leave_types (type_name, days_allowed, applicable_to) VALUES (?, ?, ?)',
    [type_name, parseInt(days_allowed) || 0, applicable_to || 'student'],
    (err, result) => {
      if (err) return res.status(500).json({ message: 'Database error', error: err });
      res.status(201).json({ message: 'Leave type added', id: result.insertId });
    }
  );
};

exports.updateLeaveType = (req, res) => {
  if (!isAdmin(req, res)) return;
  const { type_name, days_allowed, applicable_to } = req.body;
  db.query(
    'UPDATE leave_types SET type_name = ?, days_allowed = ?, applicable_to = ? WHERE id = ?',
    [type_name, parseInt(days_allowed) || 0, applicable_to || 'student', req.params.id],
    (err, result) => {
      if (err) return res.status(500).json({ message: 'Database error', error: err });
      if (!result.affectedRows) return res.status(404).json({ message: 'Not found' });
      res.json({ message: 'Updated' });
    }
  );
};

exports.deleteLeaveType = (req, res) => {
  if (!isAdmin(req, res)) return;
  db.query("UPDATE leave_types SET status = 'inactive' WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    res.json({ message: 'Removed' });
  });
};

// ── FULL CONFIG EXPORT ────────────────────────────────────────────────────────

exports.getFullConfig = (req, res) => {
  const out = { uniforms: [], fees: [], leaves: [], settings: {} };
  let done = 0;
  let hasErr = null;

  const finish = (err) => {
    if (err) hasErr = err;
    done++;
    if (done === 4) {
      if (hasErr) return res.status(500).json({ message: 'Database error', error: hasErr });
      res.json(out);
    }
  };

  db.query("SELECT * FROM uniform_classes WHERE status = 'active' ORDER BY id", [], (err, rows) => { if (!err) out.uniforms = rows; finish(err); });
  db.query("SELECT * FROM fee_types WHERE status = 'active' ORDER BY id",        [], (err, rows) => { if (!err) out.fees    = rows; finish(err); });
  db.query("SELECT * FROM leave_types WHERE status = 'active' ORDER BY id",      [], (err, rows) => { if (!err) out.leaves  = rows; finish(err); });
  db.query('SELECT setting_key, setting_value FROM school_settings',             [], (err, rows) => {
    if (!err) rows.forEach(r => { out.settings[r.setting_key] = r.setting_value; });
    finish(err);
  });
};
