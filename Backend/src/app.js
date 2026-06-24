const express = require('express');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth.route')
const accountRoutes = require('./routes/account.route')
const transactionRoutes = require('./routes/transaction.route')


const app = express();
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/accounts', accountRoutes)
app.use('/api/transactions', transactionRoutes)

module.exports = app;