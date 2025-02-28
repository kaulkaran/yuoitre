const mongoose = require("mongoose");

const linkSchema = new mongoose.Schema({
  url: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Link", linkSchema);
