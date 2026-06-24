const express = require('express')
const authMiddleware = require('../middlewares/auth.middleware')
const accountController = require('../controllers/account.controller')

const router = express.Router()

/** 
 * @route POST /api/accounts/
 * @desc Create a new account
 */
router.post('/', authMiddleware.verifyToken, accountController.createAccount)

/** 
 * @route GET /api/accounts/
 * @desc Get all accounts for the authenticated user
 */
router.get('/', authMiddleware.verifyToken, accountController.getAllAccounts)

/** 
 * @route GET /api/accounts/balance
 * @desc Get account balance
 */
router.get('/balance/:accountId', authMiddleware.verifyToken, accountController.getAccountBalance)


module.exports = router