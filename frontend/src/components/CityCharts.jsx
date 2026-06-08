// ============================================================================
// OPIS: Główny moduł wizualizacji danych za pomocą biblioteki Recharts.
//       Generuje 5 zaawansowanych wykresów (słupkowe, liniowe, warstwowe),
//       łącząc statystyki historyczne z CSV oraz bieżące dane z REST API.
// ============================================================================

import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell,
} from 'recharts';
import '../styles/CityCharts.css';

// Funkcja pomocnicza: zwykłe formatowanie liczb z określoną ilością miejsc po przecinku
const formatowanieLiczby = (wartosc, liczbaMiejsc = 1) => {
  const liczba = Number(wartosc);
  if (!Number.isFinite(liczba)) {
    return '—';
  }
  return new Intl.NumberFormat('pl-PL', {
    maximumFractionDigits: liczbaMiejsc,
    minimumFractionDigits: liczbaMiejsc,
  }).format(liczba);
};

// Funkcja pomocnicza: ładne formatowanie liczb na walutę PLN
const formatowaniePLN = (wartosc) => {
  const liczba = Number(wartosc);
  if (!Number.isFinite(liczba)) {
    return '—';
  }
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    maximumFractionDigits: 2,
  }).format(liczba);
};

// Funkcja pomocnicza: formatowanie jednostek zanieczyszczenia pyłów PM2.5 / PM10
const formatowaniePM = (wartosc) => {
  const liczba = Number(wartosc);
  if (!Number.isFinite(liczba)) {
    return '—';
  }
  return `${formatowanieLiczby(liczba, 1)} µg/m³`;
};

// Funkcja pomocnicza: dodawanie jednostki stopni Celsjusza do temperatury
const formatowanieTemperatury = (wartosc) => {
  const liczba = Number(wartosc);
  if (!Number.isFinite(liczba)) {
    return '—';
  }
  return `${formatowanieLiczby(liczba, 1)}°C`;
};

// Funkcja pomocnicza: formatowanie wartości procentowych
const formatowanieProcentu = (wartosc) => {
  const liczba = Number(wartosc);
  if (!Number.isFinite(liczba)) {
    return '—';
  }
  return `${formatowanieLiczby(liczba, 1)}%`;
};

// Mapowanie i przygotowanie surowych danych z backendu do formatu akceptowanego przez wykresy
const przygotujDane = (dane = []) => {
  return dane.map((pozycja) => {
    const city = pozycja.city || 'Nieznane miasto';
    
    // Pobieramy wartości finansowe i demograficzne (głównie z plików CSV / bazy)
    const wynagrodzenie = Number(pozycja.averageSalary ?? pozycja.wynagrodzenie ?? 0) || 0;
    const kosztyZyciaSurowe = Number(pozycja.costOfLiving ?? pozycja.kosztyZycia ?? 0) || 0;
    const totalPricePLN = Number(pozycja.totalPricePLN ?? 0) || 0;
    const yearlyPM25 = Number(pozycja.yearlyPM25 ?? pozycja.PM25_rok ?? 0) || 0;
    const yearlyTemp = Number(pozycja.yearlyTemp ?? pozycja.Temp_rok ?? 0) || 0;
    const crimeRate = Number(pozycja.crimeRate ?? 0) || 0;
    const qualityOfLifeIndex = Number(pozycja.qualityOfLifeIndex ?? 0) || 0;
    
    // Obliczamy dodatkowe wskaźniki na cele wykresów (np. siła nabywcza czy oszczędności)
    const monthlyPurchaseCapacity = Math.max(wynagrodzenie - kosztyZyciaSurowe - 2000, 1);
    const monthlyAffordability = Number((totalPricePLN / monthlyPurchaseCapacity).toFixed(1));
    const mozliweOszczednosci = Math.max(wynagrodzenie - kosztyZyciaSurowe, 0);
    const kosztyZyciaDoWykresu = Math.min(kosztyZyciaSurowe, wynagrodzenie || kosztyZyciaSurowe);

    return {
      city,
      wynagrodzenie,
      kosztyZyciaSurowe,
      kosztyZyciaDoWykresu,
      mozliweOszczednosci,
      totalPricePLN,
      monthlyAffordability,
      yearlyPM25,
      yearlyTemp,
      crimeRate,
      qualityOfLifeIndex,
    };
  });
};

// Funkcja pomocnicza: sortuje tablicę miast malejąco według poziomu przestępczości
const sortujPoPrzestepczosci = (dane) => {
  return [...dane].sort((pierwszy, drugi) => Number(drugi.crimeRate) - Number(pierwszy.crimeRate));
};

// Komponent własnego okienka z podpowiedzią (Custom Tooltip) wyświetlanego po najechaniu na wykres
const WspolnaPodpowiedz = ({ active, payload, label, formatowanePola }) => {
  // Jeśli myszka nie jest nad wykresem, nic nie wyświetlamy
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-title">{label}</p>
      {payload.map((pozycja) => {
        // Dopasowujemy nazwę wyświetlanego pola na podstawie przekazanej mapy etykiet
        const etykieta = formatowanePola[pozycja.dataKey] || pozycja.name;
        const formatowanie = formatowanePola.__formatowanie || ((wartosc) => wartosc);

        return (
          <div key={pozycja.dataKey} className="chart-tooltip-row">
            <span className="chart-tooltip-key">{etykieta}:</span>
            <span className="chart-tooltip-value">{formatowanie(pozycja.value, pozycja.dataKey)}</span>
          </div>
        );
      })}
    </div>
  );
};

const CityCharts = ({ data = [] }) => {
  // Optymalizacja: cache'ujemy przetworzone dane za pomocą useMemo, by uniknąć re-renderów
  const daneWykresow = useMemo(() => przygotujDane(data), [data]);

  // Osobną posortowaną tablicę dla wykresu bezpieczeństwa trzymamy w osobnym memo
  const danePrzestepczosci = useMemo(() => sortujPoPrzestepczosci(daneWykresow), [daneWykresow]);

  // Widok awaryjny w przypadku braku danych wejściowych
  if (daneWykresow.length === 0) {
    return <p className="charts-empty">Brak danych do wyświetlenia na wykresach.</p>;
  }

  return (
    <div className="charts-layout">
      
      {/* ------------------------------------------------------------------ */}
      {/* WYKRES 1: Potencjał oszczędności (Skumulowany słupkowy - Stacked Bar) */}
      {/* ------------------------------------------------------------------ */}
      <section className="chart-card">
        <header className="chart-card-header">
          <h3>Potencjał Oszczędności (Miesięcznie)</h3>
          <p>Skumulowany wykres pokazujący wynagrodzenie, koszty życia i możliwe oszczędności po odjęciu kosztów życia.</p>
        </header>
        <div className="chart-area">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={daneWykresow} margin={{ top: 16, right: 20, left: 0, bottom: 8 }} barCategoryGap="18%">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="city" tick={{ fill: '#334155', fontSize: 12 }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} />
              <YAxis tick={{ fill: '#334155', fontSize: 12 }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} />
              <Tooltip
                content={
                  <WspolnaPodpowiedz
                    formatowanePola={{
                      wynagrodzenie: 'Wynagrodzenie',
                      kosztyZyciaDoWykresu: 'Koszty życia',
                      mozliweOszczednosci: 'Możliwe oszczędności',
                      __formatowanie: (wartosc, klucz) => {
                        if (klucz === 'wynagrodzenie' || klucz === 'kosztyZyciaDoWykresu' || klucz === 'mozliweOszczednosci') {
                          return formatowaniePLN(wartosc);
                        }
                        return formatowanieLiczby(wartosc);
                      },
                    }}
                  />
                }
              />
              <Legend />
              {/* Użycie tego samego stackId="oszczędności" nakłada słupki na siebie, tworząc skumulowany widok */}
              <Bar dataKey="kosztyZyciaDoWykresu" name="Koszty życia" stackId="oszczędności" fill="#f59e0b" radius={[8, 8, 0, 0]} />
              <Bar dataKey="mozliweOszczednosci" name="Możliwe oszczędności" stackId="oszczędności" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* WYKRES 2: Dostępność mieszkań (Tradycyjny wykres słupkowy - Bar Chart) */}
      {/* ------------------------------------------------------------------ */}
      <section className="chart-card">
        <header className="chart-card-header">
          <h3>Dostępność Mieszkań</h3>
          <p>Pokazuje, ile miesięcy pracy potrzeba na zakup pełnego mieszkania po uwzględnieniu kosztów życia i bufora 2000 zł.</p>
        </header>
        <div className="chart-area">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={daneWykresow} margin={{ top: 16, right: 20, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="city" tick={{ fill: '#334155', fontSize: 12 }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} />
              <YAxis tick={{ fill: '#334155', fontSize: 12 }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} />
              <Tooltip
                content={
                  <WspolnaPodpowiedz
                    formatowanePola={{
                      monthlyAffordability: 'Miesiące pracy na zakup pełnego mieszkania',
                      __formatowanie: (wartosc) => `${formatowanieLiczby(wartosc, 1)} mies.`,
                    }}
                  />
                }
              />
              <Legend />
              <Bar dataKey="monthlyAffordability" name="Miesiące pracy na zakup pełnego mieszkania" fill="#6366f1" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* WYKRES 3: Ekologia PM2.5 (Wykres warstwowy z gradientem - Area Chart) */}
      {/* ------------------------------------------------------------------ */}
      <section className="chart-card">
        <header className="chart-card-header">
          <h3>Zanieczyszczenie powietrza PM2.5 (Średnioroczne)</h3>
          <p>Porównanie rocznego poziomu PM2.5 z linią referencyjną normy WHO.</p>
        </header>
        <div className="chart-area">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={daneWykresow} margin={{ top: 16, right: 20, left: 0, bottom: 8 }}>
              {/* Definiowanie płynnego gradientu wypełnienia dla obszaru zanieczyszczeń (od czerwieni do przezroczystości) */}
              <defs>
                <linearGradient id="gradientPM25" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#b91c1c" stopOpacity={0.75} />
                  <stop offset="95%" stopColor="#b91c1c" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="city" tick={{ fill: '#334155', fontSize: 12 }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} />
              <YAxis tick={{ fill: '#334155', fontSize: 12 }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} />
              <Tooltip content={<WspolnaPodpowiedz formatowanePola={{ yearlyPM25: 'PM2.5', __formatowanie: (wartosc) => formatowaniePM(wartosc) }} />} />
              <Legend />
              {/* Dodanie poziomej linii referencyjnej pokazującej sztywny limit norm światowych WHO (15 µg/m³) */}
              <ReferenceLine
                y={15}
                stroke="#64748b"
                strokeDasharray="5 5"
                label={{ value: 'Norma WHO 15 µg/m³', position: 'insideTopRight', fill: '#475569', fontSize: 12 }}
              />
              <Area type="monotone" dataKey="yearlyPM25" name="PM2.5 roczne" stroke="#b91c1c" strokeWidth={3} fill="url(#gradientPM25)" dot={{ r: 4, fill: '#b91c1c' }} activeDot={{ r: 6 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* WYKRES 4: Klimat i temperatura (Wykres liniowy z gradientem - Line Chart) */}
      {/* ------------------------------------------------------------------ */}
      <section className="chart-card">
        <header className="chart-card-header">
          <h3>Klimat: Średnioroczna Temperatura</h3>
          <p>Estetyczny wykres liniowy pokazujący roczną temperaturę dla miast.</p>
        </header>
        <div className="chart-area">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={daneWykresow} margin={{ top: 16, right: 20, left: 0, bottom: 8 }}>
              {/* Definicja poziomego gradientu kolorów linii (przejście od niebieskiego/zimnego do błękitu) */}
              <defs>
                <linearGradient id="gradientTemperatureLine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#2563eb" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="city" tick={{ fill: '#334155', fontSize: 12 }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} />
              <YAxis tick={{ fill: '#334155', fontSize: 12 }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} />
              <Tooltip content={<WspolnaPodpowiedz formatowanePola={{ yearlyTemp: 'Temperatura', __formatowanie: (wartosc) => formatowanieTemperatury(wartosc) }} />} />
              <Legend />
              <Line type="monotone" dataKey="yearlyTemp" name="Średnioroczna temperatura" stroke="url(#gradientTemperatureLine)" strokeWidth={3} dot={{ r: 4, fill: '#2563eb' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* WYKRES 5: Przestępczość (Posortowany słupkowy z ciemnoczerwonymi komórkami) */}
      {/* ------------------------------------------------------------------ */}
      <section className="chart-card">
        <header className="chart-card-header">
          <h3>Bezpieczeństwo: Wskaźnik Przestępczości</h3>
          <p>Posortowany wykres słupkowy prezentujący średnią liczbę przestępstw na 1000 osób.</p>
        </header>
        <div className="chart-area">
          <ResponsiveContainer width="100%" height="100%">
            {/* Wykres używa tablicy danePrzestępczość, która została wcześniej posortowana malejąco */}
            <BarChart data={danePrzestepczosci} margin={{ top: 16, right: 20, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="city" tick={{ fill: '#334155', fontSize: 12 }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} />
              <YAxis tick={{ fill: '#334155', fontSize: 12 }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} />
              {/* TUTAJ BYŁ BŁĄD Z CHIŃSKIM ZNAKIEM - ZOSTAŁ POPRAWIONY NA "WspólnaPodpowiedź" */}
              <Tooltip content={<WspolnaPodpowiedz formatowanePola={{ crimeRate: 'Średnia na 1000 osób', __formatowanie: (wartosc) => `${formatowanieLiczby(wartosc, 1)} na 1000 osób` }} />} />
              <Legend />
              <Bar dataKey="crimeRate" name="Średnia liczba przestępstw na 1000 osób" radius={[8, 8, 0, 0]}>
                {/* Dynamiczne renderowanie pojedynczych słupków (Cell) o głębokim bordowym kolorze */}
                {danePrzestepczosci.map((pozycja) => (
                  <Cell key={pozycja.city} fill="#7f1d1d" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
      
    </div>
  );
};

export default CityCharts;