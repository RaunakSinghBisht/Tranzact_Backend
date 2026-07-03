const express = require('express');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth.route')
const accountRoutes = require('./routes/account.route')
const transactionRoutes = require('./routes/transaction.route')


const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: "https://tranzact-six.vercel.app", // only this site can call your backend API
  credentials: true
}));

// Routes
app.get('/', (req, res)=>{res.send("Server is Running...")}) // Health Check API
app.use('/api/auth', authRoutes)
app.use('/api/accounts', accountRoutes)
app.use('/api/transactions', transactionRoutes)

module.exports = app;