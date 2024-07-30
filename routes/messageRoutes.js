const express = require("express");
const { protect } = require("../middleware/auth");
const { sendMessage, allMessages } = require("../controllers/messageController");

const router = express.Router();

router.post("/", protect, sendMessage);
router.get("/:chatId", protect, allMessages)

module.exports = router;