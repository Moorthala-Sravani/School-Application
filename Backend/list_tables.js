const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'myapp'
});

db.connect((err) => {
  if (err) throw err;
  db.query('SHOW TABLES', (err, results) => {
    if (err) throw err;
    console.log(results);
    db.end();
  });
});
