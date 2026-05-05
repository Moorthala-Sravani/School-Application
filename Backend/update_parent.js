const db = require('./src/config/db');
db.query("UPDATE parents SET child_class = '6-A' WHERE id = 1;", (err, res) => {
  console.log(err || 'Parent child_class updated');
  process.exit();
});
