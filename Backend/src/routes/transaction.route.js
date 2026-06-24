const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const transactionController = require('../controllers/transaction.controller')

const router = express.Router()

/**
 * @route POST /api/transactions
 * @desc Create a new transaction
 */
router.post('/', authMiddleware.verifyToken, transactionController.createTransaction);

/**
 * @route POST /api/transactions/cashDeposit
 * @desc Create a new cash deposit transaction
 */
router.post('/cashDeposit', authMiddleware.isSystemUser, transactionController.cashDepositController);


module.exports = router;