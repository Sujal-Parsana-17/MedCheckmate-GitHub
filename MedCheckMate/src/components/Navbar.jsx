import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

const Navbar = ({ theme, toggleTheme }) => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-brand" style={{ cursor: 'pointer', textDecoration: 'none', color: 'inherit' }}>
          <div className="nav-icon">💊</div>
          <span className="nav-title">MedCheckMate</span>
        </Link>
        <div className="nav-links">
          <Link
            to="/"
            className={isActive('/') ? 'active' : ''}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            Home
          </Link>
          <Link
            to="/check"
            className={isActive('/check') ? 'active' : ''}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            Check Medicine
          </Link>
          <Link
            to="/add"
            className={isActive('/add') ? 'active' : ''}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            Test Medicine
          </Link>
          <Link
            to="/about"
            className={isActive('/about') ? 'active' : ''}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            About
          </Link>
          <div className="auth-buttons">
            <Link
              to="/login"
              className="login-btn"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              Login/Sign Up
            </Link>
          </div>
          <button
            onClick={toggleTheme}
            className="theme-toggle-btn"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
