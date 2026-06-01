import React from 'react';
import '../styles/CityResultCard.css';

const formatPLN = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return '—';

  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    maximumFractionDigits: 2,
  }).format(number);
};

const formatEUR = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return '—';

  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(number);
};

const formatNumber = (value, suffix = '') => {
  const number = Number(value);
  if (!Number.isFinite(number)) return '—';
  return `${number.toFixed(2)}${suffix}`;
};

const getWeatherDescription = (weatherCode) => {
  const code = Number(weatherCode);

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

const CityResultCard = ({ city, data }) => {
  // Obsługujemy zarówno strukturę z raportu, jak i prosty obiekt miasta.
  const daneMiasta = data?.analysisData?.city ? data.analysisData : data || {};
  const nazwaMiasta = city || daneMiasta.city || 'Nieznane miasto';

  if (!daneMiasta) {
    return <div className="card card-empty">Brak danych do wyświetlenia</div>;
  }

  const qualityScore = Number(daneMiasta.qualityOfLifeIndex);
  const crimeRate = Number(daneMiasta.crimeRate);
  const crimePercent = Number.isFinite(crimeRate) ? crimeRate / 10 : NaN;
  const weatherDescription = getWeatherDescription(daneMiasta.weatherCode);
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
      <div className="city-result-header">
        <div>
          <p className="city-result-label">Miasto</p>
          <h2 className="card-title">{nazwaMiasta}</h2>
        </div>

        <div className={scoreClassName}>
          <span className="score-value">{Number.isFinite(qualityScore) ? qualityScore.toFixed(0) : '—'}</span>
          <span className="score-text">Wskaźnik jakości życia</span>
        </div>
      </div>

      <div className="city-result-grid">
        <section className="city-result-panel">
          <h3>Koszty zakupu</h3>
          <div className="metric-row">
            <span className="metric-label">Cena w PLN</span>
            <strong className="metric-value">{formatPLN(daneMiasta.totalPricePLN)}</strong>
          </div>
          <div className="metric-row">
            <span className="metric-label">Cena w EUR</span>
            <strong className="metric-value">{formatEUR(daneMiasta.totalPriceEUR)}</strong>
          </div>
          <div className="metric-row">
            <span className="metric-label" title="Liczba miesięcy pracy potrzebnych na zakup pełnego mieszkania">
              Dostępność
            </span>
            <strong
              className="metric-value"
              title="Liczba miesięcy pracy potrzebnych na zakup pełnego mieszkania"
            >
              {formatNumber(daneMiasta.affordabilityMonths, ' mies.')}
            </strong>
          </div>
        </section>

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

        <section className="city-result-panel city-result-panel-wide">
          <h3>Bezpieczeństwo</h3>
          <div className="metric-row">
            <span className="metric-label">Poziom przestępczości</span>
            <strong className="metric-value">{Number.isFinite(crimePercent) ? `${crimePercent.toFixed(2)}%` : '—'}</strong>
          </div>
        </section>

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
            <strong className="metric-value">{weatherDescription}</strong>
          </div>
        </section>
      </div>
    </div>
  );
};

export default CityResultCard;
