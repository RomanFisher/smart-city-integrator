// Konfiguracja połączenia z MongoDB przy użyciu Mongoose
// Plik zawiera funkcję inicjalizującą połączenie oraz obsługę zdarzeń i zamykanie połączenia.
const mongoose = require('mongoose');

// Domyślne opcje połączenia (Usunięto nieobsługiwane już useNewUrlParser i useUnifiedTopology)
const defaultOptions = {
  // Timeouty i preferencje sieciowe
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 10000,
  // Wymuszenie IPv4 w niektórych środowiskach
  family: 4,
};

/**
 * connectMongoDB - inicjalizuje połączenie z MongoDB
 * @param {Object} [opts] - dodatkowe opcje przekazywane do mongoose.connect
 * @returns {Promise<mongoose.Connection>} - promise rozwiązujący się po połączeniu
 */
const connectMongoDB = async (opts = {}) => {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/smart-city-users';
  const options = Object.assign({}, defaultOptions, opts);

  let attempts = 0;
  const maxAttempts = 5;

  // Funkcja pomocnicza do opóźnienia (sleep)
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  while (attempts < maxAttempts) {
    try {
      attempts += 1;
      await mongoose.connect(uri, options);
      console.log('MongoDB: połączenie ustanowione (attempt:', attempts, ')');

      // Rejestracja prostych listenerów diagnostycznych
      mongoose.connection.on('connected', () => {
        console.log('MongoDB: connected');
      });
      mongoose.connection.on('error', (err) => {
        console.error('MongoDB: error', err);
      });
      mongoose.connection.on('disconnected', () => {
        console.warn('MongoDB: disconnected');
      });

      // Graceful shutdown: zamknięcie połączenia przy SIGINT (ctrl+c)
      process.on('SIGINT', async () => {
        try {
          await mongoose.connection.close(false);
          console.log('MongoDB: połączenie zamknięte przez aplikację (SIGINT)');
          process.exit(0);
        } catch (closeErr) {
          console.error('MongoDB: błąd podczas zamykania połączenia', closeErr);
          process.exit(1);
        }
      });

      // Zwracamy obiekt połączenia
      return mongoose.connection;
    } catch (err) {
      console.error(`MongoDB: nie udało się połączyć (attempt ${attempts}/${maxAttempts}):`, err.message || err);
      if (attempts >= maxAttempts) {
        console.error('MongoDB: przekroczono maksymalną liczbę prób połączenia. Kończę działanie.');
        throw err;
      }
      // Exponential backoff przed kolejną próbą
      const backoffMs = Math.min(1000 * 2 ** attempts, 30000);
      console.log(`MongoDB: ponawiam próbę za ${backoffMs} ms...`);
      // eslint-disable-next-line no-await-in-loop
      await sleep(backoffMs);
    }
  }
};

module.exports = connectMongoDB;