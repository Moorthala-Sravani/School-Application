const db = require('./src/config/db');

const alterTableQuery = "ALTER TABLE attendance ADD COLUMN class_group VARCHAR(50);";

db.query(alterTableQuery, (err, results) => {
    if (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log("class_group already exists");
        } else {
            console.error("Error adding class_group:", err);
        }
    } else {
        console.log("class_group column added successfully");
    }
    process.exit();
});
