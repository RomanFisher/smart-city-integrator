import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import './App.css';

// Strażnik dostępu do prywatnych podstron
const ProtectedRoute = ({ isLoggedIn }) => {
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  const AppLayout = () => {
    const location = useLocation();
    const pokazNavbar = location.pathname !== '/login' && isLoggedIn;

    return (
      <div className="app">
        {pokazNavbar && <Navbar isLoggedIn={isLoggedIn} onLogout={handleLogout} />}
        <main className="main-content">
          <Routes>
            <Route path="/login" element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <Login onLoginSuccess={handleLoginSuccess} />} />

            <Route element={<ProtectedRoute isLoggedIn={isLoggedIn} />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
            </Route>

            <Route path="/" element={<Navigate to={isLoggedIn ? '/dashboard' : '/login'} replace />} />
            <Route path="*" element={<Navigate to={isLoggedIn ? '/dashboard' : '/login'} replace />} />
          </Routes>
        </main>
      </div>
    );
  };

  return (
    <Router>
      <AppLayout />
    </Router>
  );
}

export default App;
