const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'myapp'
});

db.connect((err) => {
  if (err) throw err;
  
  const checkData = (table) => {
    return new Promise((resolve) => {
      db.query(`SELECT COUNT(*) as count FROM ${table}`, (err, results) => {
        resolve({ table, count: results[0].count });
      });
    });
  };

  Promise.all([
    checkData('events'),
    checkData('bus_routes'),
    checkData('bus_stops'),
    checkData('report_cards'),
    checkData('subject_grades'),
    checkData('fees')
  ]).then(results => {
    console.log(results);
    db.end();
  });
});
