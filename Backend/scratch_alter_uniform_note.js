const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'myapp'
});

db.connect((err) => {
  if (err) throw err;
  db.query("ALTER TABLE uniform_measurements ADD COLUMN admin_note TEXT", (err) => {
    if (err) {
      console.log('Error or already exists', err.message);
    } else {
      console.log('Added admin_note column');
    }
    db.end();
  });
});
