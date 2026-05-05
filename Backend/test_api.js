const axios = require('axios');
const db = require('./src/config/db');

// First, get a valid teacher token
db.query('SELECT id FROM teachers LIMIT 1', async (err, res) => {
    if (err) return console.error(err);
    const teacherId = res[0].id;
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ id: teacherId, role: 'Teacher' }, 'secret', { expiresIn: '1h' });
    
    try {
        const response = await axios.post('http://localhost:5000/api/attendance/bulk', {
            date: "2026-04-28",
            class_group: "1-A",
            records: [
                { parent_id: 1, status: "present", remarks: "" }
            ]
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("Success:", response.data);
    } catch (e) {
        console.error("API Error:", e.response ? e.response.data : e.message);
    }
    process.exit(0);
});
