const mongoose = require("mongoose");

const tokenBlacklistSchema = new mongoose.Schema({
    token: {
        type: String,
        required: [true, "Token is required"]
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 5 * 24 * 60 * 60  // 5 days in seconds
    }
})

const tokenBlacklistModel = mongoose.model("tokenBlacklist", tokenBlacklistSchema);


module.exports = tokenBlacklistModel;