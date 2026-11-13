const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { hashPassword, verifyPassword, signToken } = require("../utils/auth");
const { protect } = require("../middleware/auth");
const loginLimiter = require("../middleware/rateLimit");

const limiter = loginLimiter();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const publicUser = (u) => ({
    id: u._id,
    name: u.name,
    email: u.email,
    role: u.role,
    department: u.department
});

// POST /api/auth/register  (students sign up freely; coordinators need the secret code)
router.post("/register", async (req, res) => {
    try {
        const { name, email, password, role, department, coordinatorCode } = req.body || {};

        if (!name || !email || !password) {
            return res.status(400).json({ message: "Name, email and password are required." });
        }
        if (!EMAIL_RE.test(email)) {
            return res.status(400).json({ message: "Please enter a valid email address." });
        }
        if (String(password).length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters." });
        }

        const finalRole = role === "coordinator" ? "coordinator" : "student";
        if (finalRole === "coordinator" && coordinatorCode !== process.env.COORDINATOR_CODE) {
            return res.status(403).json({ message: "Invalid coordinator access code." });
        }

        const exists = await User.findOne({ email: email.toLowerCase() });
        if (exists) {
            return res.status(409).json({ message: "An account with this email already exists." });
        }

        const user = await User.create({
            name,
            email,
            department,
            role: finalRole,
            passwordHash: hashPassword(String(password))
        });

        res.status(201).json({ token: signToken({ id: user._id, role: user.role }), user: publicUser(user) });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body || {};
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required." });
        }

        const key = `${req.ip}:${String(email).toLowerCase()}`;
        if (!limiter.check(key)) {
            return res.status(429).json({ message: "Too many failed attempts. Try again in 15 minutes." });
        }

        const user = await User.findOne({ email: String(email).toLowerCase() });
        if (!user || !verifyPassword(String(password), user.passwordHash)) {
            limiter.fail(key);
            return res.status(401).json({ message: "Invalid email or password." });
        }

        limiter.reset(key);
        res.json({ token: signToken({ id: user._id, role: user.role }), user: publicUser(user) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET /api/auth/me  (used by the frontend to restore a session)
router.get("/me", protect, (req, res) => {
    res.json({ user: publicUser(req.user) });
});

module.exports = router;
