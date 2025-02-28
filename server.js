const express = require("express");
const connectDB = require("./config/db");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(cors({
    origin: ["https://harmonious-pixie-d4b92d.netlify.app"], // Allow only your frontend
    methods: "GET,POST,PUT,DELETE",
}));

// Routes
const checkMarksRoutes = require("./routes/checkMarks");
app.use("/api/check-marks", checkMarksRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
