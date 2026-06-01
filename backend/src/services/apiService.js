// Serwis do pobierania danych z API NBP oraz Open-Meteo
// Kod i komunikaty są w języku polskim, zgodnie ze specyfikacją.
const axios = require('axios');

// Stałe adresy API
const NBP_API_URL = 'https://api.nbp.pl/api/exchangerates/rates/a/eur/?format=json';
const OPEN_METEO_WEATHER_URL = 'https://api.open-meteo.com/v1/forecast';
const OPEN_METEO_AIR_QUALITY_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality';

// Prosty bufor odpowiedzi, żeby ograniczyć liczbę identycznych żądań
const cache = new Map();
const CACHE_TTL_MS = 30 * 60 * 1000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getCachedValue = (key) => {
  const entry = cache.get(key);

  if (!entry) {
    return null;
  }

  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }

  return entry.value;
};

const setCachedValue = (key, value) => {
  cache.set(key, {
    value,
    timestamp: Date.now(),
  });
};

const requestWithRetry = async (url, options, etykieta) => {
  try {
    return await axios.get(url, options);
  } catch (error) {
    const statusCode = error.response?.status;

    if (statusCode === 429) {
      const retryAfterHeader = error.response?.headers?.['retry-after'];
      const retryAfterMs = retryAfterHeader ? Number(retryAfterHeader) * 1000 : 1500;

      console.warn(`${etykieta}: limit zapytań przekroczony, ponawiam za ${retryAfterMs} ms`);
      await sleep(retryAfterMs);

      return axios.get(url, options);
    }

    throw error;
  }
};

// Zahardkodowana mapa współrzędnych geograficznych dla miast z projektu
const CITY_COORDINATES = {
  Warszawa: { latitude: 52.2297, longitude: 21.0122 },
  Kraków: { latitude: 50.0647, longitude: 19.945 },
  Wrocław: { latitude: 51.1079, longitude: 17.0385 },
  Gdańsk: { latitude: 54.352, longitude: 18.6466 },
  Poznań: { latitude: 52.4064, longitude: 16.9252 },
  Łódź: { latitude: 51.7592, longitude: 19.456 },
  Szczecin: { latitude: 53.4285, longitude: 14.5528 },
  Rzeszów: { latitude: 50.0412, longitude: 21.9991 },
  Lublin: { latitude: 51.2465, longitude: 22.5684 },
};

/**
 * Pobiera kurs wymiany EUR z API NBP.
 * @returns {Promise<Object>} Obiekt z odpowiedzią API NBP.
 */
const getExchangeRate = async () => {
  try {
    const cacheKey = 'nbp:eur';
    const cached = getCachedValue(cacheKey);

    if (cached) {
      return cached;
    }

    const response = await requestWithRetry(NBP_API_URL, {}, 'NBP');
    setCachedValue(cacheKey, response.data);
    return response.data;
  } catch (error) {
    console.error('Błąd podczas pobierania kursu wymiany z NBP:', error.message || error);
    throw new Error('Nie udało się pobrać kursu wymiany z API NBP');
  }
};

/**
 * Pobiera dane pogodowe Open-Meteo dla wskazanego miasta.
 * @param {string} city - Nazwa miasta z mapy współrzędnych.
 * @returns {Promise<Object>} Obiekt z danymi pogodowymi.
 */
const getWeatherData = async (city) => {
  try {
    const coordinates = CITY_COORDINATES[city];

    if (!coordinates) {
      throw new Error(`Nieznane miasto: ${city}`);
    }

    const cacheKey = `weather:${city}`;
    const cached = getCachedValue(cacheKey);

    if (cached) {
      return cached;
    }

    const response = await requestWithRetry(OPEN_METEO_WEATHER_URL, {
      params: {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code',
        timezone: 'Europe/Warsaw',
      },
    }, `Open-Meteo weather (${city})`);

    setCachedValue(cacheKey, response.data);

    return response.data;
  } catch (error) {
    console.error('Błąd podczas pobierania danych pogodowych Open-Meteo:', error.message || error);
    throw new Error('Nie udało się pobrać danych pogodowych');
  }
};

/**
 * Pobiera dane o jakości powietrza Open-Meteo dla wskazanego miasta.
 * @param {string} city - Nazwa miasta z mapy współrzędnych.
 * @returns {Promise<Object>} Obiekt z danymi o jakości powietrza.
 */
const getAirQualityData = async (city) => {
  try {
    const coordinates = CITY_COORDINATES[city];

    if (!coordinates) {
      throw new Error(`Nieznane miasto: ${city}`);
    }

    const cacheKey = `air:${city}`;
    const cached = getCachedValue(cacheKey);

    if (cached) {
      return cached;
    }

    const response = await requestWithRetry(OPEN_METEO_AIR_QUALITY_URL, {
      params: {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        current: 'pm10,pm2_5',
        timezone: 'Europe/Warsaw',
      },
    }, `Open-Meteo air (${city})`);

    setCachedValue(cacheKey, response.data);

    return response.data;
  } catch (error) {
    console.error('Błąd podczas pobierania danych o jakości powietrza Open-Meteo:', error.message || error);
    throw new Error('Nie udało się pobrać danych o jakości powietrza');
  }
};

// Eksport zgodny ze specyfikacją oraz z istniejącymi wywołaniami w kodzie
module.exports = {
  CITY_COORDINATES,
  getExchangeRate,
  getWeatherData,
  getAirQualityData,
  fetchNBPData: getExchangeRate,
  fetchWeatherData: getWeatherData,
};
