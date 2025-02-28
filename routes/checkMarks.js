const express = require("express");
const router = express.Router();
const { checkMarks } = require("../controllers/marksController");

router.post("/", checkMarks);

module.exports = router;
