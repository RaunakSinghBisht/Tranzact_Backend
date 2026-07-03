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

/**
 * @route GET /api/transactions/history/:accountId
 * @desc Get all transaction history
 */
router.get('/history/:accountId', authMiddleware.verifyToken, transactionController.getAllTransactions);

/**
 * @route GET /api/transactions/historyPDF
 * @desc Sends a Transaction History PDF
 */
router.post('/historyPDF', authMiddleware.verifyToken, transactionController.downloadTransactionPDF);

/**
 * @route GET /api/transactions/systemDepositHistory/:accountId
 * @desc Get all system deposit history
 */
router.get('/systemDepositHistory/:accountId', authMiddleware.isSystemUser, transactionController.getAllTransactions);


module.exports = router;