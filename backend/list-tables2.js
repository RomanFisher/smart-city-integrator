const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'data', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.all("SELECT name, sql FROM sqlite_master WHERE type='table'", (err, rows) => {
  if (err) {
    console.error('SQLITE_ERR', err);
    process.exit(1);
  }

  console.log(JSON.stringify(rows, null, 2));
  db.close();
});
