const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  refreshUserToken,
  logoutUser,
  getUserProfile,
  registerSchema,
  loginSchema,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');

router.post('/register', validate(registerSchema), registerUser);
router.post('/login', validate(loginSchema), loginUser);
router.post('/refresh', refreshUserToken);
router.post('/logout', logoutUser);
router.get('/profile', protect, getUserProfile);

module.exports = router;
