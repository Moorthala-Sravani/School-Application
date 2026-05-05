const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'myapp'
});

db.connect((err) => {
  if (err) throw err;
  db.query('ALTER TABLE teachers ADD COLUMN assigned_classes JSON', (err) => {
    if (err && err.code !== 'ER_DUP_FIELDNAME') throw err;
    console.log('assigned_classes column added');
    db.end();
  });
});
