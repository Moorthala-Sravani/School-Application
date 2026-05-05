const db = require('./src/config/db');
db.query('ALTER TABLE teachers ADD COLUMN class_teacher VARCHAR(50) DEFAULT NULL', (err, res) => {
    if (err && err.code !== 'ER_DUP_FIELDNAME') {
        console.error(err);
        process.exit(1);
    }
    console.log('Column added or already exists');
    process.exit(0);
});
