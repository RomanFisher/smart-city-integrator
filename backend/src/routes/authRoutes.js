// Router autoryzacji użytkownika
const express = require('express');
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/auth');

const router = express.Router();

// Rejestracja nowego użytkownika
router.post('/register', authController.register);

// Logowanie użytkownika
router.post('/login', authController.login);

// Aktualizacja użytkownika w MongoDB
router.put('/user/:id', authMiddleware, authController.updateUser);

// Usuwanie użytkownika z MongoDB
router.delete('/user/:id', authMiddleware, authController.deleteUser);

module.exports = router;
