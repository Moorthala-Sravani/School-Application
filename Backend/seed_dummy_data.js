const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'myapp'
});

db.connect(async (err) => {
  if (err) throw err;
  console.log('MySQL Connected for seeding...');

  try {
    // Helper function to execute queries with promises
    const query = (sql, values) => {
      return new Promise((resolve, reject) => {
        db.query(sql, values, (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });
    };

    // 1. Seed Events
    await query('DELETE FROM events');
    await query(`
      INSERT INTO events (title, date, description, type) VALUES
      ('Science Fair', '2026-05-15', 'Annual school science fair', 'Event'),
      ('Parent Teacher Meeting', '2026-05-20', 'Discuss student progress', 'School'),
      ('Summer Break Starts', '2026-06-01', 'School closed for summer holidays', 'Holiday')
    `);
    console.log('Events seeded.');

    // 2. Seed Bus Routes and Stops
    await query('DELETE FROM bus_stops');
    await query('DELETE FROM bus_routes');
    await query(`
      INSERT INTO bus_routes (id, route_number, route_name, driver_name, driver_contact, bus_plate, status) VALUES
      (1, '42', 'Downtown', 'John Smith', '555-0102', 'BUS-402', 'Live')
    `);
    await query(`
      INSERT INTO bus_stops (route_id, stop_name, eta_time, status, stop_order) VALUES
      (1, 'Central Station', '07:30 AM', 'Done', 1),
      (1, 'Oak Avenue', '07:45 AM', 'Next', 2),
      (1, 'Pine Street', '08:00 AM', 'Pending', 3),
      (1, 'School Campus', '08:15 AM', 'Pending', 4)
    `);
    console.log('Bus routes seeded.');

    // 3. Seed Report Cards
    await query('DELETE FROM subject_grades');
    await query('DELETE FROM report_cards');
    // Assuming parent id=1, child_class='1-A', let's use user_id=1 for demo parent
    await query(`
      INSERT INTO report_cards (id, student_id, term, percentage, grade, top_percentile, working_days, present_days) VALUES
      (1, '1', 'Mid Term Examination 2026', 85.00, 'A', '90th', 100, 95)
    `);
    await query(`
      INSERT INTO subject_grades (report_card_id, subject, marks_obtained, max_marks) VALUES
      (1, 'Mathematics', 90, 100),
      (1, 'Science', 85, 100),
      (1, 'English', 88, 100),
      (1, 'Social Studies', 82, 100),
      (1, 'Language', 80, 100)
    `);
    console.log('Report cards seeded.');

    // 4. Seed Teacher Salary
    await query('DELETE FROM teacher_salary');
    // For teacher user id = 2 (assume 2 is teacher in db)
    await query(`
      INSERT INTO teacher_salary (teacher_id, month, year, basic_pay, hra, special_allowance, provident_fund, income_tax, status) VALUES
      ('2', 'April', '2026', 45000, 15000, 5000, 4500, 3200, 'Credited')
    `);
    console.log('Teacher salary seeded.');

    // 5. Seed Teacher Timetable
    await query('DELETE FROM teacher_timetable');
    await query(`
      INSERT INTO teacher_timetable (teacher_id, day_of_week, period_number, start_time, end_time, subject, class_section, room, is_break) VALUES
      ('2', 'Mon', 1, '08:30', '09:15', 'Mathematics', '6-A', 'Room 101', false),
      ('2', 'Mon', 2, '09:15', '10:00', 'Mathematics', '7-B', 'Room 102', false),
      ('2', 'Mon', NULL, '10:00', '10:15', NULL, NULL, NULL, true),
      ('2', 'Mon', 3, '10:15', '11:00', 'Preparation', 'Free Period', 'Staff Room', false),
      ('2', 'Mon', 4, '11:00', '11:45', 'Mathematics', '8-A', 'Room 205', false),
      ('2', 'Mon', NULL, '11:45', '12:30', 'Lunch', NULL, NULL, true),
      ('2', 'Mon', 5, '12:30', '01:15', 'Mathematics', '6-B', 'Room 104', false)
    `);
    console.log('Teacher timetable seeded.');

    console.log('All dummy data seeded successfully!');
  } catch (err) {
    console.error('Seeding failed:', err);
  } finally {
    db.end();
  }
});
