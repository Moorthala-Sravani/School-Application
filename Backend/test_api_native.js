const http = require('http');
const db = require('./src/config/db');
const jwt = require('jsonwebtoken');

db.query('SELECT id FROM teachers LIMIT 1', (err, res) => {
    if (err) return console.error(err);
    const teacherId = res[0].id;
    const token = jwt.sign({ id: teacherId, role: 'Teacher' }, 'secret', { expiresIn: '1h' });

    const data = JSON.stringify({
        date: "2026-04-28",
        class_group: "1-A",
        records: [
            { parent_id: 1, status: "present", remarks: "" }
        ]
    });

    const options = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/attendance/bulk',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Content-Length': data.length
        }
    };

    const req = http.request(options, (res) => {
        let responseBody = '';
        res.on('data', (chunk) => { responseBody += chunk; });
        res.on('end', () => {
            console.log(`Status: ${res.statusCode}`);
            console.log(`Body: ${responseBody}`);
            process.exit(0);
        });
    });

    req.on('error', (e) => {
        console.error(`Problem with request: ${e.message}`);
        process.exit(1);
    });

    req.write(data);
    req.end();
});
