const express = require('express');
const app = express();
const cors = require('cors'); // Import the CORS middleware

app.use(express.json());

// Import Routers
const authRoutes = require('./modules/auth/auth.routes');
const usersRoutes = require('./modules/users/users.routes');
const attendanceRoutes = require('./modules/attendance/attendance.routes');
const adminAttendanceRoutes = require('./modules/attendance/admin.attendance.routes');
const leavesRoutes = require('./modules/leaves/leaves.routes'); // NEW IMPORT


// Define API Routes
app.use(cors({
  origin: 'http://192.168.1.17:5173', // or your frontend's actual URL
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use('/api/auth', authRoutes);
app.use('/api', usersRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/admin/attendance', adminAttendanceRoutes); // <-- Corrected path for admin attendance routes
app.use('/api/leave', leavesRoutes); // NEW ROUTE MOUNT



module.exports = app;