const accountModel = require("../models/account.model");

const createAccount = async (req, res) => {
  try {
    const { currency } = req.body;

    const account = await accountModel.create({
      user: req.user._id,
      currency,
    });

    res.status(201).json({
      message: "Account created successfully",
      account,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllAccounts = async (req, res) => {
  try {
    const accounts = await accountModel.find({ user: req.user._id });
    res.status(200).json({
      message: "Accounts retrieved successfully",
      accounts,
    });
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};

const getAccountBalance = async (req, res) => {
  const accountId = req.params.accountId;

  const account = await accountModel.findById(accountId);

  if (!account) {
    return res.status(404).json({ message: "Account not found" });
  }
  if (req.user._id.toString() !== account.user.toString()) {
    return res
      .status(403)
      .json({ message: "You are not authorized to view this account" });
  }

  let balance = await account.getBalance();
  return res
    .status(200)
    .json({ message: "Account balance retrieved successfully :", balance });
};


module.exports = { createAccount, getAccountBalance, getAllAccounts };