const db = require('../config/db');

exports.processPayment = (req, res) => {
  const { amount, payment_method, card_details, transaction_id, fee_ids } = req.body;
  const parent_id = req.user.id;
  const student_id = req.user.child_id || 'STU-123';

  if (!amount || !payment_method) {
    return res.status(400).json({ message: 'Amount and payment method are required.' });
  }

  const final_txn_id = transaction_id || `TXN-${Date.now()}`;

  db.query(
    'INSERT INTO payments (parent_id, student_id, amount, payment_method, card_details, transaction_id, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [parent_id, student_id, amount, payment_method, card_details || null, final_txn_id, 'success'],
    (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'Database error', error: err });
      }
      
      // Update fees status
      if (fee_ids && fee_ids.length > 0) {
        db.query("UPDATE fees SET status = 'Paid' WHERE id IN (?)", [fee_ids], (updateErr) => {
          if (updateErr) console.error('Failed to update fees status', updateErr);
        });
      }

      res.status(201).json({
        message: 'Payment processed successfully',
        transaction_id: final_txn_id,
        receipt: {
          amount,
          payment_method,
          transaction_id: final_txn_id,
          date: new Date().toISOString()
        }
      });
    }
  );
};

exports.getAllPayments = (req, res) => {
  db.query(
    'SELECT * FROM payments ORDER BY created_at DESC',
    (err, results) => {
      if (err) return res.status(500).json({ message: 'Database error', error: err });
      res.json(results);
    }
  );
};

exports.getPayments = (req, res) => {
  const parent_id = req.user.id;

  db.query(
    'SELECT * FROM payments WHERE parent_id = ? ORDER BY created_at DESC',
    [parent_id],
    (err, results) => {
      if (err) return res.status(500).json({ message: 'Database error', error: err });
      res.json(results);
    }
  );
};
