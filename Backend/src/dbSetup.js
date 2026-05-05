const db = require('./config/db');

const queries = [
  // 1. Students Table (For Onboarding & general linking)
  `CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(50) UNIQUE NOT NULL,
    firstname VARCHAR(100) NOT NULL,
    lastname VARCHAR(100) NOT NULL,
    standard VARCHAR(50) NOT NULL,
    parent_id INT,
    FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE SET NULL
  )`,

  // 2. Fees Table
  `CREATE TABLE IF NOT EXISTS fees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    fee_name VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    due_date DATE,
    status ENUM('Paid', 'Due') DEFAULT 'Due',
    term VARCHAR(50),
    is_refundable BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
  )`,

  // 3. Events Table
  `CREATE TABLE IF NOT EXISTS events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    date DATE NOT NULL,
    type ENUM('Event', 'Holiday', 'Exam', 'School', 'Cultural') NOT NULL,
    description TEXT,
    time VARCHAR(50)
  )`,

  // 4. Report Cards
  `CREATE TABLE IF NOT EXISTS report_cards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    term VARCHAR(50) NOT NULL,
    percentage DECIMAL(5,2),
    grade VARCHAR(5),
    top_percentile VARCHAR(10),
    working_days INT,
    present_days INT,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
  )`,

  // 5. Subject Grades
  `CREATE TABLE IF NOT EXISTS subject_grades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    report_card_id INT NOT NULL,
    subject VARCHAR(100) NOT NULL,
    marks_obtained INT NOT NULL,
    max_marks INT DEFAULT 100,
    FOREIGN KEY (report_card_id) REFERENCES report_cards(id) ON DELETE CASCADE
  )`,

  // 6. Bus Routes
  `CREATE TABLE IF NOT EXISTS bus_routes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    route_number VARCHAR(20) NOT NULL,
    route_name VARCHAR(100) NOT NULL,
    bus_plate VARCHAR(50),
    driver_name VARCHAR(100),
    driver_contact VARCHAR(20),
    status ENUM('Live', 'Offline', 'En route') DEFAULT 'Live'
  )`,

  // 7. Bus Stops
  `CREATE TABLE IF NOT EXISTS bus_stops (
    id INT AUTO_INCREMENT PRIMARY KEY,
    route_id INT NOT NULL,
    stop_name VARCHAR(150) NOT NULL,
    eta_time VARCHAR(20),
    status ENUM('Done', 'Next', 'Pending') DEFAULT 'Pending',
    stop_order INT NOT NULL,
    FOREIGN KEY (route_id) REFERENCES bus_routes(id) ON DELETE CASCADE
  )`,

  // 8. Teacher Timetable
  `CREATE TABLE IF NOT EXISTS teacher_timetable (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL,
    day_of_week VARCHAR(15) NOT NULL,
    period_number INT NOT NULL,
    time_slot VARCHAR(20) NOT NULL,
    subject VARCHAR(50) NOT NULL,
    class_group VARCHAR(20) NOT NULL
  )`,

  // 9. Teacher Salary
  `CREATE TABLE IF NOT EXISTS teacher_salary (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL,
    month VARCHAR(20) NOT NULL,
    basic_pay INT NOT NULL,
    allowances INT NOT NULL,
    deductions INT NOT NULL,
    net_salary INT NOT NULL,
    status ENUM('Paid', 'Pending') DEFAULT 'Pending',
    date_paid DATE
  )`,

  // 10. Messages
  `CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_name VARCHAR(150) NOT NULL,
    sender_type VARCHAR(50) NOT NULL,
    receiver_id INT NOT NULL,
    receiver_type VARCHAR(50) NOT NULL,
    title VARCHAR(200),
    content TEXT NOT NULL,
    class_group VARCHAR(50),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // 11. Uniform Measurements
  `CREATE TABLE IF NOT EXISTS uniform_measurements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    parent_id INT NOT NULL,
    student_id VARCHAR(50),
    height DECIMAL(5,2) NOT NULL,
    width DECIMAL(5,2) NOT NULL,
    required_items TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending',
    admin_note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`
];

async function runQueries() {
  for (let q of queries) {
    await new Promise((resolve, reject) => {
      db.query(q, (err, results) => {
        if (err) {
          console.error('Error executing query:', err);
          reject(err);
        } else {
          console.log('Query executed successfully');
          resolve(results);
        }
      });
    });
  }

  // Insert Dummy Data
  try {
    const classes = [
      'Pre-KG', 'LKG', 'UKG',
      '1-A', '1-B', '1-C', '1-D', '1-E', '1-F',
      '2-A', '2-B', '2-C', '2-D', '2-E', '2-F',
      '3-A', '3-B', '3-C', '3-D', '3-E', '3-F',
      '4-A', '4-B', '4-C', '4-D', '4-E', '4-F',
      '5-A', '5-B', '5-C', '5-D', '5-E', '5-F',
      '6-A', '6-B', '6-C', '6-D', '6-E', '6-F',
      '7-A', '7-B', '7-C', '7-D', '7-E', '7-F',
      '8-A', '8-B', '8-C', '8-D', '8-E', '8-F',
      '9-A', '9-B', '9-C', '9-D', '9-E', '9-F',
      '10-A', '10-B', '10-C', '10-D', '10-E', '10-F',
      '11-A', '11-B', '11-C', '11-D', '11-E', '11-F',
      '12-A', '12-B', '12-C', '12-D', '12-E', '12-F'
    ];

    console.log("Generating 60 students per class...");
    for (let c of classes) {
      const parentValues = [];
      const studentValues = [];
      
      for (let i = 1; i <= 60; i++) {
        const studentName = `Student ${i}`;
        const parentName = `Parent ${i} ${c.replace('-', '')}`;
        const mobileNum = `999${c.replace(/[^0-9]/g, '').padStart(2, '0')}${(i).toString().padStart(4, '0')}`; // unique-ish
        
        // We will insert parents first, but since we use INSERT IGNORE, let's just do it
        parentValues.push(`('${parentName}', 'Doe', '${mobileNum}', '123456', '${studentName}', '${c}')`);
      }

      // Batch insert parents
      if (parentValues.length > 0) {
        await new Promise((resolve) => {
          db.query(`INSERT IGNORE INTO parents (firstname, lastname, mobile_number, password, child_name, child_class) VALUES ${parentValues.join(',')}`, () => resolve());
        });
      }

      // Now fetch those inserted parents to link students
      const parentsRows = await new Promise((resolve) => {
        db.query(`SELECT id, child_name FROM parents WHERE child_class = '${c}' LIMIT 60`, (err, res) => resolve(res || []));
      });

      const stVals = [];
      parentsRows.forEach((p, idx) => {
        const sid = `STU-${c.replace('-', '')}-${idx+1}`;
        stVals.push(`('${sid}', '${p.child_name}', 'Doe', '${c}', ${p.id})`);
      });

      if (stVals.length > 0) {
        await new Promise((resolve) => {
          db.query(`INSERT IGNORE INTO students (student_id, firstname, lastname, standard, parent_id) VALUES ${stVals.join(',')}`, () => resolve());
        });
      }
    }

    // Existing hardcoded data to keep the specific dashboard data functional
    await new Promise((resolve) => db.query("INSERT IGNORE INTO students (student_id, firstname, lastname, standard) VALUES ('STU-2024-0642', 'Aryan', 'Reddy', 'Grade 6 - A')", () => resolve()));
    
    // We need to fetch the inserted student ID
    db.query("SELECT id FROM students WHERE student_id = 'STU-2024-0642'", async (err, res) => {
      if (!err && res.length > 0) {
        const sid = res[0].id;
        
        // Dummy Fees
        await new Promise(r => db.query("INSERT IGNORE INTO fees (student_id, fee_name, amount, due_date, status, term, is_refundable) VALUES (?, 'Bus fee', 3200, '2026-04-30', 'Due', 'Term 2', false)", [sid], () => r()));
        await new Promise(r => db.query("INSERT IGNORE INTO fees (student_id, fee_name, amount, status, term, is_refundable) VALUES (?, 'Book deposit', 3000, 'Due', null, true)", [sid], () => r()));
        await new Promise(r => db.query("INSERT IGNORE INTO fees (student_id, fee_name, amount, status, term, is_refundable) VALUES (?, 'School fee', 18500, 'Paid', 'Term 2', false)", [sid], () => r()));

        // Dummy Events
        await new Promise(r => db.query("INSERT IGNORE INTO events (title, date, type, description, time) VALUES ('Term 2 exams begin', '2026-04-28', 'Exam', 'All grades', '9 AM')", () => r()));
        await new Promise(r => db.query("INSERT IGNORE INTO events (title, date, type, description, time) VALUES ('Science exhibition', '2026-05-06', 'School', 'Gr. 6-10', '10 AM')", () => r()));
        await new Promise(r => db.query("INSERT IGNORE INTO events (title, date, type, description, time) VALUES ('Annual Day', '2026-05-15', 'Cultural', 'All families', '5 PM')", () => r()));

        // Dummy Report Card
        await new Promise(r => db.query("INSERT IGNORE INTO report_cards (student_id, term, percentage, grade, top_percentile, working_days, present_days) VALUES (?, 'Term 1', 84, 'A', '15%', 95, 89)", [sid], () => r()));
        
        db.query("SELECT id FROM report_cards WHERE student_id = ?", [sid], async (err, res2) => {
            if (!err && res2.length > 0) {
                const rid = res2[0].id;
                await new Promise(r => db.query("INSERT IGNORE INTO subject_grades (report_card_id, subject, marks_obtained) VALUES (?, 'Mathematics', 88)", [rid], () => r()));
                await new Promise(r => db.query("INSERT IGNORE INTO subject_grades (report_card_id, subject, marks_obtained) VALUES (?, 'English', 91)", [rid], () => r()));
                await new Promise(r => db.query("INSERT IGNORE INTO subject_grades (report_card_id, subject, marks_obtained) VALUES (?, 'Science', 82)", [rid], () => r()));
                await new Promise(r => db.query("INSERT IGNORE INTO subject_grades (report_card_id, subject, marks_obtained) VALUES (?, 'Social Studies', 74)", [rid], () => r()));
                await new Promise(r => db.query("INSERT IGNORE INTO subject_grades (report_card_id, subject, marks_obtained) VALUES (?, 'Hindi', 85)", [rid], () => r()));
            }
        });

        // Dummy Bus Route
        await new Promise(r => db.query("INSERT IGNORE INTO bus_routes (route_number, route_name, bus_plate, driver_name, driver_contact, status) VALUES ('7', 'Whitefield', 'MH12 AB 4231', 'Ravi Kumar', '98xxxx7821', 'En route')", () => r()));
        
        db.query("SELECT id FROM bus_routes WHERE route_number = '7'", async (err, res3) => {
            if (!err && res3.length > 0) {
                const brid = res3[0].id;
                await new Promise(r => db.query("INSERT IGNORE INTO bus_stops (route_id, stop_name, eta_time, status, stop_order) VALUES (?, 'Varthur Gate', '7:15 AM', 'Done', 1)", [brid], () => r()));
                await new Promise(r => db.query("INSERT IGNORE INTO bus_stops (route_id, stop_name, eta_time, status, stop_order) VALUES (?, 'Marathahalli', '7:28 AM', 'Done', 2)", [brid], () => r()));
                await new Promise(r => db.query("INSERT IGNORE INTO bus_stops (route_id, stop_name, eta_time, status, stop_order) VALUES (?, 'Whitefield Signal', '7:38 AM', 'Next', 3)", [brid], () => r()));
                await new Promise(r => db.query("INSERT IGNORE INTO bus_stops (route_id, stop_name, eta_time, status, stop_order) VALUES (?, 'Hoodi Junction', 'Pending', 'Pending', 4)", [brid], () => r()));
                await new Promise(r => db.query("INSERT IGNORE INTO bus_stops (route_id, stop_name, eta_time, status, stop_order) VALUES (?, 'Greenfield Academy', 'Pending', 'Pending', 5)", [brid], () => r()));
                
                // Dummy Timetable
                await new Promise(r => db.query("INSERT IGNORE INTO teacher_timetable (teacher_id, day_of_week, period_number, time_slot, subject, class_group) VALUES (1, 'Monday', 1, '08:30 AM', 'Mathematics', '6-A')", () => r()));
                await new Promise(r => db.query("INSERT IGNORE INTO teacher_timetable (teacher_id, day_of_week, period_number, time_slot, subject, class_group) VALUES (1, 'Monday', 2, '09:30 AM', 'Science', '7-B')", () => r()));
                
                // Dummy Salary
                await new Promise(r => db.query("INSERT IGNORE INTO teacher_salary (teacher_id, month, basic_pay, allowances, deductions, net_salary, status, date_paid) VALUES (1, 'April 2026', 45000, 5000, 2000, 48000, 'Paid', '2026-04-01')", () => r()));

                console.log("Dummy data inserted successfully.");
                process.exit(0);
            }
        });

      }
    });

  } catch (err) {
    console.error("Error inserting dummy data", err);
    process.exit(1);
  }
}

runQueries();
