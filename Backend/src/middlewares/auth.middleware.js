const userModel = require('../models/user.model');
const tokenBlacklistModel = require('../models/tokenBlacklist.model');
const jwt = require('jsonwebtoken');

const verifyToken = async (req, res, next) => {
    try {
        // 1. Check if token exists in cookies
        const token = req.cookies?.token || req.headers?.authorization?.split(" ")[1];
        if (!token) {
            return res.status(401).json({ message: "Unauthorized - No token provided" });
        }

        // 2. Verify token & attach decoded payload to req.user
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const isBlacklisted = await tokenBlacklistModel.findOne({ token });
        if (isBlacklisted) {
            return res.status(401).json({ message: "Unauthorized - Token is blacklisted" });
        }

        req.user = await userModel.findById(decoded.id)
        
        next();
    } catch (error) {
        return res.status(401).json({ message: "Unauthorized - Invalid token" });
    }
};

const isSystemUser = async (req, res, next) => {
    try {
        const token = req.cookies?.token || req.headers?.authorization?.split(" ")[1];
        if (!token) {
            return res.status(401).json({ message: "Unauthorized - No token provided" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await userModel.findById(decoded.id).select('+isSystemUser');

        if(!req.user.isSystemUser) {
            return res.status(403).json({ message: "Forbidden - User is not a system user" });
        }

        next();
    } catch (error) {
        return res.status(401).json({ message: "Unauthorized - Invalid token" });
    }
}


module.exports = { verifyToken, isSystemUser };