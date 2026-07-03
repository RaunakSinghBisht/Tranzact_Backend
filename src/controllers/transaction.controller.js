const mongoose = require("mongoose");
const transactionModel = require("../models/transaction.model");
const accountModel = require("../models/account.model");
const ledgerModel = require("../models/ledger.model");
const emailService = require("../services/email.service");

const createTransaction = async (req, res) => {
  /**
   * THE 10-STEP TRANSFER FLOW :-
   * 1. Validate request
   * 2. Validate idempotency key
   * 3. Check account status
   * 4. Derive sender balance from ledger
   * 5. Create transaction (PENDING)
   * 6. Create DEBIT ledger entry
   * 7. Create CREDIT ledger entry
   * 8. Mark transaction COMPLETED
   * 9. Commit MongoDB session
   * 10. Send email notification
   */

  // 1. Validate request
  const { senderAccountId, receiverAccountId, amount, idempotencyKey } =
    req.body;

  if (!senderAccountId || !receiverAccountId || !amount || !idempotencyKey) {
    return res.status(400).json({
      message:
        "Sender account ID, receiver account ID, amount, and idempotency key are required.",
    });
  }

  const senderAccount = await accountModel.findById(senderAccountId);
  const receiverAccount = await accountModel.findById(receiverAccountId);

  if (!senderAccount || !receiverAccount) {
    return res
      .status(404)
      .json({ message: "Sender or receiver account not found." });
  }

  if (senderAccount.user.toString() !== req.user.id) {
    return res
      .status(403)
      .json({ message: "You are not authorized to perform this transaction." });
  }

  // 2. Validate idempotency key
  const doesTransactionAlreadyExist = await transactionModel.findOne({
    idempotencyKey,
  });

  if (doesTransactionAlreadyExist) {
    if (doesTransactionAlreadyExist.status === "COMPLETED") {
      return res.status(200).json({
        message: "Transaction already completed.",
        transaction: doesTransactionAlreadyExist,
      });
    }
    if (doesTransactionAlreadyExist.status === "PENDING") {
      return res
        .status(200)
        .json({ message: "Transaction is still processing." });
    }
    if (doesTransactionAlreadyExist.status === "FAILED") {
      return res
        .status(500)
        .json({ message: "Transaction has been failed. Try Again." });
    }
    if (doesTransactionAlreadyExist.status === "REVERSED") {
      return res
        .status(500)
        .json({ message: "Transaction has been reversed. Try Again." });
    }
  }

  // 3. Check account status
  if (
    senderAccount.status !== "ACTIVE" ||
    receiverAccount.status !== "ACTIVE"
  ) {
    await emailService.sendTransactionFailureEmail(
      req.user.email,
      req.user.name,
      amount,
      senderAccount._id,
      receiverAccount._id,
      "One or both accounts are not active",
    );
    return res.status(400).json({ message: "Both accounts must be ACTIVE..." });
  }

  // 4. Derive sender balance from ledger
  const senderBalance = await senderAccount.getBalance();
  if (senderBalance < amount) {
    await emailService.sendTransactionFailureEmail(
      req.user.email,
      req.user.name,
      amount,
      senderAccount._id,
      receiverAccount._id,
      "Insufficient balance in your account",
    );
    return res
      .status(400)
      .json({ message: "Insufficient balance in sender's account." });
  }

  // 5. Create transaction (PENDING)
  let session;
  let transaction;

  try {
    transaction = await transactionModel.create({
      fromAccount: senderAccountId,
      toAccount: receiverAccountId,
      amount,
      idempotencyKey,
      status: "PENDING",
    });

    session = await mongoose.startSession(); // all DB operations in a session's transaction will either all succeed or all fail
    session.startTransaction();

    // 6. Create DEBIT ledger entry
    const debitLedgerEntry = await ledgerModel.create(
      [
        {
          account: senderAccountId,
          transaction: transaction._id,
          amount,
          type: "DEBIT",
        },
      ],
      { session },
    );

    // 7. Create CREDIT ledger entry
    const creditLedgerEntry = await ledgerModel.create(
      [
        {
          account: receiverAccountId,
          transaction: transaction._id,
          amount,
          type: "CREDIT",
        },
      ],
      { session },
    );

    // 8. Mark transaction COMPLETED
    await transactionModel.findOneAndUpdate(
      { _id: transaction._id },
      { status: "COMPLETED" },
      { session },
    );

    transaction.status = "COMPLETED"; // Update the status in saved transaction object

    // 9. End MongoDB session
    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      message: "Transaction completed successfully.",
      transaction,
    });

    //10. Send email notification
    await emailService.sendTransactionEmail(
      req.user.email,
      req.user.name,
      amount,
      senderAccount._id,
      receiverAccount._id,
    );

    return;
  } catch (err) {
    if (transaction) { // if error occurs before transaction creation, it will not run
      await transactionModel.findOneAndUpdate(
        { _id: transaction._id },
        { status: "FAILED" },
      );
    }
    if (session) {
      await session.abortTransaction();
      session.endSession();
    }

    res
      .status(500)
      .json({ message: "Transaction failed.", error: err.message });

    await emailService.sendTransactionFailureEmail(
      req.user.email,
      req.user.name,
      amount,
      senderAccount._id,
      receiverAccount._id,
      "An unexpected error occurred during processing",
    );

    return;
  }
};

const cashDepositController = async (req, res) => {
  const { toAccount, amount, idempotencyKey } = req.body;

  if (!toAccount || !amount || !idempotencyKey) {
    return res.status(400).json({
      message:
        "Account ID, amount, and idempotency key are required for cash deposit.",
    });
  }

  const toUserAccount = await accountModel.findById(toAccount);
  if (!toUserAccount) {
    return res.status(404).json({ message: "Receiver account not found." });
  }

  const fromUserAccount = await accountModel.findOne({
    user: req.user._id,
  });
  if (!fromUserAccount) {
    return res.status(404).json({ message: "System account not found." });
  }

  let session;
  try {
    session = await mongoose.startSession();
    session.startTransaction();

    const transaction = await transactionModel.create(
      [
        {
          fromAccount: fromUserAccount._id,
          toAccount: toUserAccount._id,
          amount,
          idempotencyKey,
          status: "PENDING",
        },
      ],
      { session },
    )[0];

    const debitLedgerEntry = await ledgerModel.create(
      [
        {
          account: fromUserAccount._id,
          transaction: transaction._id,
          amount,
          type: "DEBIT",
        },
      ],
      { session },
    );

    const creditLedgerEntry = await ledgerModel.create(
      [
        {
          account: toUserAccount._id,
          transaction: transaction._id,
          amount,
          type: "CREDIT",
        },
      ],
      { session },
    );

    await transactionModel.findOneAndUpdate(
      { _id: transaction._id },
      { status: "COMPLETED" },
      { session },
    );

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      message: "Cash deposit completed successfully.",
      transaction,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    return res.status(500).json({ message: "Cash deposit failed." });
  }
};
const getAllTransactions = async (req, res) => {
  try {
    const accountId = req.params.accountId;

    const account = await accountModel.findById(accountId);
    if (!account) {
      return res.status(404).json({ message: "Account not found." });
    }

    const userId = req.user._id ? req.user._id.toString() : req.user.id;
    if (account.user.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "You are not authorized to view transactions for this account." });
    }

    const transactions = await transactionModel.find({
      $or: [{ fromAccount: accountId }, { toAccount: accountId }]
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Transactions retrieved successfully.",
      transactions,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to retrieve transactions.",
      error: error.message,
    });
  }
};

module.exports = { createTransaction, cashDepositController, getAllTransactions };
