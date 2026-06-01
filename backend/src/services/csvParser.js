// CSV Parser Service - Reads legacy_gus_data.csv
const fs = require('fs').promises;
const path = require('path');
const csv = require('csv-parse/sync');

exports.parseLegacyData = async () => {
  try {
    const filePath = path.join(__dirname, '../../data/legacy_gus_data.csv');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    
    const records = csv.parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    });

    return records;
  } catch (error) {
    console.error('CSV parsing error:', error);
    throw new Error('Failed to parse CSV data');
  }
};
