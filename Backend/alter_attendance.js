const db = require('./src/config/db');

const createTableQuery = `
CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    user_role ENUM('Parent', 'Teacher') NOT NULL DEFAULT 'Parent',
    date DATE NOT NULL,
    status ENUM('present', 'absent', 'holiday', 'leave_pending', 'leave_approved') NOT NULL DEFAULT 'present',
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

db.query(createTableQuery, (err, results) => {
    if (err) {
        console.error("Error creating attendance table:", err);
    } else {
        console.log("Attendance table created successfully");
    }
    process.exit();
});
