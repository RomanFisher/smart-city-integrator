import React, { useEffect, useMemo, useState } from 'react';
import axiosClient from '../api/axiosClient';
import CityResultCard from '../components/CityResultCard';
import CityCharts from '../components/CityCharts';
import CityMap from '../components/CityMap';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const [cities, setCities] = useState([]);
  const [selectedCities, setSelectedCities] = useState([]);
  const [viewMode, setViewMode] = useState('cards');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [error, setError] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (cities.length > 0) {
      setSelectedCities(cities.map((city) => city.city));
    } else {
      setSelectedCities([]);
    }
  }, [cities]);

  const availableCityNames = useMemo(() => {
    return cities.map((city) => city.city).filter(Boolean);
  }, [cities]);

  const visibleCityNames = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return availableCityNames.filter((cityName) => {
      return normalizedSearch === '' || cityName.toLowerCase().includes(normalizedSearch);
    });
  }, [availableCityNames, searchTerm]);

  const filteredCities = useMemo(() => {
    if (selectedCities.length === 0) {
      return [];
    }

    return cities.filter((city) => selectedCities.includes(city.city));
  }, [cities, selectedCities]);

  const handleAnalyzeData = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await axiosClient.get('/data/analyze');
      const listaMiast = response.data?.reports || [];

      setCities(listaMiast);
      setViewMode('cards');
    } catch (err) {
      setError(err.response?.data?.message || 'Nie udało się uruchomić analizy danych.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportXml = async () => {
    setExportLoading(true);
    setError('');

    try {
      const response = await axiosClient.get('/data/export', {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'application/xml;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = url;
      link.setAttribute('download', 'raporty.xml');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.message || 'Nie udało się wyeksportować danych do XML.');
    } finally {
      setExportLoading(false);
    }
  };

  const handleCityToggle = (cityName) => {
    setSelectedCities((previousSelectedCities) => {
      if (previousSelectedCities.includes(cityName)) {
        return previousSelectedCities.filter((selectedCity) => selectedCity !== cityName);
      }

      return [...previousSelectedCities, cityName];
    });
  };

  const handleSelectAllCities = () => {
    setSelectedCities(availableCityNames);
  };

  const handleClearCities = () => {
    setSelectedCities([]);
  };

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

  return (
    <div className="dashboard-container" style={dashboardStyle}>
      <h1>Panel główny</h1>

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

      <section className="results-section" style={sectionStyle}>
        <h2>Wyniki analizy</h2>

        {cities.length > 0 && (
          <>
            <div className="view-selector" style={viewSelectorStyle} role="tablist" aria-label="Tryb prezentacji wyników">
              <button
                type="button"
                className={`view-selector-btn ${viewMode === 'cards' ? 'active' : ''}`}
                onClick={() => setViewMode('cards')}
                style={cardButtonStyle}
              >
                Karty
              </button>
              <button
                type="button"
                className={`view-selector-btn ${viewMode === 'charts' ? 'active' : ''}`}
                onClick={() => setViewMode('charts')}
                style={cardButtonStyle}
              >
                Wykresy
              </button>
              <button
                type="button"
                className={`view-selector-btn ${viewMode === 'map' ? 'active' : ''}`}
                onClick={() => setViewMode('map')}
                style={cardButtonStyle}
              >
                Mapa
              </button>
            </div>

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

        {cities.length === 0 && !loading && (
          <p>Nie uruchomiono jeszcze analizy. Kliknij „Uruchom analizę”, aby pobrać dane.</p>
        )}

        {cities.length > 0 && filteredCities.length === 0 && (
          <p>Nie wybrano żadnego miasta do porównania. Zaznacz co najmniej jedno miasto.</p>
        )}

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

        {cities.length > 0 && filteredCities.length > 0 && viewMode === 'charts' && (
          <div className="results-view-container" style={resultsViewContainerStyle}>
            <CityCharts data={filteredCities} />
          </div>
        )}

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
