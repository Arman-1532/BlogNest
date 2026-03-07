const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const postRoutes = require('./routes/post.routes');
const commentRoutes = require('./routes/comment.routes');
const reactionRoutes = require('./routes/reaction.routes');
const notificationRoutes = require('./routes/notification.routes');
const groupRoutes = require('./routes/group.routes');
const errorHandler = require('./middlewares/error.middleware');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// View routes
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'views', 'login.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'views', 'login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'views', 'register.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'views', 'dashboard.html')));
app.get('/post/:slug', (req, res) => res.sendFile(path.join(__dirname, 'views', 'post.html')));
app.get('/profile/:username', (req, res) => res.sendFile(path.join(__dirname, 'views', 'profile.html')));
app.get('/groups/:id', (req, res) => res.sendFile(path.join(__dirname, 'views', 'group.html')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/reactions', reactionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/groups', groupRoutes);

// Error handler
app.use(errorHandler);

module.exports = app;

