const { createGroupChat, renameGroupChat, accessChat, fetchChats, addToGroup, removeFromGroup } = require("../controllers/chatController");
const { protect } = require("../middleware/auth");

const router = require("express").Router();

router.post("/group", protect, createGroupChat);
router.put("/rename", protect, renameGroupChat);
router.post("/", protect, accessChat);
router.get("/", protect, fetchChats);
router.put("/add-to-group", protect, addToGroup);
router.put("/remove-from-group", protect, removeFromGroup);

module.exports = router;