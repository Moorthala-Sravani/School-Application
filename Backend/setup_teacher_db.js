const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'myapp'
});

db.connect((err) => {
  if (err) throw err;
  console.log('MySQL Connected...');

  const createSalaryTable = `
    CREATE TABLE IF NOT EXISTS teacher_salary (
      id INT AUTO_INCREMENT PRIMARY KEY,
      teacher_id VARCHAR(50),
      month VARCHAR(20),
      year VARCHAR(10),
      basic_pay DECIMAL(10,2),
      hra DECIMAL(10,2),
      da DECIMAL(10,2),
      special_allowance DECIMAL(10,2),
      provident_fund DECIMAL(10,2),
      professional_tax DECIMAL(10,2),
      income_tax DECIMAL(10,2),
      status VARCHAR(20) DEFAULT 'Paid',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const createTimetableTable = `
    CREATE TABLE IF NOT EXISTS teacher_timetable (
      id INT AUTO_INCREMENT PRIMARY KEY,
      teacher_id VARCHAR(50),
      day_of_week VARCHAR(20),
      period_number INT,
      start_time VARCHAR(10),
      end_time VARCHAR(10),
      subject VARCHAR(50),
      class_section VARCHAR(20),
      room VARCHAR(20),
      is_break BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  db.query(createSalaryTable, (err) => {
    if (err) throw err;
    console.log('teacher_salary table ready');

    db.query(createTimetableTable, (err) => {
      if (err) throw err;
      console.log('teacher_timetable table ready');
      db.end();
    });
  });
});
