const db = require('../config/db');
const PDFDocument = require('pdfkit');

// @route   POST /api/billing/fees
// @desc    Generate a fee bill
exports.generateFeeBill = (req, res) => {
  const { studentId, term, amount, dueDate } = req.body;

  if (!studentId || !term || !amount) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  db.query(
    'INSERT INTO fees (student_id, fee_name, amount, due_date, status, term) VALUES (?, ?, ?, ?, ?, ?)',
    [parseInt(studentId.toString().replace(/\D/g, '')) || 1, 'School Fee', amount, dueDate || new Date(), 'Due', term],
    (err, results) => {
      if (err) return res.status(500).json({ message: 'Database error', error: err });
      res.status(201).json({ message: 'Fee bill generated successfully', feeId: results.insertId });
    }
  );
};

// @route   POST /api/billing/bus
// @desc    Generate a bus bill
exports.generateBusBill = (req, res) => {
  const { studentId, month, amount, dueDate } = req.body;

  if (!studentId || !month || !amount) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  // Same logic, insert into fees table but tag as Bus Fee
  const termName = `Bus Fee - ${month}`;
  db.query(
    'INSERT INTO fees (student_id, fee_name, amount, due_date, status, term) VALUES (?, ?, ?, ?, ?, ?)',
    [parseInt(studentId.toString().replace(/\D/g, '')) || 1, 'Transport Fee', amount, dueDate || new Date(), 'Due', termName],
    (err, results) => {
      if (err) return res.status(500).json({ message: 'Database error', error: err });
      res.status(201).json({ message: 'Bus bill generated successfully', feeId: results.insertId });
    }
  );
};

// @route   GET /api/billing/download/:feeId
// @desc    Download fee bill as PDF
exports.downloadFeeBill = (req, res) => {
  const feeId = req.params.feeId;
  
  db.query('SELECT * FROM fees WHERE id = ?', [feeId], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    if (results.length === 0) return res.status(404).json({ message: 'Fee record not found' });
    
    const fee = results[0];
    const studentId = fee.student_id;

    db.query('SELECT child_name FROM parents WHERE child_class = ? OR id = ? LIMIT 1', [studentId, studentId], (err2, parentResults) => {
      let studentName = studentId;
      if (!err2 && parentResults.length > 0 && parentResults[0].child_name) {
        studentName = parentResults[0].child_name;
      }

      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=Invoice_${feeId}.pdf`);

      doc.pipe(res);

      doc.fontSize(24).font('Helvetica-Bold').text('Greenfield Academy', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(12).font('Helvetica').text('Official Fee Invoice', { align: 'center' });
      doc.moveDown(2);

      doc.fontSize(12).font('Helvetica-Bold').text('Invoice #:', { continued: true }).font('Helvetica').text(` ${fee.id}`);
      doc.font('Helvetica-Bold').text('Date:', { continued: true }).font('Helvetica').text(` ${new Date(fee.created_at || Date.now()).toLocaleDateString()}`);
      doc.moveDown(1.5);

      doc.fontSize(14).font('Helvetica-Bold').text('Billed To:');
      doc.moveDown(0.5);
      doc.fontSize(12).font('Helvetica').text(`Student Name: ${studentName}`);
      doc.text(`Student ID: ${fee.student_id}`);
      doc.moveDown(2);

      const tableTop = doc.y;
      
      doc.font('Helvetica-Bold');
      doc.text('Description', 50, tableTop);
      doc.text('Amount Due', 300, tableTop, { width: 100, align: 'right' });
      doc.text('Status', 450, tableTop, { width: 100, align: 'right' });
      
      doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();
      
      doc.font('Helvetica');
      doc.text(fee.fee_name || fee.term, 50, tableTop + 25);
      doc.text(`$${fee.amount}`, 300, tableTop + 25, { width: 100, align: 'right' });
      doc.text(fee.status, 450, tableTop + 25, { width: 100, align: 'right' });

      doc.moveTo(50, tableTop + 45).lineTo(550, tableTop + 45).stroke();

      doc.moveDown(5);
      doc.fontSize(10).font('Helvetica-Oblique').text('Thank you for your prompt payment!', { align: 'center' });

      doc.end();
    });
  });
};
