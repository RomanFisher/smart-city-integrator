import React, { useMemo, useState } from 'react';
import '../styles/CityMap.css';

const POZYCJE_MIAST = {
  Warszawa: { left: 65, top: 45 },
  Kraków: { left: 58, top: 80 },
  Wrocław: { left: 35, top: 65 },
  Poznań: { left: 33, top: 42 },
  Łódź: { left: 52, top: 54 },
  Gdańsk: { left: 48, top: 12 },
  Szczecin: { left: 12, top: 25 },
  Rzeszów: { left: 72, top: 82 },
  Lublin: { left: 76, top: 56 },
};

const MIN_COLOR = { red: 245, green: 158, blue: 11 };
const MAX_COLOR = { red: 16, green: 185, blue: 129 };

const toHex = (value) => value.toString(16).padStart(2, '0');

const toRgba = (kolor, alpha) => {
  const red = parseInt(kolor.slice(1, 3), 16);
  const green = parseInt(kolor.slice(3, 5), 16);
  const blue = parseInt(kolor.slice(5, 7), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
};

const interpolateColor = (minimum, maximum, progress) => {
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const red = Math.round(minimum.red + (maximum.red - minimum.red) * clampedProgress);
  const green = Math.round(minimum.green + (maximum.green - minimum.green) * clampedProgress);
  const blue = Math.round(minimum.blue + (maximum.blue - minimum.blue) * clampedProgress);

  return `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
};

const formatowaniePLN = (wartość) => {
  const liczba = Number(wartość);
  if (!Number.isFinite(liczba)) {
    return 'Brak danych';
  }

  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    maximumFractionDigits: 0,
  }).format(liczba);
};

const CityMap = ({ data = [], miasta = [] }) => {
  const [aktywnyTooltip, ustawAktywnyTooltip] = useState(null);

  const daneMiast = useMemo(() => {
    const lista = Array.isArray(data) && data.length > 0 ? data : miasta;
    const indeksy = lista
      .map((pozycja) => Number(pozycja.qualityOfLifeIndex))
      .filter((wartość) => Number.isFinite(wartość));

    const minimalnyIndeks = indeksy.length > 0 ? Math.min(...indeksy) : 0;
    const maksymalnyIndeks = indeksy.length > 0 ? Math.max(...indeksy) : 1;
    const zakresIndeksu = Math.max(maksymalnyIndeks - minimalnyIndeks, 1);

    return lista
      .map((pozycja) => {
        const nazwaMiasta = pozycja.city || 'Nieznane miasto';
        const pozycjaNaMapie = POZYCJE_MIAST[nazwaMiasta];
        const wartoscIndeksu = Number(pozycja.qualityOfLifeIndex);
        const progress = Number.isFinite(wartoscIndeksu)
          ? (wartoscIndeksu - minimalnyIndeks) / zakresIndeksu
          : 0;

        return {
          ...pozycja,
          city: nazwaMiasta,
          left: pozycjaNaMapie?.left,
          top: pozycjaNaMapie?.top,
          markerColor: Number.isFinite(wartoscIndeksu)
            ? interpolateColor(MIN_COLOR, MAX_COLOR, progress)
            : '#94a3b8',
          markerCenterColor: Number.isFinite(wartoscIndeksu)
            ? toRgba(interpolateColor(MIN_COLOR, MAX_COLOR, progress), 0.8)
            : 'rgba(148, 163, 184, 0.8)',
          markerProgress: Number.isFinite(wartoscIndeksu) ? progress : 0,
          markerOpacity: Number.isFinite(wartoscIndeksu) ? 0.78 + (progress * 0.18) : 0.6,
        };
      })
      .filter((pozycja) => Number.isFinite(pozycja.left) && Number.isFinite(pozycja.top));
  }, [data, miasta]);

  if (daneMiast.length === 0) {
    return <p className="map-empty">Brak danych do wyświetlenia na mapie.</p>;
  }

  return (
    <div className="city-map-card">
      <header className="city-map-header">
        <h3>Mapa Polski</h3>
        <p>Kolor punktu pokazuje poziom jakości życia dla każdego miasta.</p>
      </header>

      <div className="city-map-wrapper">
        <div className="city-map-borders" aria-hidden="true">
          <span className="city-map-shape city-map-shape-1" />
          <span className="city-map-shape city-map-shape-2" />
          <span className="city-map-shape city-map-shape-3" />
        </div>

        {daneMiast.map((miasto) => (
          <div
            key={`${miasto.city}-${miasto.id ?? miasto.qualityOfLifeIndex}`}
            className="city-map-point-wrapper"
            style={{ left: `${miasto.left}%`, top: `${miasto.top}%` }}
            onMouseEnter={() => ustawAktywnyTooltip(miasto.city)}
            onMouseLeave={() => ustawAktywnyTooltip(null)}
          >
            <span
              className="city-map-point"
              style={{
                '--marker-center': miasto.markerCenterColor,
                '--marker-color': miasto.markerColor,
                '--marker-opacity': miasto.markerOpacity,
              }}
              aria-label={miasto.city}
            />
            <span className="city-map-name">{miasto.city}</span>

            {aktywnyTooltip === miasto.city && (
              <div className="city-map-tooltip" role="tooltip">
                <strong>{miasto.city}</strong>
                <span>Koszty życia: {formatowaniePLN(miasto.costOfLiving)}</span>
                <span>Wskaźnik jakości życia: {Number(miasto.qualityOfLifeIndex).toFixed(2)}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="city-map-legend" aria-label="Legenda mapy">
        <span><i className="legend-dot good" />Jakość życia 65+</span>
        <span><i className="legend-dot medium" />Jakość życia 50-64</span>
        <span><i className="legend-dot low" />Jakość życia poniżej 50</span>
      </div>
    </div>
  );
};

export default CityMap;
