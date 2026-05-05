const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql2');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MySQL Database Connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'myapp'
});

db.connect((err) => {
  if (err) {
    console.error('MySQL connection failed:', err);
    return;
  }
  console.log('MySQL Connected');
});

// API Routes

// Login endpoint
app.post('/api/auth/login', (req, res) => {
  try {
    const { mobile, password, role } = req.body;
    
    console.log(`Login attempt: ${mobile}, role: ${role}`);
    
    if (!mobile || !password || !role) {
      return res.status(400).json({ error: 'Mobile, password, and role are required' });
    }
    
    // For demo purposes, accept any valid 10-digit mobile number with password length >= 4
    if (!/^\d{10}$/.test(mobile) || password.length < 4) {
      return res.status(401).json({ error: 'Invalid mobile number or password' });
    }
    
    // Generate a simple token (in production, use JWT)
    const token = `token_${Date.now()}_${mobile}`;
    
    // Mock user data based on role
    let userData = {
      token,
      id: Math.floor(Math.random() * 1000) + 1,
      mobile,
      role,
      firstName: role === 'Teacher' ? 'Teacher' : 'Parent',
      lastName: role === 'Teacher' ? 'User' : 'User'
    };
    
    console.log(`Login successful for ${mobile} as ${role}`);
    res.json(userData);
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get students by class
app.get('/api/profile/students/:classGroup', (req, res) => {
  try {
    const { classGroup } = req.params;
    console.log(`Fetching students for class: ${classGroup}`);
    
    // Query students from parents table
    const query = `
      SELECT id, firstname, lastname, child_name, child_class, mobile_number as parent_id
      FROM parents 
      WHERE child_class = ?
      ORDER BY child_name
    `;
    
    console.log(`Executing query: ${query} with param: ${classGroup}`);
    
    db.query(query, [classGroup], (err, results) => {
      if (err) {
        console.error('Database error fetching students:', err);
        return res.status(500).json({ error: 'Database error', details: err.message });
      }
      
      console.log(`Raw database results:`, results);
      
      // Format the response to match expected structure
      const students = results.map((student, index) => ({
        id: student.id,
        name: student.child_name || `${student.firstname || ''} ${student.lastname || ''}`.trim(),
        class_group: student.child_class,
        rollNo: `10${index < 9 ? '0' : ''}${index + 1}`,
        parent_id: student.parent_id,
        firstname: student.firstname,
        lastname: student.lastname
      }));
      
      console.log(`Formatted ${students.length} students for class ${classGroup}:`, students);
      res.json(students);
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Failed to fetch students', details: error.message });
  }
});

// Get attendance records with date filtering
app.get('/api/attendance', (req, res) => {
  try {
    const { class_group, date } = req.query;
    
    let query = 'SELECT * FROM attendance';
    let params = [];
    
    if (class_group || date) {
      query += ' WHERE';
      const conditions = [];
      
      if (class_group) {
        conditions.push(' class_group = ?');
        params.push(class_group);
      }
      
      if (date) {
        conditions.push(' DATE(date) = ?');
        params.push(date);
      }
      
      query += conditions.join(' AND');
    }
    
    query += ' ORDER BY date DESC, class_group';
    
    db.query(query, params, (err, results) => {
      if (err) {
        console.error('Error fetching attendance records:', err);
        return res.status(500).json({ error: 'Failed to fetch attendance records' });
      }
      
      console.log(`Found ${results.length} attendance records`);
      res.json(results);
    });
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    res.status(500).json({ error: 'Failed to fetch attendance records' });
  }
});

// Get teacher's classes
app.get('/api/profile/teachers/classes', (req, res) => {
  // Mock data - in real app, this would come from teacher profile
  res.json({
    '6A': 'Mr. Smith',
    '6B': 'Mrs. Johnson',
    '6C': 'Ms. Wilson',
    '7A': 'Dr. Brown',
    '7B': 'Prof. Davis'
  });
});

// Get notifications
app.get('/api/notifications', (req, res) => {
  const { type, unread, class_group } = req.query;
  
  let query = 'SELECT * FROM notifications WHERE 1=1';
  let params = [];
  
  if (type) {
    query += ' AND type = ?';
    params.push(type);
  }
  
  if (unread === 'true') {
    query += ' AND is_read = FALSE';
  }
  
  if (class_group) {
    query += ' AND class_group = ?';
    params.push(class_group);
  }
  
  query += ' ORDER BY created_at DESC';
  
  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Error fetching notifications:', err);
      return res.status(500).json({ error: 'Failed to fetch notifications' });
    }
    
    res.json(results);
  });
});

// Mark notification as read
app.patch('/api/notifications/:id/read', (req, res) => {
  const { id } = req.params;
  
  const query = 'UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE id = ?';
  
  db.query(query, [id], (err, result) => {
    if (err) {
      console.error('Error marking notification as read:', err);
      return res.status(500).json({ error: 'Failed to mark notification as read' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: 'Connected'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`API endpoints available:`);
  console.log(`  POST /api/auth/login - User login`);
  console.log(`  GET  /api/profile/students/:classGroup - Get students by class`);
  console.log(`  GET  /api/attendance - Get attendance records`);
  console.log(`  GET  /api/health - Health check`);
});

module.exports = app;
