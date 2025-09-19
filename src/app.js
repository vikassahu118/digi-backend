const express = require('express');
const app = express();
const cors = require('cors');

app.use(express.json());

// Import Routers
const authRoutes = require('./modules/auth/auth.routes');
const usersRoutes = require('./modules/users/users.routes');
const attendanceRoutes = require('./modules/attendance/attendance.routes');
const adminAttendanceRoutes = require('./modules/attendance/admin.attendance.routes');
const leavesRoutes = require('./modules/leaves/leaves.routes');
const tasksRoutes = require('./modules/tasks/tasks.routes');


// Define CORS settings
app.use(cors({
    origin: ['http://localhost:5173', 'http://192.168.1.8:5173', 'http://192.168.1.10:5173', 'http://192.168.1.13:5173', 'http://192.168.1.5:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials:true
}));

// Mount API Routers
app.use('/api/auth', authRoutes);
app.use('/api', usersRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/admin/attendance', adminAttendanceRoutes);
// Mount leavesRoutes to a single, clear base path.
// Employee routes will be relative to /api/leaves
// Admin routes will be relative to /api/leaves
app.use('/api/leaves', leavesRoutes); 
app.use('/api/tasks', tasksRoutes);
app.use('/uploads', express.static('uploads'));


module.exports = app;
