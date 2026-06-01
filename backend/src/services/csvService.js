// Serwis do odczytu historycznych danych GUS z pliku CSV
// Wykorzystuje moduł fs oraz bibliotekę csv-parser do parsowania danych z separatorem średnika.
const fs = require('fs');
const path = require('path');
const csvParser = require('csv-parser');

/**
 * readGusData - czyta lokalny plik legacy_gus_data.csv i zwraca tablicę obiektów
 * @returns {Promise<Array<Object>>} tablica rekordów z pliku CSV
 */
const readGusData = async () => {
  try {
    const filePath = path.join(__dirname, '../../data/legacy_gus_data.csv');
    const records = [];

    return await new Promise((resolve, reject) => {
      const stream = fs.createReadStream(filePath);

      stream
        .on('error', (error) => {
          reject(new Error(`Nie udało się otworzyć pliku CSV: ${error.message}`));
        })
        .pipe(
          csvParser({
            separator: ';',
            mapHeaders: ({ header }) => header ? header.replace(/"/g, '').trim() : header,
            mapValues: ({ value }) => (typeof value === 'string' ? value.replace(/"/g, '').trim() : value),
          })
        )
        .on('data', (data) => {
          records.push(data);
        })
        .on('end', () => {
          resolve(records);
        })
        .on('error', (error) => {
          reject(new Error(`Błąd podczas parsowania pliku CSV: ${error.message}`));
        });
    });
  } catch (error) {
    console.error('Błąd w serwisie CSV:', error);
    throw error;
  }
};

module.exports = {
  readGusData,
};
