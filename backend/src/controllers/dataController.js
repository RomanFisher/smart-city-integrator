// Główny kontroler integracyjny danych (Wersja z wdrożonym ORM Sequelize oraz transakcjami)
const { sequelize, setWalMode } = require('../config/sqlite');
const ReportRepository = require('../models/Report'); // Użycie bezpiecznego repozytorium ORM
const User = require('../models/User');
const csvService = require('../services/csvService');
const apiService = require('../services/apiService');

// Pomocnicze funkcje do obliczeń i normalizacji danych
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const parseNumber = (value, fallback = 0) => {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  const normalized = String(value).replace(/\s/g, '').replace(',', '.');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeCityName = (value) => {
  if (!value) {
    return '';
  }

  return String(value)
    .toLowerCase()
    .replace(/\./g, ' ')
    .replace(/[^a-ząćęłńóśźż0-9]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const CITY_ALIASES = {
  'powiat m warszawa': 'Warszawa',
  'powiat m st warszawa': 'Warszawa',
  'powiat m krakow': 'Kraków',
  'powiat m kraków': 'Kraków',
  'powiat m wroclaw': 'Wrocław',
  'powiat m wrocław': 'Wrocław',
  'powiat m gdansk': 'Gdańsk',
  'powiat m gdańsk': 'Gdańsk',
  'powiat m poznan': 'Poznań',
  'powiat m poznań': 'Poznań',
  'powiat m lodz': 'Łódź',
  'powiat m łódź': 'Łódź',
  'powiat m szczecin': 'Szczecin',
  'powiat m lublin': 'Lublin',
  'powiat m rzeszow': 'Rzeszów',
  'powiat m rzeszów': 'Rzeszów',
};

const resolveCityName = (rawName) => {
  const normalized = normalizeCityName(rawName);
  if (CITY_ALIASES[normalized]) {
    return CITY_ALIASES[normalized];
  }

  const canonicalCities = Object.keys(apiService.CITY_COORDINATES || {});
  const matchedCity = canonicalCities.find((city) => normalized.includes(normalizeCityName(city)));
  return matchedCity || rawName;
};

const extractPricePerSqm = (record) => {
  const possibleFields = [
    'Cena_m2_2024',
    'cena_m2_2024',
    'Cena m2 2024',
    'ogółem;ogółem;2024;[zł]',
    'ogolem;ogolem;2024;[zl]',
    'ogółem;ogółem;2024;[zł] ',
  ];

  for (const field of possibleFields) {
    if (record[field] !== undefined) {
      return parseNumber(record[field], 0);
    }
  }

  return 0;
};

const extractField = (record, possibleFields, fallback) => {
  for (const field of possibleFields) {
    if (record[field] !== undefined) {
      return parseNumber(record[field], fallback);
    }
  }

  return fallback;
};

const obliczWskaznikJakosciZycia = ({
  cenaM2,
  wynagrodzenie,
  przestepczosc,
  kosztyZycia,
  temperaturaOdczuwalna,
  pm25,
  pm10,
  yearlyTemp,
  yearlyPM25,
}) => {
  const ekonomia = clamp((wynagrodzenie / Math.max(cenaM2, 1)) * 120, 0, 100);
  const bezpieczenstwo = clamp(100 - przestepczosc, 0, 100);
  // Im większa część pensji idzie na codzienne życie, tym niższy wynik.
  const obciazenieKosztami = clamp((kosztyZycia / Math.max(wynagrodzenie, 1)) * 100, 0, 100);
  const koszty = clamp(100 - obciazenieKosztami, 0, 100);
  // Roczny pył PM2.5 mocno obniża wynik, bo lepiej opisuje stałą jakość powietrza.
  const ekologiaRoczna = clamp(100 - (yearlyPM25 * 3.5), 0, 100);
  const ekologiaBiezaca = clamp(100 - ((pm25 * 3) + pm10), 0, 100);
  const ekologia = clamp((ekologiaRoczna * 0.7) + (ekologiaBiezaca * 0.3), 0, 100);
  // Średnioroczna temperatura ma mniejszą, ale nadal istotną wagę dla komfortu.
  const komfortRoczny = clamp(100 - (Math.abs(yearlyTemp - 10) * 5), 0, 100);
  const komfortBiezacy = clamp(100 - (Math.abs(temperaturaOdczuwalna - 21) * 6), 0, 100);
  const komfortPogodowy = clamp((komfortRoczny * 0.6) + (komfortBiezacy * 0.4), 0, 100);

  const wynik = (
    (ekonomia * 0.25)
    + (bezpieczenstwo * 0.2)
    + (koszty * 0.15)
    + (ekologia * 0.2)
    + (komfortPogodowy * 0.2)
  );

  return Number(clamp(wynik, 1, 100).toFixed(2));
};

const escapeXml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

const zbudujXmlRaportow = (reports, userId) => {
  const wpisy = reports.map((report) => `
    <raport>
      <id>${escapeXml(report.id)}</id>
      <userId>${escapeXml(userId)}</userId>
      <city>${escapeXml(report.city)}</city>
      <totalPricePLN>${escapeXml(report.totalPricePLN)}</totalPricePLN>
      <totalPriceEUR>${escapeXml(report.totalPriceEUR)}</totalPriceEUR>
      <affordabilityMonths>${escapeXml(report.affordabilityMonths)}</affordabilityMonths>
      <crimeRate>${escapeXml(report.crimeRate)}</crimeRate>
      <temperature>${escapeXml(report.temperature)}</temperature>
      <apparentTemperature>${escapeXml(report.apparentTemperature)}</apparentTemperature>
      <humidity>${escapeXml(report.humidity)}</humidity>
      <weatherCode>${escapeXml(report.weatherCode)}</weatherCode>
      <airQualityPM25>${escapeXml(report.airQualityPM25)}</airQualityPM25>
      <airQualityPM10>${escapeXml(report.airQualityPM10)}</airQualityPM10>
      <qualityOfLifeIndex>${escapeXml(report.qualityOfLifeIndex)}</qualityOfLifeIndex>
    </raport>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<raporty>
  <uzytkownik>${escapeXml(userId)}</uzytkownik>
  ${wpisy}
</raporty>`;
};

/**
 * Główny endpoint integracyjny.
 * Pobiera dane użytkownika z MongoDB, dane historyczne z CSV, dane API zewnętrznych
 * oraz zapisuje wyniki do SQLite w jednej transakcji zarządzanej przez Sequelize.
 */
const analyzeData = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Brak autoryzacji lub nieprawidłowy token' });
    }

    const uzytkownik = await User.findById(userId).lean();
    if (!uzytkownik) {
      return res.status(400).json({ message: 'Nie znaleziono użytkownika' });
    }

    const preferencje = uzytkownik.preferences || {};
    const targetSqm = parseNumber(preferencje.targetSqm, 50);

    // Odczyt danych historycznych z pliku CSV
    const daneCSV = await csvService.readGusData();

    // Kurs EUR z NBP pobieramy raz dla całej analizy
    const daneKursowe = await apiService.getExchangeRate();
    const kursEUR = parseNumber(daneKursowe?.rates?.[0]?.mid, NaN);

    if (!Number.isFinite(kursEUR) || kursEUR <= 0) {
      throw new Error('Nie udało się odczytać prawidłowego kursu EUR z NBP');
    }

    const dostepneMiasta = Object.keys(apiService.CITY_COORDINATES || {});
    const mapaRekordow = new Map();

    for (const rekord of daneCSV) {
      const nazwaMiasta = resolveCityName(rekord.Nazwa || rekord.nazwa || '');
      if (nazwaMiasta) {
        mapaRekordow.set(normalizeCityName(nazwaMiasta), rekord);
      }
    }

    const brakujaceMiasta = [];
    const wynikiMiast = [];

    for (const miasto of dostepneMiasta) {
      const rekord = mapaRekordow.get(normalizeCityName(miasto));
      if (!rekord) {
        brakujaceMiasta.push(miasto);
        continue;
      }

      const pogoda = await apiService.getWeatherData(miasto);
      await sleep(350);
      const jakoscPowietrza = await apiService.getAirQualityData(miasto);

      const cenaM2 = extractPricePerSqm(rekord);
      const wynagrodzenie = extractField(rekord, ['Wynagrodzenie', 'wynagrodzenie'], 8500);
      const przestepczosc = extractField(rekord, ['Przestepczosc', 'przestepczosc'], 40);
      const kosztyZycia = extractField(rekord, ['Koszty_zycia', 'koszty_zycia'], 50);
      const yearlyTemp = extractField(rekord, ['Temp_rok', 'temp_rok', 'Temp rok', 'temp rok'], 10);
      const yearlyPM25 = extractField(rekord, ['PM25_rok', 'pm25_rok', 'PM25 rok', 'pm25 rok'], 0);

      const temperatura = parseNumber(pogoda?.current?.temperature_2m, 0);
      const temperaturaOdczuwalna = parseNumber(pogoda?.current?.apparent_temperature, temperatura);
      const wilgotnosc = parseNumber(pogoda?.current?.relative_humidity_2m, 0);
      const weatherCode = parseNumber(pogoda?.current?.weather_code, 0);
      const pm25 = parseNumber(jakoscPowietrza?.current?.pm2_5, 0);
      const pm10 = parseNumber(jakoscPowietrza?.current?.pm10, 0);

      const totalPricePLN = Number((cenaM2 * targetSqm).toFixed(2));
      const totalPriceEUR = Number((totalPricePLN / kursEUR).toFixed(2));
      const monthlyPurchaseCapacity = Math.max(wynagrodzenie - kosztyZycia - 2000, 1);
      const affordabilityMonths = Number((totalPricePLN / monthlyPurchaseCapacity).toFixed(2));

      const qualityOfLifeIndex = obliczWskaznikJakosciZycia({
        cenaM2,
        wynagrodzenie,
        przestepczosc,
        kosztyZycia,
        temperaturaOdczuwalna,
        pm25,
        pm10,
        yearlyTemp,
        yearlyPM25,
      });

      wynikiMiast.push({
        city: miasto,
        totalPricePLN,
        totalPriceEUR,
        affordabilityMonths,
        crimeRate: przestepczosc,
        pricePerSqm: cenaM2,
        averageSalary: wynagrodzenie,
        costOfLiving: kosztyZycia,
        yearlyTemp,
        yearlyPM25,
        temperature: temperatura,
        apparentTemperature: temperaturaOdczuwalna,
        humidity: wilgotnosc,
        weatherCode,
        airQualityPM25: pm25,
        airQualityPM10: pm10,
        qualityOfLifeIndex,
      });
    }

    // === IMPLEMENTACJA MECHANIZMU TRANSAKCJI ORAZ ZAPISU PRZEZ ORM SEQUELIZE ===
    const insertedIds = [];
    const tx = await sequelize.transaction(); // Inicjalizacja transakcji z poziomu ORM

    try {
      console.log('SQLite (Sequelize): Rozpoczęcie bezpiecznej transakcji zapisu raportów...');
      await setWalMode();

      for (const wynik of wynikiMiast) {
        const dataToSave = {
          userId,
          city: wynik.city,
          totalPricePLN: wynik.totalPricePLN,
          totalPriceEUR: wynik.totalPriceEUR,
          affordabilityMonths: wynik.affordabilityMonths,
          temperature: wynik.temperature,
          apparentTemperature: wynik.apparentTemperature,
          humidity: wynik.humidity,
          weatherCode: wynik.weatherCode,
          airQualityPM25: wynik.airQualityPM25,
          airQualityPM10: wynik.airQualityPM10,
          qualityOfLifeIndex: wynik.qualityOfLifeIndex,
          crimeRate: wynik.crimeRate,
          pricePerSqm: wynik.pricePerSqm,
          averageSalary: wynik.averageSalary,
          costOfLiving: wynik.costOfLiving,
          yearlyTemp: wynik.yearlyTemp,
          yearlyPM25: wynik.yearlyPM25
        };

        // Zapis przy użyciu operacji upsert z jawnie przekazanym obiektem transakcji
        const savedRecord = await ReportRepository.upsert(dataToSave, { transaction: tx });
        if (savedRecord && savedRecord.id) {
          insertedIds.push(savedRecord.id);
        }
      }

      // Zatwierdzenie transakcji w przypadku sukcesu wszystkich wpisów (COMMIT)
      await tx.commit();
      console.log('SQLite (Sequelize): Transakcja zatwierdzona pomyślnie (COMMIT).');
    } catch (txErr) {
      // Automatyczne wycofanie wszystkich zmian w razie błędu dowolnego rekordu (ROLLBACK)
      await tx.rollback();
      console.error('SQLite (Sequelize): Błąd zapisu! Wykonano automatyczny ROLLBACK:', txErr);

      return res.status(500).json({
        message: 'Wystąpił błąd podczas zapisu wyników analizy w transakcji ORM',
        error: txErr.message || String(txErr),
      });
    }

    // Pobranie nowo dodanych danych z bazy za pomocą ORM do celów prezentacji UI
    let savedReports = [];
    if (insertedIds.length > 0) {
      savedReports = await ReportRepository.findAll({
        where: { id: insertedIds },
        order: [['id', 'DESC']]
      });
    }

    return res.status(200).json({
      message: 'Analiza danych zakończona pomyślnie',
      userId,
      preferences: preferencje,
      exchangeRateEUR: kursEUR,
      skippedCities: brakujaceMiasta,
      reports: savedReports,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Wystąpił błąd podczas analizy danych',
      error: error.message,
    });
  }
};

/**
 * Pobiera zapisane preferencje użytkownika z MongoDB.
 */
const getPreferences = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Brak autoryzacji lub nieprawidłowy token' });
    }

    const user = await User.findById(userId).select('preferences').lean();

    if (!user) {
      return res.status(404).json({ message: 'Nie znaleziono użytkownika' });
    }

    return res.status(200).json({
      message: 'Preferencje zostały pobrane pomyślnie',
      preferences: user.preferences || {},
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Wystąpił błąd podczas pobierania preferencji',
      error: error.message,
    });
  }
};

/**
 * Aktualizuje preferencje użytkownika w MongoDB.
 */
const updatePreferences = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { targetSqm, rooms, maxBudgetPLN } = req.body || {};

    if (!userId) {
      return res.status(401).json({ message: 'Brak autoryzacji lub nieprawidłowy token' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Nie znaleziono użytkownika' });
    }

    user.preferences = {
      ...(user.preferences || {}),
      ...(targetSqm !== undefined ? { targetSqm: parseNumber(targetSqm, 50) } : {}),
      ...(rooms !== undefined ? { rooms: parseNumber(rooms, 2) } : {}),
      ...(maxBudgetPLN !== undefined ? { maxBudgetPLN: parseNumber(maxBudgetPLN, 700000) } : {}),
    };

    await user.save();

    return res.status(200).json({
      message: 'Preferencje zostały zaktualizowane pomyślnie',
      preferences: user.preferences,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Wystąpił błąd podczas aktualizacji preferencji',
      error: error.message,
    });
  }
};

/**
 * Eksportuje raporty użytkownika do formatu XML.
 */
const exportData = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Brak autoryzacji lub nieprawidłowy token' });
    }

    const rows = await ReportRepository.findAll({
      where: { userId: userId },
      order: [['createdAt', 'DESC']]
    });

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: 'Nie znaleziono raportów do eksportu' });
    }

    const xml = zbudujXmlRaportow(rows, userId);

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="raporty.xml"');

    return res.status(200).send(xml);
  } catch (error) {
    return res.status(500).json({
      message: 'Wystąpił błąd podczas eksportu danych do XML',
      error: error.message,
    });
  }
};

module.exports = {
  analyzeData,
  getPreferences,
  updatePreferences,
  exportData,
};