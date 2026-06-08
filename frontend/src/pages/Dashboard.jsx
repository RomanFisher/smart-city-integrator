// ============================================================================
// OPIS: Główny panel użytkownika. Zarządza stanem aplikacji,
//       integruje komunikację z backendem (REST API) oraz koordynuje 
//       przełączanie widoków między kartami, wykresami a mapą.
// ============================================================================

import React, { useEffect, useMemo, useState } from 'react';
import axiosClient from '../api/axiosClient'; // Nasz klient axios z zapisanym tokenem JWT
import CityResultCard from '../components/CityResultCard';
import CityCharts from '../components/CityCharts';
import CityMap from '../components/CityMap';
import '../styles/Dashboard.css';

const Dashboard = () => {
  // Stany komponentu (React States) do zarządzania danymi i interfejsem
  const [cities, setCities] = useState([]);               // Pobrana z backendu lista raportów dla miast
  const [selectedCities, setSelectedCities] = useState([]); // Lista miast aktualnie zaznaczonych w filtrze
  const [viewMode, setViewMode] = useState('cards');      // Tryb wyświetlania: 'cards', 'charts', 'map'
  const [searchTerm, setSearchTerm] = useState('');        // Wyszukiwany tekst w pasku wyszukiwania
  const [loading, setLoading] = useState(false);          // Status ładowania analizy danych
  const [exportLoading, setExportLoading] = useState(false); // Status ładowania pobierania pliku XML
  const [error, setError] = useState('');                 // Komunikat o ewentualnym błędzie
  const [isMobile, setIsMobile] = useState(false);        // Czy użytkownik przegląda stronę na telefonie

  // Hook useEffect: nasłuchiwanie rozmiaru okna dla zachowania pełnej responsywności (RWD)
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    handleResize(); // Sprawdzenie na starcie
    window.addEventListener('resize', handleResize); // Dodanie listenera okna

    return () => {
      window.removeEventListener('resize', handleResize); // Czyszczenie listenera przy demontażu
    };
  }, []);

  // Hook useEffect: po pobraniu nowych miast automatycznie zaznaczamy wszystkie jako aktywne
  useEffect(() => {
    if (cities.length > 0) {
      setSelectedCities(cities.map((city) => city.city));
    } else {
      setSelectedCities([]);
    }
  }, [cities]);

  // useMemo: wyciągamy same nazwy miast, które są dostępne w pobranym raporcie
  const availableCityNames = useMemo(() => {
    return cities.map((city) => city.city).filter(Boolean);
  }, [cities]);

  // useMemo: filtrowanie nazw miast w boksie filtrów na podstawie wpisanego tekstu (Search bar)
  const visibleCityNames = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return availableCityNames.filter((cityName) => {
      return normalizedSearch === '' || cityName.toLowerCase().includes(normalizedSearch);
    });
  }, [availableCityNames, searchTerm]);

  // useMemo: końcowa lista miast przekazywana do wykresów i mapy (tylko te zaznaczone checkboxami)
  const filteredCities = useMemo(() => {
    if (selectedCities.length === 0) {
      return [];
    }
    return cities.filter((city) => selectedCities.includes(city.city));
  }, [cities, selectedCities]);

  // Wywołanie REST API: żądanie uruchomienia integracji i analizy danych na backendzie
  const handleAnalyzeData = async () => {
    setLoading(true);
    setError('');

    try {
      // Wysyłamy żądanie GET do zabezpieczonego endpointu /data/analyze
      const response = await axiosClient.get('/data/analyze');
      const listaMiast = response.data?.reports || [];

      setCities(listaMiast); // Zapisujemy wyniki do stanu
      setViewMode('cards');  // Po udanej analizie domyślnie pokazujemy karty
    } catch (err) {
      setError(err.response?.data?.message || 'Nie udało się uruchomić analizy danych.');
    } finally {
      setLoading(false);
    }
  };

  // Wywołanie REST API: pobieranie binarnego pliku XML z raportem
  const handleExportXml = async () => {
    setExportLoading(true);
    setError('');

    try {
      // Kluczowe ustawienie responseType na 'blob' pozwala odebrać strumień pliku zamiast JSON-a
      const response = await axiosClient.get('/data/export', {
        responseType: 'blob',
      });

      // Tworzymy obiekt Blob z danymi pliku XML i wymuszamy kodowanie UTF-8
      const blob = new Blob([response.data], { type: 'application/xml;charset=utf-8' });
      const url = window.URL.createObjectURL(blob); // Generujemy tymczasowy link lokalny do pliku
      const link = document.createElement('a');     // Tworzymy ukryty element linku w HTML

      link.href = url;
      link.setAttribute('download', 'raporty.xml'); // Ustalamy nazwę pobieranego pliku
      document.body.appendChild(link);
      link.click(); // Automatycznie symulujemy kliknięcie użytkownika, by wywołać pobieranie
      link.remove(); // Czyścimy strukturę DOM
      window.URL.revokeObjectURL(url); // Zwalniamy pamięć podręczną przeglądarki
    } catch (err) {
      setError(err.response?.data?.message || 'Nie udało się wyeksportować danych do XML.');
    } finally {
      setExportLoading(false);
    }
  };

  // Włączanie lub wyłączanie pojedynczego miasta z porównania (kliknięcie w chip/checkbox)
  const handleCityToggle = (cityName) => {
    setSelectedCities((previousSelectedCities) => {
      if (previousSelectedCities.includes(cityName)) {
        return previousSelectedCities.filter((selectedCity) => selectedCity !== cityName);
      }
      return [...previousSelectedCities, cityName];
    });
  };

  // Zaznaczenie wszystkich dostępnych miast na raz
  const handleSelectAllCities = () => {
    setSelectedCities(availableCityNames);
  };

  // Odznaczenie wszystkich miast (wyczyszczenie filtrów)
  const handleClearCities = () => {
    setSelectedCities([]);
  };

  // =========================================================================
  // WARSTWA STYLIZACJI: Style inline do obsługi responsywności (Mobile/RWD)
  // =========================================================================
  const dashboardStyle = {
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,
    boxSizing: 'border-box',
    overflowX: 'hidden',
  };

  const sectionStyle = {
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,
    boxSizing: 'border-box',
    wordBreak: 'break-word',
  };

  const actionButtonsStyle = {
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    alignItems: isMobile ? 'stretch' : 'center',
    justifyContent: 'flex-start',
    gap: '12px',
    flexWrap: 'wrap',
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,
    boxSizing: 'border-box',
  };

  const viewSelectorStyle = {
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    alignItems: isMobile ? 'stretch' : 'center',
    justifyContent: 'flex-start',
    gap: '8px',
    marginBottom: '18px',
    padding: '6px',
    background: '#f1f5f9',
    borderRadius: '999px',
    border: '1px solid var(--border-color)',
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,
    boxSizing: 'border-box',
  };

  const filterCardStyle = {
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,
    boxSizing: 'border-box',
    marginTop: '18px',
    marginBottom: '18px',
    padding: '18px',
    border: '1px solid var(--border-color)',
    borderRadius: '14px',
    background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
    wordBreak: 'break-word',
  };

  const searchFilterBarStyle = {
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    alignItems: isMobile ? 'stretch' : 'center',
    gap: '8px',
    marginBottom: '18px',
    padding: '6px',
    background: '#f1f5f9',
    borderRadius: '999px',
    border: '1px solid var(--border-color)',
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,
    boxSizing: 'border-box',
  };

  const searchInputStyle = {
    flex: 1,
    minWidth: 0,
    border: 'none',
    outline: 'none',
    background: '#ffffff',
    color: 'var(--text-color)',
    borderRadius: '999px',
    padding: '10px 16px',
    fontSize: '0.95rem',
    boxShadow: 'inset 0 1px 2px rgba(15, 23, 42, 0.03)',
  };

  const filterHeaderStyle = {
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    alignItems: isMobile ? 'stretch' : 'center',
    justifyContent: 'space-between',
    gap: '16px',
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,
    boxSizing: 'border-box',
    marginBottom: '14px',
  };

  const filterActionsStyle = {
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    alignItems: isMobile ? 'stretch' : 'center',
    gap: '10px',
    flexWrap: 'wrap',
    width: isMobile ? '100%' : 'auto',
    maxWidth: '100%',
    minWidth: 0,
    boxSizing: 'border-box',
  };

  const filterListStyle = {
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    flexWrap: 'wrap',
    gap: '10px',
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,
    boxSizing: 'border-box',
  };

  const resultsGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,
    boxSizing: 'border-box',
    alignItems: 'stretch',
    marginTop: '20px',
  };

  const resultsViewContainerStyle = {
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,
    boxSizing: 'border-box',
    marginTop: '8px',
  };

  const cardButtonStyle = {
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box',
    whiteSpace: 'nowrap',
  };

  // =========================================================================
  // RENDEROWANIE INTERFEJSU (JSX)
  // =========================================================================
  return (
    <div className="dashboard-container" style={dashboardStyle}>
      <h1>Panel główny</h1>

      {/* SEKCJA 1: Przyciski akcji (Uruchomienie integracji REST oraz Eksport XML) */}
      <section className="analysis-section" style={sectionStyle}>
        <h2>Analiza danych miast</h2>
        {error && <div className="error-message">{error}</div>}

        <div className="dashboard-actions" style={actionButtonsStyle}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleAnalyzeData}
            disabled={loading || exportLoading}
            style={cardButtonStyle}
          >
            {loading ? 'Trwa analiza...' : 'Uruchom analizę'}
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleExportXml}
            disabled={loading || exportLoading}
            style={cardButtonStyle}
          >
            {exportLoading ? 'Eksportowanie...' : 'Eksportuj do XML'}
          </button>
        </div>

        {loading && <p>Trwa pobieranie i przeliczanie danych...</p>}
      </section>

      {/* SEKCJA 2: Filtry, paski wyszukiwania i przełącznik widoków tablicowych */}
      <section className="results-section" style={sectionStyle}>
        <h2>Wyniki analizy</h2>

        {cities.length > 0 && (
          <>
            {/* Przełącznik widoków: Karty / Wykresy / Mapa */}
            <div className="view-selector" style={viewSelectorStyle} role="tablist" aria-label="Tryb prezentacji wyników">
              <button
                type="button"
                className={`view-selector-btn ${viewMode === 'cards' ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation(); // Blokuje przypadkowe przekierowanie
                  setViewMode('cards');
                }}
                style={cardButtonStyle}
              >
                Karty
              </button>
              <button
                type="button"
                className={`view-selector-btn ${viewMode === 'charts' ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation(); // Blokuje przypadkowe przekierowanie
                  setViewMode('charts');
                }}
                style={cardButtonStyle}
              >
                Wykresy
              </button>
              <button
                type="button"
                className={`view-selector-btn ${viewMode === 'map' ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation(); // Blokuje przypadkowe przekierowanie
                  setViewMode('map');
                }}
                style={cardButtonStyle}
              >
                Mapa
              </button>
            </div>

            {/* Pasek dynamicznego wyszukiwania miast wpisywanego z klawiatury */}
            <div className="dashboard-search-filter" style={searchFilterBarStyle}>
              <input
                type="search"
                className="dashboard-control dashboard-control-input"
                placeholder="Szukaj miasta..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                style={searchInputStyle}
              />
            </div>

            {/* Panel checkboxów/chipsów do włączania i wyłączania miast z porównania */}
            <div className="city-filter-section" style={filterCardStyle}>
              <div className="city-filter-header" style={filterHeaderStyle}>
                <h3>Porównaj wybrane miasta</h3>
                <div className="city-filter-actions" style={filterActionsStyle}>
                  <button type="button" className="btn btn-secondary" onClick={handleSelectAllCities} style={cardButtonStyle}>
                    Zaznacz wszystkie
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={handleClearCities} style={cardButtonStyle}>
                    Wyczyść zaznaczenie
                  </button>
                </div>
              </div>

              <div className="city-filter-list" style={filterListStyle}>
                {visibleCityNames.map((cityName) => {
                  const isSelected = selectedCities.includes(cityName);

                  return (
                    <label key={cityName} className={`city-filter-chip ${isSelected ? 'active' : ''}`}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleCityToggle(cityName)}
                      />
                      <span>{cityName}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Instrukcje i warunki renderowania komunikatów dla użytkownika */}
        {cities.length === 0 && !loading && (
          <p>Nie uruchomiono jeszcze analizy. Kliknij „Uruchom analizę”, aby pobrać dane.</p>
        )}

        {cities.length > 0 && filteredCities.length === 0 && (
          <p>Nie wybrano żadnego miasta do porównania. Zaznacz co najmniej jedno miasto.</p>
        )}

        {/* WARUNKOWE RENDEROWANIE WIDOKÓW (Wymóg złożonej warstwy prezentacji) */}
        {/* WIDOK A: Siatka tradycyjnych kart (CityResultCard) */}
        {cities.length > 0 && filteredCities.length > 0 && viewMode === 'cards' && (
          <div className="results-grid" style={resultsGridStyle}>
            {filteredCities.map((report) => (
              <CityResultCard
                key={report.id}
                city={report.city}
                data={{ analysisData: report }}
              />
            ))}
          </div>
        )}

        {/* WIDOK B: Adaptacyjne wykresy (CityCharts) */}
        {cities.length > 0 && filteredCities.length > 0 && viewMode === 'charts' && (
          <div className="results-view-container" style={resultsViewContainerStyle}>
            <CityCharts data={filteredCities} />
          </div>
        )}

        {/* WIDOK C: Interaktywna mapa (CityMap) */}
        {cities.length > 0 && filteredCities.length > 0 && viewMode === 'map' && (
          <div className="results-view-container" style={resultsViewContainerStyle}>
            <CityMap data={filteredCities} />
          </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard;