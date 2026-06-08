// ============================================================================
// OPIS: Wyświetla pojedynczą kartę z kompletem zebranych danych dla miasta.
//       Łączy dane z plików CSV (GUS) oraz zewnętrznych API REST (NBP, Open-Meteo).
// ============================================================================

import React from 'react';
import '../styles/CityResultCard.css';

// Funkcja pomocnicza: formatuje surową liczbę na polskie złote (PLN)
const formatPLN = (value) => {
  const number = Number(value);
  // Jeśli dane są niepoprawne lub ich nie ma, zwracamy kreskę
  if (!Number.isFinite(number)) return '—';

  // Używamy wbudowanego mechanizmu JS do ładnego zapisu waluty (np. 12 345,67 zł)
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    maximumFractionDigits: 2, // Maksymalnie dwa miejsca po przecinku
  }).format(number);
};

// Funkcja pomocnicza: formatuje liczbę na euro (EUR) przy użyciu kursu z API NBP
const formatEUR = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return '—';

  // Formatowanie na walutę EUR ze standardowym polskim zapisem przeczków
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(number);
};

// Funkcja pomocnicza: zaokrągla zwykłe liczby do 2 miejsc i dodaje jednostkę (np. "°C", " mies.")
const formatNumber = (value, suffix = '') => {
  const number = Number(value);
  if (!Number.isFinite(number)) return '—';
  return `${number.toFixed(2)}${suffix}`;
};

// Funkcja pomocnicza: zamienia liczbowy kod pogody (weather_code) z Open-Meteo na tekst po polsku
const getWeatherDescription = (weatherCode) => {
  const code = Number(weatherCode);

  // Sprawdzamy kod krok po kroku i dopasowujemy opis synoptyczny
  if (!Number.isFinite(code)) return 'Brak danych pogodowych';
  if (code === 0) return 'Czyste niebo';
  if (code === 1) return 'Przeważnie czyste niebo';
  if (code === 2) return 'Częściowe zachmurzenie';
  if (code === 3) return 'Całkowite zachmurzenie';
  if ([45, 48].includes(code)) return 'Mgła';
  if ([51, 53, 55].includes(code)) return 'Mżawka';
  if ([61, 63, 65].includes(code)) return 'Opady deszczu';
  if ([71, 73, 75].includes(code)) return 'Opady śniegu';
  if ([80, 81, 82].includes(code)) return 'Przelotny deszcz';
  if (code === 95) return 'Burza';

  return 'Inne warunki pogodowe';
};

// Główny komponent React, który dostaje w propsach nazwę miasta i obiekt z danymi
const CityResultCard = ({ city, data }) => {
  
  // Zabezpieczenie struktury: wyciągamy poprawne dane niezależnie від formatu odpowiedzi z backendu
  const daneMiasta = data?.analysisData?.city ? data.analysisData : data || {};
  const nazwaMiasta = city || daneMiasta.city || 'Nieznane miasto';

  // Jeśli obiekt z danymi jest pusty, pokazujemy prosty komunikat błędu
  if (!daneMiasta) {
    return <div className="card card-empty">Brak danych do wyświetlenia</div>;
  }

  // Wyciągamy wskaźniki i parametry do lokalnych zmiennych
  const qualityScore = Number(daneMiasta.qualityOfLifeIndex);
  const crimeRate = Number(daneMiasta.crimeRate);
  
  // Przeliczamy surowy wskaźnik przestępczości z CSV na czytelne wartości procentowe
  const crimePercent = Number.isFinite(crimeRate) ? crimeRate / 10 : NaN;
  
  // Generujemy tekstowy opis pogody na podstawie kodu z API
  const weatherDescription = getWeatherDescription(daneMiasta.weatherCode);
  
  // Logika dynamicznych klas CSS: ustawiamy kolor badge'a w zależności od wskaźnika jakości życia
  // Wykaz powierzej 75 = zielony, powyżej 50 = żółty, poniżej = czerwony
  const scoreClassName =
    Number.isFinite(qualityScore)
      ? qualityScore >= 75
        ? 'score-badge score-badge-high'
        : qualityScore >= 50
          ? 'score-badge score-badge-medium'
          : 'score-badge score-badge-low'
      : 'score-badge';

  return (
    <div className="card city-result-card">
      
      {/* ------------------------------------------------------------------ */}
      {/* NAGŁÓWEK KARTY: Nazwa miasta i główny wyliczony wskaźnik jakości życia */}
      {/* ------------------------------------------------------------------ */}
      <div className="city-result-header">
        <div>
          <p className="city-result-label">Miasto</p>
          <h2 className="card-title">{nazwaMiasta}</h2>
        </div>

        {/* Dynamiczny badge wskaźnika (zmienia kolory dzięki klasie scoreClassName) */}
        <div className={scoreClassName}>
          <span className="score-value">{Number.isFinite(qualityScore) ? qualityScore.toFixed(0) : '—'}</span>
          <span className="score-text">Wskaźnik jakości życia</span>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* SIATKA Z WYKAZEM DANYCH (GRID LAYOUT) */}
      {/* ------------------------------------------------------------------ */}
      <div className="city-result-grid">
        
        {/* PANEL 1: Finanse i koszty (Przeliczenia na podstawie kursu z API NBP) */}
        <section className="city-result-panel">
          <h3>Koszty zakupu</h3>
          <div className="metric-row">
            <span className="metric-label">Cena w PLN</span>
            <strong className="metric-value">{formatPLN(daneMiasta.totalPricePLN)}</strong>
          </div>
          <div className="metric-row">
            <span className="metric-label">Cena w EUR</span>
            {/* Wyświetla cenę przekonwertowaną na backendzie za pomocą kursu z NBP */}
            <strong className="metric-value">{formatEUR(daneMiasta.totalPriceEUR)}</strong>
          </div>
          <div className="metric-row">
            {/* Informacja o tym, ile miesięcy pracy potrzeba na zakup mieszkania */}
            <span className="metric-label" title="Liczba miesięcy pracy potrzebnych na zakup pełnego mieszkania">
              Dostępność
            </span>
            <strong className="metric-value" title="Liczba miesięcy pracy potrzebnych na zakup pełnego mieszkania">
              {formatNumber(daneMiasta.affordabilityMonths, ' mies.')}
            </strong>
          </div>
        </section>

        {/* PANEL 2: Pogoda na żywo (Dane pobrane z zewnętrznego REST API Open-Meteo) */}
        <section className="city-result-panel">
          <h3>Pogoda i komfort</h3>
          <div className="metric-row">
            <span className="metric-label">Temperatura</span>
            <strong className="metric-value">{formatNumber(daneMiasta.temperature, '°C')}</strong>
          </div>
          <div className="metric-row">
            <span className="metric-label">Odczuwalna</span>
            <strong className="metric-value">{formatNumber(daneMiasta.apparentTemperature, '°C')}</strong>
          </div>
          <div className="metric-row">
            <span className="metric-label">Wilgotność</span>
            <strong className="metric-value">{formatNumber(daneMiasta.humidity, '%')}</strong>
          </div>
        </section>

        {/* PANEL 3: Bezpieczeństwo (Dane statystyczne zintegrowane z plików CSV) */}
        <section className="city-result-panel city-result-panel-wide">
          <h3>Bezpieczeństwo</h3>
          <div className="metric-row">
            <span className="metric-label">Poziom przestępczości</span>
            <strong className="metric-value">{Number.isFinite(crimePercent) ? `${crimePercent.toFixed(2)}%` : '—'}</strong>
          </div>
        </section>

        {/* PANEL 4: Dane historyczne (Wczytane bezpośrednio z plików bazowych GUS / CSV) */}
        <section className="city-result-panel">
          <h3>Dane historyczne (CSV)</h3>
          <div className="metric-row">
            <span className="metric-label">Cena za m² (z pliku)</span>
            <strong className="metric-value">{formatPLN(daneMiasta.pricePerSqm)}</strong>
          </div>
          <div className="metric-row">
            <span className="metric-label">Średnie wynagrodzenie (z pliku)</span>
            <strong className="metric-value">{formatPLN(daneMiasta.averageSalary)}</strong>
          </div>
          <div className="metric-row">
            <span className="metric-label">Koszty życia (PLN z pliku)</span>
            <strong className="metric-value">{formatPLN(daneMiasta.costOfLiving)}</strong>
          </div>
        </section>

        {/* PANEL 5: Ekologia (Dane czystości powietrza z Open-Meteo Air Quality API) */}
        <section className="city-result-panel city-result-panel-wide">
          <h3>Jakość powietrza</h3>
          <div className="metric-row">
            <span className="metric-label">PM2.5</span>
            <strong className="metric-value">{formatNumber(daneMiasta.airQualityPM25, ' µg/m³')}</strong>
          </div>
          <div className="metric-row">
            <span className="metric-label">PM10</span>
            <strong className="metric-value">{formatNumber(daneMiasta.airQualityPM10, ' µg/m³')}</strong>
          </div>
          <div className="metric-row">
            <span className="metric-label">Pogoda</span>
            {/* Wyświetlamy przetłumaczony wcześniej opis tekstowy zamiast surowego kodu liczbowego */}
            <strong className="metric-value">{weatherDescription}</strong>
          </div>
        </section>
        
      </div>
    </div>
  );
};

export default CityResultCard;