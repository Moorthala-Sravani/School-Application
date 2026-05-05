const db = require('./src/config/db');

const alterTableQuery = "ALTER TABLE messages ADD COLUMN class_group VARCHAR(50);";

db.query(alterTableQuery, (err, results) => {
    if (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log("class_group already exists in messages");
        } else {
            console.error("Error adding class_group to messages:", err);
        }
    } else {
        console.log("class_group column added to messages successfully");
    }
    process.exit();
});
