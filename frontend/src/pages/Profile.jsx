import React, { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';
import '../styles/Profile.css';

const Profile = () => {
  const [formularz, setFormularz] = useState({
    targetSqm: 50,
    rooms: 2,
    maxBudgetPLN: 700000,
  });
  const [ladowanie, setLadowanie] = useState(true);
  const [wysylanie, setWysylanie] = useState(false);
  const [komunikatSukcesu, setKomunikatSukcesu] = useState('');
  const [komunikatBledu, setKomunikatBledu] = useState('');

  useEffect(() => {
    // Pobieramy aktualne preferencje użytkownika po wejściu na stronę
    const pobierzPreferencje = async () => {
      try {
        setLadowanie(true);
        setKomunikatBledu('');

        const odpowiedz = await axiosClient.get('/data/preferences');
        const preferences = odpowiedz.data?.preferences || {};

        setFormularz({
          targetSqm: preferences.targetSqm ?? 50,
          rooms: preferences.rooms ?? 2,
          maxBudgetPLN: preferences.maxBudgetPLN ?? 700000,
        });
      } catch (error) {
        setKomunikatBledu(
          error.response?.data?.message || 'Nie udało się pobrać preferencji użytkownika.'
        );
      } finally {
        setLadowanie(false);
      }
    };

    pobierzPreferencje();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormularz((poprzedniStan) => ({
      ...poprzedniStan,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setWysylanie(true);
    setKomunikatSukcesu('');
    setKomunikatBledu('');

    try {
      await axiosClient.put('/data/preferences', {
        targetSqm: Number(formularz.targetSqm),
        rooms: Number(formularz.rooms),
        maxBudgetPLN: Number(formularz.maxBudgetPLN),
      });

      setKomunikatSukcesu('Preferencje zostały zapisane pomyślnie.');
    } catch (error) {
      setKomunikatBledu(
        error.response?.data?.message || 'Nie udało się zaktualizować preferencji użytkownika.'
      );
    } finally {
      setWysylanie(false);
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-box">
        <h2>Profil użytkownika</h2>

        {ladowanie && <div className="success-message">Ładowanie preferencji użytkownika...</div>}
        {komunikatSukcesu && <div className="success-message">{komunikatSukcesu}</div>}
        {komunikatBledu && <div className="error-message">{komunikatBledu}</div>}

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label htmlFor="targetSqm">Pożądany metraż (m²)</label>
            <input
              type="number"
              id="targetSqm"
              name="targetSqm"
              min="1"
              step="1"
              value={formularz.targetSqm}
              onChange={handleInputChange}
              disabled={ladowanie}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="rooms">Liczba pokoi</label>
            <input
              type="number"
              id="rooms"
              name="rooms"
              min="1"
              step="1"
              value={formularz.rooms}
              onChange={handleInputChange}
              disabled={ladowanie}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="maxBudgetPLN">Maksymalny budżet w PLN</label>
            <input
              type="number"
              id="maxBudgetPLN"
              name="maxBudgetPLN"
              min="0"
              step="1"
              value={formularz.maxBudgetPLN}
              onChange={handleInputChange}
              disabled={ladowanie}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={ladowanie || wysylanie}>
            {wysylanie ? 'Zapisywanie...' : 'Zapisz preferencje'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
