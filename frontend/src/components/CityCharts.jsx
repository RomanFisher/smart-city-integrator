import React, { useMemo } from 'react';
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

const formatowanieLiczby = (wartość, liczbaMiejsc = 1) => {
  const liczba = Number(wartość);
  if (!Number.isFinite(liczba)) {
    return '—';
  }

  return new Intl.NumberFormat('pl-PL', {
    maximumFractionDigits: liczbaMiejsc,
    minimumFractionDigits: liczbaMiejsc,
  }).format(liczba);
};

const formatowaniePLN = (wartość) => {
  const liczba = Number(wartość);
  if (!Number.isFinite(liczba)) {
    return '—';
  }

  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    maximumFractionDigits: 2,
  }).format(liczba);
};

const formatowaniePM = (wartość) => {
  const liczba = Number(wartość);
  if (!Number.isFinite(liczba)) {
    return '—';
  }

  return `${formatowanieLiczby(liczba, 1)} µg/m³`;
};

const formatowanieTemperatury = (wartość) => {
  const liczba = Number(wartość);
  if (!Number.isFinite(liczba)) {
    return '—';
  }

  return `${formatowanieLiczby(liczba, 1)}°C`;
};

const formatowanieProcentu = (wartość) => {
  const liczba = Number(wartość);
  if (!Number.isFinite(liczba)) {
    return '—';
  }

  return `${formatowanieLiczby(liczba, 1)}%`;
};

const przygotujDane = (dane = []) => {
  return dane.map((pozycja) => {
    const city = pozycja.city || 'Nieznane miasto';
    const wynagrodzenie = Number(pozycja.averageSalary ?? pozycja.wynagrodzenie ?? 0) || 0;
    const kosztyZyciaSurowe = Number(pozycja.costOfLiving ?? pozycja.kosztyZycia ?? 0) || 0;
    const totalPricePLN = Number(pozycja.totalPricePLN ?? 0) || 0;
    const yearlyPM25 = Number(pozycja.yearlyPM25 ?? pozycja.PM25_rok ?? 0) || 0;
    const yearlyTemp = Number(pozycja.yearlyTemp ?? pozycja.Temp_rok ?? 0) || 0;
    const crimeRate = Number(pozycja.crimeRate ?? 0) || 0;
    const qualityOfLifeIndex = Number(pozycja.qualityOfLifeIndex ?? 0) || 0;
    const monthlyPurchaseCapacity = Math.max(wynagrodzenie - kosztyZyciaSurowe - 2000, 1);
    const monthlyAffordability = Number((totalPricePLN / monthlyPurchaseCapacity).toFixed(1));
    const możliweOszczędności = Math.max(wynagrodzenie - kosztyZyciaSurowe, 0);
    const kosztyZyciaDoWykresu = Math.min(kosztyZyciaSurowe, wynagrodzenie || kosztyZyciaSurowe);

    return {
      city,
      wynagrodzenie,
      kosztyZyciaSurowe,
      kosztyZyciaDoWykresu,
      możliweOszczędności,
      totalPricePLN,
      monthlyAffordability,
      yearlyPM25,
      yearlyTemp,
      crimeRate,
      qualityOfLifeIndex,
    };
  });
};

const sortujPoPrzestępczości = (dane) => {
  return [...dane].sort((pierwszy, drugi) => Number(drugi.crimeRate) - Number(pierwszy.crimeRate));
};

const WspólnaPodpowiedź = ({ active, payload, label, formatowanePola }) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-title">{label}</p>
      {payload.map((pozycja) => {
        const etykieta = formatowanePola[pozycja.dataKey] || pozycja.name;
        const formatowanie = formatowanePola.__formatowanie || ((wartość) => wartość);

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
  const daneWykresów = useMemo(() => przygotujDane(data), [data]);

  const danePrzestępczość = useMemo(() => sortujPoPrzestępczości(daneWykresów), [daneWykresów]);

  if (daneWykresów.length === 0) {
    return <p className="charts-empty">Brak danych do wyświetlenia na wykresach.</p>;
  }

  return (
    <div className="charts-layout">
      <section className="chart-card">
        <header className="chart-card-header">
          <h3>Potencjał Oszczędności (Miesięcznie)</h3>
          <p>Skumulowany wykres pokazujący wynagrodzenie, koszty życia i możliwe oszczędności po odjęciu kosztów życia.</p>
        </header>
        <div className="chart-area">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={daneWykresów} margin={{ top: 16, right: 20, left: 0, bottom: 8 }} barCategoryGap="18%">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="city" tick={{ fill: '#334155', fontSize: 12 }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} />
              <YAxis tick={{ fill: '#334155', fontSize: 12 }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} />
              <Tooltip
                content={
                  <WspólnaPodpowiedź
                    formatowanePola={{
                      wynagrodzenie: 'Wynagrodzenie',
                      kosztyZyciaDoWykresu: 'Koszty życia',
                      możliweOszczędności: 'Możliwe oszczędności',
                        __formatowanie: (wartość, klucz) => {
                          if (klucz === 'wynagrodzenie' || klucz === 'kosztyZyciaDoWykresu' || klucz === 'możliweOszczędności') {
                          return formatowaniePLN(wartość);
                        }

                        return formatowanieLiczby(wartość);
                      },
                    }}
                  />
                }
              />
              <Legend />
              <Bar dataKey="kosztyZyciaDoWykresu" name="Koszty życia" stackId="oszczędności" fill="#f59e0b" radius={[8, 8, 0, 0]} />
              <Bar dataKey="możliweOszczędności" name="Możliwe oszczędności" stackId="oszczędności" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="chart-card">
        <header className="chart-card-header">
          <h3>Dostępność Mieszkań</h3>
          <p>Pokazuje, ile miesięcy pracy potrzeba na zakup pełnego mieszkania po uwzględnieniu kosztów życia i bufora 2000 zł.</p>
        </header>
        <div className="chart-area">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={daneWykresów} margin={{ top: 16, right: 20, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="city" tick={{ fill: '#334155', fontSize: 12 }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} />
              <YAxis tick={{ fill: '#334155', fontSize: 12 }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} />
              <Tooltip
                content={
                  <WspólnaPodpowiedź
                    formatowanePola={{
                      monthlyAffordability: 'Miesiące pracy na zakup pełnego mieszkania',
                      __formatowanie: (wartość) => `${formatowanieLiczby(wartość, 1)} mies.`,
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

      <section className="chart-card">
        <header className="chart-card-header">
          <h3>Zanieczyszczenie powietrza PM2.5 (Średnioroczne)</h3>
          <p>Porównanie rocznego poziomu PM2.5 z linią referencyjną normy WHO.</p>
        </header>
        <div className="chart-area">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={daneWykresów} margin={{ top: 16, right: 20, left: 0, bottom: 8 }}>
              <defs>
                <linearGradient id="gradientPM25" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#b91c1c" stopOpacity={0.75} />
                  <stop offset="95%" stopColor="#b91c1c" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="city" tick={{ fill: '#334155', fontSize: 12 }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} />
              <YAxis tick={{ fill: '#334155', fontSize: 12 }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} />
              <Tooltip content={<WspólnaPodpowiedź formatowanePola={{ yearlyPM25: 'PM2.5', __formatowanie: (wartość) => formatowaniePM(wartość) }} />} />
              <Legend />
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

      <section className="chart-card">
        <header className="chart-card-header">
          <h3>Klimat: Średnioroczna Temperatura</h3>
          <p>Estetyczny wykres liniowy pokazujący roczną temperaturę dla miast.</p>
        </header>
        <div className="chart-area">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={daneWykresów} margin={{ top: 16, right: 20, left: 0, bottom: 8 }}>
              <defs>
                <linearGradient id="gradientTemperatureLine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#2563eb" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="city" tick={{ fill: '#334155', fontSize: 12 }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} />
              <YAxis tick={{ fill: '#334155', fontSize: 12 }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} />
              <Tooltip content={<WspólnaPodpowiedź formatowanePola={{ yearlyTemp: 'Temperatura', __formatowanie: (wartość) => formatowanieTemperatury(wartość) }} />} />
              <Legend />
              <Line type="monotone" dataKey="yearlyTemp" name="Średnioroczna temperatura" stroke="url(#gradientTemperatureLine)" strokeWidth={3} dot={{ r: 4, fill: '#2563eb' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="chart-card">
        <header className="chart-card-header">
          <h3>Bezpieczeństwo: Wskaźnik Przestępczości</h3>
          <p>Posortowany wykres słupkowy prezentujący średnią liczbę przestępstw na 1000 osób.</p>
        </header>
        <div className="chart-area">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={danePrzestępczość} margin={{ top: 16, right: 20, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="city" tick={{ fill: '#334155', fontSize: 12 }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} />
              <YAxis tick={{ fill: '#334155', fontSize: 12 }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} />
              <Tooltip content={<WspólnaPodpowiedź formatowanePola={{ crimeRate: 'Średnia na 1000 osób', __formatowanie: (wartość) => `${formatowanieLiczby(wartość, 1)} na 1000 osób` }} />} />
              <Legend />
              <Bar dataKey="crimeRate" name="Średnia liczba przestępstw na 1000 osób" radius={[8, 8, 0, 0]}>
                {danePrzestępczość.map((pozycja) => (
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
