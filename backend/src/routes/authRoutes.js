// Router autoryzacji użytkownika
const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

// Rejestracja nowego użytkownika
router.post('/register', authController.register);

// Logowanie użytkownika
router.post('/login', authController.login);

module.exports = router;
