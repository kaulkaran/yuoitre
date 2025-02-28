const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema({
  questionId: {
    type: String,
    required: true,
    unique: true,
  },
  type: {
    type: String,
    default: "MCQ",
  },
  correctAnswer: {
    type: [String],
    required: true,
  },
});

module.exports = mongoose.model("Question", QuestionSchema);
