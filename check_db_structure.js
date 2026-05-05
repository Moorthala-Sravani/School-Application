const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'myapp'
});

db.connect(async (err) => {
  if (err) throw err;
  const tables = ['parents', 'teachers', 'attendance', 'admins'];
  for (const table of tables) {
    console.log(`\n===== ${table} =====`);
    const [results] = await db.promise().query(`DESCRIBE ${table}`);
    console.table(results);
  }
  db.end();
});
