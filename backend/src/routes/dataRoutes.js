// Router danych integracyjnych i preferencji użytkownika
const express = require('express');
const dataController = require('../controllers/dataController');
const authMiddleware = require('../middlewares/auth');

const router = express.Router();

// Bezpieczny endpoint analizy danych
router.get('/analyze', authMiddleware, dataController.analyzeData);

// Eksport raportów do XML
router.get('/export', authMiddleware, dataController.exportData);

// Pobranie preferencji użytkownika z MongoDB
router.get('/preferences', authMiddleware, dataController.getPreferences);

// Aktualizacja preferencji użytkownika w MongoDB
router.put('/preferences', authMiddleware, dataController.updatePreferences);

module.exports = router;
