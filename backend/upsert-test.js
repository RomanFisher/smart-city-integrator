(async () => {
  try {
    const { sequelize, CityAnalysis } = require('./src/config/sqlite');

    // Synchronizuj modele (bez force)
    await sequelize.sync();

    const testValues = {
      userId: '6a0b4a346367687b8fe5ad43',
      city: 'TestCity',
      wynagrodzenie: 5000,
      kosztyZycia: 40,
      qualityOfLifeIndex: 75.5,
      totalPricePLN: 300000,
      yearlyTemp: 9.5,
      yearlyPM25: 5.2,
      crimeRate: 20,
    };

    try {
      const result = await CityAnalysis.upsert(testValues);
      console.log('Upsert OK:', result);
    } catch (err) {
      console.error('Upsert ERR name:', err.name);
      console.error('Upsert ERR message:', err.message);
      if (err.errors) console.error('Upsert ERR details:', JSON.stringify(err.errors, null, 2));
      console.error(err.stack);
    }

    process.exit(0);
  } catch (e) {
    console.error('Script error:', e);
    process.exit(1);
  }
})();
