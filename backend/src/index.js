// Główny plik uruchomieniowy backendu
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');

const connectMongoDB = require('./config/mongo');
const { setWalMode } = require('./config/sqlite');

// Import modeli, aby Sequelize zarejestrował definicje przed sync()
require('./models/Report');

const authRoutes = require('./routes/authRoutes');
const dataRoutes = require('./routes/dataRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware globalne
app.use(cors());
app.use(express.json());

// Prosty endpoint kontrolny
app.get('/health', (req, res) => {
  res.status(200).json({ message: 'Serwer działa poprawnie' });
});

// Podłączenie routerów aplikacji
app.use('/api/auth', authRoutes);
app.use('/api/data', dataRoutes);

/**
 * Inicjalizuje połączenia z bazami danych.
 * Najpierw łączy MongoDB, następnie SQLite i synchronizuje tabele Sequelize.
 */
const initializeDatabases = async () => {
  try {
    await connectMongoDB();
    // Ustawienia SQLite (WAL)
    await setWalMode();
    console.log('Bazy danych zostały poprawnie zainicjalizowane');
  } catch (error) {
    console.error('Błąd podczas inicjalizacji baz danych:', error.message || error);
    throw error;
  }
};

/**
 * Uruchamia serwer po poprawnej inicjalizacji baz danych.
 */
const startServer = async () => {
  try {
    await initializeDatabases();

    app.listen(PORT, () => {
      console.log(`Serwer backendu działa na porcie ${PORT}`);
    });
  } catch (error) {
    console.error('Nie udało się uruchomić aplikacji:', error.message || error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
