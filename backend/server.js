
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dns = require("dns");

require("dotenv").config();

// MongoDB DNS configuration
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const app = express();

// Needed on cloud hosts (Render, etc.) so req.ip is the real client IP
app.set("trust proxy", 1);

// Middleware
// CORS_ORIGIN = your frontend URL(s), comma separated. If unset, all origins are allowed (fine for local dev).
app.use(cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim()) : true
}));
app.use(express.json({ limit: "100kb" }));

// Make sure the security settings exist before starting
if (!process.env.JWT_SECRET || !process.env.COORDINATOR_CODE) {
    console.error("Missing JWT_SECRET or COORDINATOR_CODE in backend/.env (see .env.example)");
    process.exit(1);
}

// Home route
app.get("/", (req, res) => {
    res.send("Campus Event Management Backend is Running!");
});

// Connect Event Routes
const authRoutes = require("./routes/authRoutes");
const eventRoutes = require("./routes/eventRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);

// Connect MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log("MongoDB Connected Successfully!");

        const PORT = process.env.PORT || 5000;

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.log("MongoDB Connection Error:", error.message);
        process.exit(1); // let the host show a clear failure instead of a silent dead server
    });
