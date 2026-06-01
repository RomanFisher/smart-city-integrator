import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import '../styles/Navbar.css';

const Navbar = ({ isLoggedIn = true, onLogout }) => {
  const navigate = useNavigate();

  // Czyści token, aktualizuje stan rodzica i przenosi użytkownika do logowania
  const handleLogout = () => {
    localStorage.removeItem('token');
    if (typeof onLogout === 'function') {
      onLogout();
    }
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <h1 className="navbar-logo">Smart City Integrator</h1>
        <ul className="nav-menu">
          <li className="nav-item">
            <NavLink
              to="/dashboard"
              className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
              end
            >
              Analizy
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink
              to="/profile"
              className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
            >
              Profil
            </NavLink>
          </li>
          {isLoggedIn && (
            <li className="nav-item">
              <button type="button" className="nav-link logout-btn" onClick={handleLogout}>
                Wyloguj
              </button>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
