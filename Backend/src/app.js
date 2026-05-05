const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.get('/', (req, res) => {
  res.send('Backend running');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

const authRoutes = require('./routes/AuthRoutes');
const profileRoutes = require('./routes/profileRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const homeworkRoutes = require('./routes/homeworkRoutes');
const messageRoutes = require('./routes/messageRoutes');
const feeRoutes = require('./routes/feeRoutes');
const eventRoutes = require('./routes/eventRoutes');
const reportRoutes = require('./routes/reportRoutes');
const busRoutes = require('./routes/busRoutes');
const billingRoutes = require('./routes/billingRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const booksRoutes = require('./routes/booksRoutes');
const adminConfigRoutes = require('./routes/adminConfigRoutes');

// Import new controllers
const authMiddleware = require('./middlewares/authMiddleware');
const paymentController = require('./controllers/PaymentController');
const uniformController = require('./controllers/UniformController');
const salaryController = require('./controllers/SalaryController');
const timetableController = require('./controllers/TimetableController');

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/homework', homeworkRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/buses', busRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/books', booksRoutes);
app.use('/api/admin', adminConfigRoutes);

// Register new routes
app.post('/api/payments/pay', authMiddleware, paymentController.processPayment);
app.get('/api/payments/all', authMiddleware, paymentController.getAllPayments);
app.get('/api/payments', authMiddleware, paymentController.getPayments);
app.post('/api/uniform', authMiddleware, uniformController.submitMeasurement);
app.get('/api/uniform', authMiddleware, uniformController.getMeasurements);
app.put('/api/uniform/:id', authMiddleware, uniformController.updateMeasurementStatus);
app.get('/api/salary', authMiddleware, salaryController.getSalary);
app.get('/api/timetable', authMiddleware, timetableController.getTimetable);