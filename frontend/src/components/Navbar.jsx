import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import './Navbar.css';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const [isLightSection, setIsLightSection] = useState(false);

  useEffect(() => {
    if (pathname !== '/') {
      setIsLightSection(false);
      return;
    }

    const updateNavbarContrast = () => {
      const hero = document.querySelector('.hero');
      if (!hero) {
        setIsLightSection(false);
        return;
      }

      const heroBottom = hero.getBoundingClientRect().bottom;
      setIsLightSection(heroBottom <= 96);
    };

    updateNavbarContrast();
    window.addEventListener('scroll', updateNavbarContrast, { passive: true });
    window.addEventListener('resize', updateNavbarContrast);

    return () => {
      window.removeEventListener('scroll', updateNavbarContrast);
      window.removeEventListener('resize', updateNavbarContrast);
    };
  }, [pathname]);

  return (
    <header className={`navbar ${isLightSection ? 'navbar-light' : ''}`}>
      <div className="nav-container">
        <Link to="/" className="brand">NFC Store</Link>
        <div className="nav-actions">
          {user ? (
            <>
              {user.is_staff && (
                <Link to="/adminDashboard" className="pill">Admin</Link>
              )}
              <span className="pill">{user.name || user.email}</span>
              <button onClick={logout} className="pill">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="pill">Login</Link>
              <Link to="/register" className="pill primary">Register</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
