const { registerUser, loginUser, allUsers } = require("../controllers/userController");
const { protect } = require("../middleware/auth");

const router = require("express").Router();

router.post("/register", registerUser);
router.post("/login", loginUser)
router.get("/", protect , allUsers);

module.exports = router;