const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');

// Ścieżka do pliku bazy danych
const databaseFile = path.join(__dirname, '../../data/database.sqlite');

// Upewnij się, że katalog istnieje
try {
  const dir = path.dirname(databaseFile);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
} catch (err) {
  console.error('SQLite: błąd podczas tworzenia katalogu bazy danych', err);
}

// Inicjalizacja połączenia z bazą danych za pomocą ORM Sequelize
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: databaseFile,
  logging: false, // Wyłączone logowanie SQL, aby zachować czystość w konsoli
  define: {
    timestamps: false,     // Blokujemy automatyczne dodawanie kolumn createdAt/updatedAt przez Sequelize
    freezeTableName: true  // Blokujemy automatyczną zmianę nazw tabel na liczbę mnogą
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// =========================================================================
// Bloki kodu dla wstecznej kompatybilności (zabezpieczenie przed padaniem aplikacji)
// =========================================================================

// Zastępuje stary runAsync za pomocą natywnego mapowania zapytań w Sequelize
const runAsync = async (sql, params = []) => {
  const [results, metadata] = await sequelize.query(sql, {
    replacements: params,
    type: sequelize.QueryTypes.INSERT
  });
  // Zwracamy strukturę identyczną ze starym sterownikiem sqlite3 (lastID)
  return { lastID: results, changes: metadata };
};

// Zastępuje stary allAsync do pobierania tablicy rekordów (np. dla eksportu XML)
const allAsync = async (sql, params = []) => {
  return await sequelize.query(sql, {
    replacements: params,
    type: sequelize.QueryTypes.SELECT
  });
};

// Zastępuje stary getAsync do pobierania pojedynczego rekordu po ID
const getAsync = async (sql, params = []) => {
  const rows = await sequelize.query(sql, {
    replacements: params,
    type: sequelize.QueryTypes.SELECT
  });
  return rows[0] || null;
};

// Pomocniczy helper dla bezpośrednich poleceń SQL
const execAsync = async (sql) => {
  return await sequelize.query(sql);
};

// Konfiguracja trybu WAL oraz poziomów izolacji współdzielenia zasobów
const setWalMode = async () => {
  try {
    // Ustawienie PRAGMA journal_mode=WAL pozwala na współbieżne operacje odczytu i zapisu
    await sequelize.query("PRAGMA journal_mode = WAL;");
    // Zapobieganie błędom SQLITE_BUSY przy jednoczesnych zapytaniach wielu użytkowników
    await sequelize.query("PRAGMA busy_timeout = 5000;");
    console.log('SQLite: PRAGMA journal_mode ustawione na WAL, busy_timeout=5000');
  } catch (err) {
    console.warn('SQLite: nie udało się ustawić PRAGMA WAL:', err.message || err);
  }
};

// Funkcja inicjalizująca bazę danych dla głównego pliku index.js
const initDb = async () => {
  try {
    await sequelize.authenticate();
    console.log('SQLite: połączenie z plikiem bazy danych powiodło się za pomocą ORM Sequelize.');
    await setWalMode();
    // Bezpieczna synchronizacja modeli bez ryzyka nadpisania istniejących danych rocznych (GUS)
    await sequelize.sync();
    return sequelize;
  } catch (error) {
    console.error('SQLite: błąd inicjalizacji bazy danych (Sequelize):', error);
    throw error;
  }
};

// Eksportujemy ZARÓWNO instancję Sequelize dla ORM i transakcji, jak i stare metody kompatybilności!
module.exports = { 
  sequelize, 
  initDb, 
  runAsync,
  allAsync,
  getAsync,
  execAsync, 
  setWalMode 
};