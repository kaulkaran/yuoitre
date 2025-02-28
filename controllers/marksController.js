const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const Question = require("../models/Question");
const fs = require("fs"); // For debugging
const Link = require("../models/Links"); // Import the Link model


const checkMarks = async (req, res) => {
  try {
    const { link } = req.body;
    if (!link) {
      return res.status(400).json({ error: "Link is required" });
    }

    let existingLink = await Link.findOne({ url: link });
    if (!existingLink) {
      existingLink = new Link({ url: link });
      await existingLink.save();
      console.log("🔹 Link saved to database:", link);
    } else {
      console.log("🔹 Link already exists in database:", link);
    }

    // 1️⃣ Launch Puppeteer and Load Page
    const browser = await puppeteer.launch({ headless: false }); // Keep browser visible for debugging
    const page = await browser.newPage();
    await page.goto(link, { waitUntil: "networkidle2" });

    // 2️⃣ Get Rendered HTML
    const html = await page.content();
    await browser.close();

    // Save HTML to a file for debugging
    fs.writeFileSync("debug_page.html", html);
    console.log("🔹 Saved page content to debug_page.html");

    // 3️⃣ Load HTML with Cheerio
    const $ = cheerio.load(html);
    const userAnswers = {};

    // 4️⃣ Extract Questions
    $("div, p, span").each((_, el) => { // Searching through multiple tags
      const text = $(el).text().trim();

      // Extract Question ID (e.g., "Question ID: 1422769525")
      const questionIdMatch = text.match(/Question ID\s*:\s*(\d+)/i);
      const questionId = questionIdMatch ? questionIdMatch[1] : null;

      // Extract Chosen Option (e.g., "Chosen Option: D")
      const chosenOptionMatch = text.match(/Chosen Option\s*:\s*([A-Za-z])/i);
      const chosenOption = chosenOptionMatch ? chosenOptionMatch[1].toLowerCase() : null; // Convert to lowercase

      if (questionId && chosenOption) {
        userAnswers[questionId] = chosenOption;
      }
    });

    console.log("🔹 Extracted user answers:", userAnswers);

    // If no answers were extracted, something is wrong with the parsing
    if (Object.keys(userAnswers).length === 0) {
      return res.status(500).json({ error: "Failed to extract user answers. Check HTML structure." });
    }

    // 5️⃣ Fetch Correct Answers from Database
    const questionIds = Object.keys(userAnswers);
    console.log("🔹 Checking database for question IDs:", questionIds);

    const questions = await Question.find({ questionId: { $in: questionIds } });
    console.log("🔹 Fetched questions from DB:", questions);

    let score = 0;
    const resultDetails = [];

    // 6️⃣ Compare User Answers with Correct Answers
    questions.forEach((q) => {
      const userAnswer = userAnswers[q.questionId] || "not answered"; // Default if not found
      const correctAnswers = q.correctAnswer.map((ans) => ans.toLowerCase()); // Convert DB answers to lowercase

      const isCorrect = userAnswer !== "not answered" && correctAnswers.includes(userAnswer);
      if (isCorrect) score++;

      resultDetails.push({
        questionId: q.questionId,
        userAnswer,
        correctAnswer: q.correctAnswer,
        isCorrect,
      });
    });

    return res.json({
      score,
      total: questions.length,
      link: link, // Include the submitted link in the response
      resultDetails,
    });
  } catch (error) {
    console.error("❌ Error in checkMarks:", error);
    return res.status(500).json({ error: error.message });
  }
};

module.exports = { checkMarks };
