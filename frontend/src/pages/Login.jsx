import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import '../styles/Login.css';

const Login = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [czyLogowanie, setCzyLogowanie] = useState(true);
  const [formularz, setFormularz] = useState({
    email: '',
    password: '',
  });
  const [blad, setBlad] = useState('');
  const [ladowanie, setLadowanie] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormularz((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const zapiszTokenIPrzekieruj = (token) => {
    if (token) {
      localStorage.setItem('token', token);
    }

    if (typeof onLoginSuccess === 'function') {
      onLoginSuccess();
    }

    navigate('/');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLadowanie(true);
    setBlad('');

    try {
      const endpoint = czyLogowanie ? '/auth/login' : '/auth/register';
      const odpowiedz = await axiosClient.post(endpoint, formularz);

      if (odpowiedz.data?.token) {
        zapiszTokenIPrzekieruj(odpowiedz.data.token);
      } else if (czyLogowanie) {
        setBlad('Nie udało się pobrać tokenu logowania.');
      } else {
        navigate('/');
      }
    } catch (error) {
      setBlad(error.response?.data?.message || 'Wystąpił błąd podczas wysyłania formularza.');
    } finally {
      setLadowanie(false);
    }
  };

  const przełączTryb = () => {
    setCzyLogowanie((poprzedniTryb) => !poprzedniTryb);
    setBlad('');
    setFormularz({
      email: '',
      password: '',
    });
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>{czyLogowanie ? 'Logowanie' : 'Rejestracja'}</h2>

        {blad && <div className="error-message">{blad}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Adres e-mail</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formularz.email}
              onChange={handleInputChange}
              placeholder="np. anna@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Hasło</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formularz.password}
              onChange={handleInputChange}
              placeholder="Wpisz hasło"
              required
              minLength="6"
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={ladowanie}>
            {ladowanie ? 'Proszę czekać...' : czyLogowanie ? 'Zaloguj się' : 'Zarejestruj się'}
          </button>
        </form>

        <p className="toggle-auth">
          {czyLogowanie ? 'Nie masz jeszcze konta? ' : 'Masz już konto? '}
          <button type="button" className="link-btn" onClick={przełączTryb}>
            {czyLogowanie ? 'Przejdź do rejestracji' : 'Przejdź do logowania'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
