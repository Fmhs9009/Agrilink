const Express = require("express");
const router = Express.Router();

const { verifyToken, isFarmer, isBuyer, isAdmin } = require("../Middleware/auth");
const { sendOTP, Signup, Login, changePassword, verifyotp, updateProfile, getUserById, requestPasswordReset, resetPassword } = require("../Controller/Auth");

// Authentication routes
router.post("/login", Login);
router.post("/sendOTP", sendOTP);
router.post("/signup", Signup);

// Password reset routes
router.post("/password/reset-request", requestPasswordReset);
router.post("/password/reset", resetPassword);

// Protected routes (require authentication)
router.post("/changePassword", verifyToken, changePassword);
router.post("/verifyotp", verifyotp);
router.post("/updateProfile", verifyToken, updateProfile);

// Authorization check routes
router.post("/authenticate", verifyToken, (req, res) => {
    res.json({ success: true, message: "Authenticated" });
});

router.post("/verifycustomer", verifyToken, isBuyer, (req, res) => {
    res.json({ success: true, message: "Customer authorized" });
});

router.post("/verifyfarmer", verifyToken, isFarmer, (req, res) => {
    res.json({ success: true, message: "Farmer authorized" });
});

// Get user by ID
router.get("/user/:id", getUserById);

module.exports = router;

