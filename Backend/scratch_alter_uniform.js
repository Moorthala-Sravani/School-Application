const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'myapp'
});

db.connect((err) => {
  if (err) throw err;
  db.query("ALTER TABLE uniform_measurements ADD COLUMN status VARCHAR(20) DEFAULT 'Pending'", (err) => {
    if (err) {
      console.log('Error or already exists', err.message);
    } else {
      console.log('Added status column');
    }
    db.end();
  });
});
