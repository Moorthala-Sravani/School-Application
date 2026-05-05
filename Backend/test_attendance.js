const db = require('./src/config/db');

db.query('DESCRIBE attendance', (err, res) => {
    if (err) console.error("DESC error", err);
    else console.log("Columns:", res.map(r => r.Field).join(', '));
    
    // try to manually insert
    db.query('INSERT INTO attendance (user_id, user_role, date, status, reason, class_group) VALUES (1, "Parent", "2026-04-28", "present", NULL, "6-A")', (err2, res2) => {
        if (err2) console.error("INSERT error:", err2.message);
        else console.log("INSERT success");
        
        process.exit(0);
    });
});
