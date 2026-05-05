const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'myapp'
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('MySQL Connected...');

  const createPaymentsTable = `
    CREATE TABLE IF NOT EXISTS payments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      parent_id VARCHAR(50),
      student_id VARCHAR(50),
      amount DECIMAL(10, 2),
      payment_method VARCHAR(50),
      card_details VARCHAR(255),
      status VARCHAR(20) DEFAULT 'success',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const createUniformTable = `
    CREATE TABLE IF NOT EXISTS uniform_measurements (
      id INT AUTO_INCREMENT PRIMARY KEY,
      parent_id VARCHAR(50),
      student_id VARCHAR(50),
      height VARCHAR(20),
      width VARCHAR(20),
      required_items JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  db.query(createPaymentsTable, (err, result) => {
    if (err) throw err;
    console.log('Payments table ready');

    db.query(createUniformTable, (err, result) => {
      if (err) throw err;
      console.log('Uniform table ready');
      db.end();
    });
  });
});
