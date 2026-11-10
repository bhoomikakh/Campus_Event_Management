
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dns = require("dns");

require("dotenv").config();

// MongoDB DNS configuration
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Home route
app.get("/", (req, res) => {
    res.send("Campus Event Management Backend is Running!");
});

// Connect Event Routes
const eventRoutes = require("./routes/eventRoutes");

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
    });
