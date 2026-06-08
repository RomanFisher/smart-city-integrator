// ============================================================================
// OPIS: Interaktywna mapa, która wizualizuje jakość życia w miastach.
//       Dynamicznie oblicza pozycje punktów oraz automatycznie dobiera kolor 
//       znaku (od pomarańczowego do zielonego) na podstawie wyników z bazy danych.
// ============================================================================

import React, { useMemo, useState } from 'react';
import '../styles/CityMap.css';

// Stałe pozycje miast na mapie (wartości procentowe CSS left i top dla kontenera)
// Uwaga: używamy nazw miast bez polskich znaków (ASCII) — zobacz `normalizeCityName` niżej
const POZYCJE_MIAST = {
  Warszawa: { left: 65, top: 45 },
  Krakow: { left: 58, top: 80 },
  Wroclaw: { left: 35, top: 65 },
  Poznan: { left: 33, top: 42 },
  Lodz: { left: 52, top: 54 },
  Gdansk: { left: 48, top: 12 },
  Szczecin: { left: 12, top: 25 },
  Rzeszow: { left: 72, top: 82 },
  Lublin: { left: 76, top: 56 },
};

// Pomocnicza funkcja transliterująca polskie znaki do ASCII
const normalizeCityName = (s) => {
  if (!s || typeof s !== 'string') return s;
  const map = {
    'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n', 'ó': 'o', 'ś': 's', 'ż': 'z', 'ź': 'z',
    'Ą': 'A', 'Ć': 'C', 'Ę': 'E', 'Ł': 'L', 'Ń': 'N', 'Ó': 'O', 'Ś': 'S', 'Ż': 'Z', 'Ź': 'Z',
  };
  return s.split('').map((ch) => map[ch] || ch).join('');
};

// Kolory skrajne dla punktów: MIN = pomarańczowy (słaby wynik), MAX = zielony (super wynik)
const MIN_COLOR = { red: 245, green: 158, blue: 11 };
const MAX_COLOR = { red: 16, green: 185, blue: 129 };

// Funkcja pomocnicza: zamienia liczbę na format szesnastkowy (Hex) dla kolorów CSS
const toHex = (value) => value.toString(16).padStart(2, '0');

// Funkcja pomocnicza: zamienia kolor Hex na format RGBA z obsługą przezroczystości (alpha)
const toRgba = (kolor, alpha) => {
  const red = parseInt(kolor.slice(1, 3), 16);
  const green = parseInt(kolor.slice(3, 5), 16);
  const blue = parseInt(kolor.slice(5, 7), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
};

// Matematyczna interpolacja liniowa: płynnie miesza dwa kolory na podstawie postępu (progress od 0 do 1)
const interpolateColor = (minimum, maximum, progress) => {
  // Ograniczamy progress, żeby rygorystycznie mieścił się w przedziale 0-1
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  
  // Wyliczamy składowe RGB dla nowego, wymieszanego koloru
  const red = Math.round(minimum.red + (maximum.red - minimum.red) * clampedProgress);
  const green = Math.round(minimum.green + (maximum.green - minimum.green) * clampedProgress);
  const blue = Math.round(minimum.blue + (maximum.blue - minimum.blue) * clampedProgress);

  // Zwracamy gotowy string Hex (np. #10b981)
  return `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
};

// Ładne formatowanie kosztów życia na walutę PLN bez groszy (np. 4 500 zł)
const formatowaniePLN = (wartosc) => {
  const liczba = Number(wartosc);
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
  // Stan (state) przechowujący nazwę miasta, nad którym aktualnie znajduje się myszka
  const [aktywnyTooltip, ustawAktywnyTooltip] = useState(null);

  // Optymalizacja useMemo: przeliczamy kolory i pozycje tylko wtedy, gdy zmienią się dane wejściowe
  const daneMiast = useMemo(() => {
    // Sprawdzamy, które źródło danych jest aktywne (np. po świeżej analizie lub ze starej listy)
    const lista = Array.isArray(data) && data.length > 0 ? data : miasta;
    
    // Wyciągamy same liczbowe indeksy jakości życia do tablicy
    const indeksy = lista
      .map((pozycja) => Number(pozycja.qualityOfLifeIndex))
        .filter((wartosc) => Number.isFinite(wartosc));

    // Szukamy najgorszego i najlepszego wyniku w obecnej serii danych, aby stworzyć skalę kolorów
    const minimalnyIndeks = indeksy.length > 0 ? Math.min(...indeksy) : 0;
    const maksymalnyIndeks = indeksy.length > 0 ? Math.max(...indeksy) : 1;
    const zakresIndeksu = Math.max(maksymalnyIndeks - minimalnyIndeks, 1);

    // Mapujemy tablicę miast dodając do niej dynamiczne parametry wizualne CSS
    return lista
      .map((pozycja) => {
        const nazwaMiasta = pozycja.city || 'Nieznane miasto';
        const pozycjaNaMapie = POZYCJE_MIAST[normalizeCityName(nazwaMiasta)];
        const wartoscIndeksu = Number(pozycja.qualityOfLifeIndex);
        
        // Obliczamy względny postęp miasta na skali jakości (od 0.0 do 1.0)
        const progress = Number.isFinite(wartoscIndeksu)
          ? (wartoscIndeksu - minimalnyIndeks) / zakresIndeksu
          : 0;

        return {
          ...pozycja,
          city: nazwaMiasta,
          left: pozycjaNaMapie?.left, // Procentowa pozycja X na mapie
          top: pozycjaNaMapie?.top,   // Procentowa pozycja Y na mapie
          
          // Dobieramy główny kolor kropki (jeśli brak danych, ustawiamy szary szkieletowy #94a3b8)
          markerColor: Number.isFinite(wartoscIndeksu)
            ? interpolateColor(MIN_COLOR, MAX_COLOR, progress)
            : '#94a3b8',
            
          // Dobieramy przezroczyste tło wokół kropki (efekt poświaty pulse)
          markerCenterColor: Number.isFinite(wartoscIndeksu)
            ? toRgba(interpolateColor(MIN_COLOR, MAX_COLOR, progress), 0.8)
            : 'rgba(148, 163, 184, 0.8)',
          markerProgress: Number.isFinite(wartoscIndeksu) ? progress : 0,
          
          // Lepsze miasta świecą mocniej (wyższa opaczność / opacity)
          markerOpacity: Number.isFinite(wartoscIndeksu) ? 0.78 + (progress * 0.18) : 0.6,
        };
      })
      // Odrzucamy miasta, dla których nie zdefiniowaliśmy współrzędnych procentowych left/top
      .filter((pozycja) => Number.isFinite(pozycja.left) && Number.isFinite(pozycja.top));
  }, [data, miasta]);

  // Jeśli brak danych do wyświetlenia, pokazujemy prosty komunikat tekstowy
  if (daneMiast.length === 0) {
    return <p className="map-empty">Brak danych do wyświetlenia na mapie.</p>;
  }

  return (
    <div className="city-map-card">
      {/* Nagłówek panelu mapy */}
      <header className="city-map-header">
        <h3>Mapa Polski</h3>
        <p>Kolor punktu pokazuje poziom jakości życia dla każdego miasta.</p>
      </header>

      {/* Główny obszar roboczy mapy */}
      <div className="city-map-wrapper">
        {/* Dekoracyjne tło mapy (generowane przez CSS kształty granic Polski) */}
        <div className="city-map-borders" aria-hidden="true">
          <span className="city-map-shape city-map-shape-1" />
          <span className="city-map-shape city-map-shape-2" />
          <span className="city-map-shape city-map-shape-3" />
        </div>

        {/* Pętla renderująca punkty dla każdego przeliczonego miasta */}
        {daneMiast.map((miasto) => (
          <div
            key={`${miasto.city}-${miasto.id ?? miasto.qualityOfLifeIndex}`}
            className="city-map-point-wrapper"
            style={{ left: `${miasto.left}%`, top: `${miasto.top}%` }}
            // Obsługa zdarzeń myszy: pokazujemy tooltip po najechaniu i chowamy po opuszczeniu
            onMouseEnter={() => ustawAktywnyTooltip(miasto.city)}
            onMouseLeave={() => ustawAktywnyTooltip(null)}
          >
            {/* Sam punkt graficzny (kropka). Dynamiczne kolory przekazujemy jako zmienne CSS (--marker-*) */}
            <span
              className="city-map-point"
              style={{
                '--marker-center': miasto.markerCenterColor,
                '--marker-color': miasto.markerColor,
                '--marker-opacity': miasto.markerOpacity,
              }}
              aria-label={miasto.city}
            />
            {/* Tekstowa stała nazwa miasta pod lub obok kropki */}
            <span className="city-map-name">{miasto.city}</span>

            {/* Warunkowe renderowanie tooltipu (chmurki) z detalami po najechaniu myszką */}
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

      {/* Legenda na samym dole mapy objaśniająca przedziały punktowe */}
      <div className="city-map-legend" aria-label="Legenda mapy">
        <span><i className="legend-dot good" />Jakość życia 65+</span>
        <span><i className="legend-dot medium" />Jakość życia 50-64</span>
        <span><i className="legend-dot low" />Jakość życia poniżej 50</span>
      </div>
    </div>
  );
};

export default CityMap;