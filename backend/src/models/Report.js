const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sqlite');

// Mapowanie istniejącej tabeli 'Reports' przy użyciu ORM Sequelize
const Report = sequelize.define('Report', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  city: {
    type: DataTypes.STRING,
    allowNull: false
  },
  totalPricePLN: { type: DataTypes.FLOAT },
  totalPriceEUR: { type: DataTypes.FLOAT },
  affordabilityMonths: { type: DataTypes.FLOAT },
  temperature: { type: DataTypes.FLOAT },
  apparentTemperature: { type: DataTypes.FLOAT },
  humidity: { type: DataTypes.FLOAT },
  weatherCode: { type: DataTypes.INTEGER },
  airQualityPM25: { type: DataTypes.FLOAT },
  airQualityPM10: { type: DataTypes.FLOAT },
  qualityOfLifeIndex: { type: DataTypes.FLOAT },
  crimeRate: { type: DataTypes.FLOAT },
  pricePerSqm: { type: DataTypes.FLOAT },
  averageSalary: { type: DataTypes.FLOAT },
  costOfLiving: { type: DataTypes.FLOAT },
  yearlyTemp: { type: DataTypes.FLOAT },
  yearlyPM25: { type: DataTypes.FLOAT },
  createdAt: {
    type: DataTypes.STRING,
    defaultValue: () => new Date().toISOString()
  },
  updatedAt: {
    type: DataTypes.STRING,
    defaultValue: () => new Date().toISOString()
  }
}, {
  tableName: 'Reports', // Wskazanie dokładnej nazwy tabeli w pliku .sqlite
  timestamps: false     // Ręczne zarządzanie polami dat
});

// Klasa Repository zachowująca strukturę metod dla kompatybilności z kontrolerami
class ReportRepository {
  static async create(data) {
    const now = new Date().toISOString();
    const report = await Report.create({
      ...data,
      createdAt: now,
      updatedAt: now
    });
    return report.get({ plain: true });
  }

  static async findById(id) {
    return await Report.findByPk(id, { raw: true });
  }

  static async findAll(options = {}) {
    const sequelizeOptions = {
      where: options.where || {},
      raw: true
    };

    if (options.order) {
      sequelizeOptions.order = options.order;
    } else {
      sequelizeOptions.order = [['createdAt', 'DESC']];
    }

    if (options.limit) {
      sequelizeOptions.limit = Number(options.limit);
    }

    return await Report.findAll(sequelizeOptions);
  }

  static async findOne(options = {}) {
    return await Report.findOne({ where: options.where || {}, raw: true });
  }

  static async upsert(data, options = {}) {
    const now = new Date().toISOString();
    
    // Sprawdzamy, czy istnieje już analiza dla danej kombinacji użytkownika i miasta
    const existing = await Report.findOne({
      where: { userId: data.userId, city: data.city },
      transaction: options.transaction // Uwzględnienie kontekstu transakcji
    });

    if (existing) {
      // Aktualizacja rekordu za pomocą ORM Sequelize
      await Report.update({
        ...data,
        updatedAt: now
      }, {
        where: { id: existing.id },
        transaction: options.transaction
      });
      return await Report.findByPk(existing.id, { raw: true, transaction: options.transaction });
    } else {
      // Tworzenie nowego rekordu za pomocą ORM Sequelize
      const created = await Report.create({
        ...data,
        createdAt: now,
        updatedAt: now
      }, {
        transaction: options.transaction
      });
      return created.get({ plain: true });
    }
  }
}

module.exports = ReportRepository;