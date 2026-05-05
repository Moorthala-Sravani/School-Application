const db = require('../config/db');

exports.getReportCard = (req, res) => {
  const { studentId } = req.query;

  if (!studentId) {
    return res.status(400).json({ message: 'Student ID is required' });
  }

  db.query(
    'SELECT * FROM report_cards WHERE student_id = ? ORDER BY id DESC LIMIT 1',
    [studentId],
    (err, reportResults) => {
      if (err) return res.status(500).json({ message: 'Database error', error: err });
      
      if (reportResults.length === 0) {
        return res.status(404).json({ message: 'Report card not found' });
      }

      const reportCard = reportResults[0];

      db.query(
        'SELECT * FROM subject_grades WHERE report_card_id = ?',
        [reportCard.id],
        (err, gradeResults) => {
          if (err) return res.status(500).json({ message: 'Database error', error: err });
          
          res.json({
            ...reportCard,
            subjects: gradeResults
          });
        }
      );
    }
  );
};

exports.createReportCard = (req, res) => {
  const { studentId, term, percentage, grade, top_percentile, working_days, present_days, file_url, subjects } = req.body;

  if (!studentId || !term) {
    return res.status(400).json({ message: 'studentId and term are required' });
  }

  db.query(
    'INSERT INTO report_cards (student_id, term, percentage, grade, top_percentile, working_days, present_days, file_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [studentId, term, percentage, grade, top_percentile, working_days, present_days, file_url || null],
    (err, result) => {
      if (err) return res.status(500).json({ message: 'Database error', error: err });
      
      const reportCardId = result.insertId;

      if (subjects && subjects.length > 0) {
        const values = subjects.map(sub => [reportCardId, sub.subject, sub.marks_obtained, sub.max_marks || 100]);
        db.query(
          'INSERT INTO subject_grades (report_card_id, subject, marks_obtained, max_marks) VALUES ?',
          [values],
          (err) => {
            if (err) return res.status(500).json({ message: 'Database error on subjects', error: err });
            res.status(201).json({ message: 'Report card uploaded successfully', id: reportCardId });
          }
        );
      } else {
        res.status(201).json({ message: 'Report card uploaded successfully', id: reportCardId });
      }
    }
  );
};
