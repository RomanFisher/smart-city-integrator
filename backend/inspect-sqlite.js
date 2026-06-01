const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(process.argv[2]);
db.all("SELECT name, sql FROM sqlite_master WHERE type='table'", (err, rows) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(JSON.stringify(rows, null, 2));
  db.close();
});
