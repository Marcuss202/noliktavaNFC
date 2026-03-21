import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useCart } from '../CartContext';
import fakeShopLogo from '../assets/FakeShopLogo.png';
import fakeShopLogoBlack from '../assets/FakeShopLogoBlack.png';
import './Navbar.css';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const { pathname } = useLocation();
  const [isLightSection, setIsLightSection] = useState(false);
  const [isHiddenMobile, setIsHiddenMobile] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const avatarWrapRef = useRef(null);
  const lastScrollYRef = useRef(0);

  const isOnHome = pathname === '/';
  const isAuthRoute = pathname === '/login' || pathname === '/register';
  const isDarkBgRoute = isOnHome || pathname.startsWith('/item/') || isAuthRoute;

  useEffect(() => {
    if (!isOnHome) {
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
  }, [isOnHome]);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handleOutside = (e) => {
      if (avatarWrapRef.current && !avatarWrapRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [dropdownOpen]);

  useEffect(() => {
    const onScroll = () => {
      if (window.innerWidth > 768) {
        setIsHiddenMobile(false);
        return;
      }

      const currentY = window.scrollY;
      const delta = currentY - lastScrollYRef.current;

      if (currentY <= 8 || delta < -6) {
        setIsHiddenMobile(false);
      } else if (delta > 8 && currentY > 40) {
        setIsHiddenMobile(true);
      }

      lastScrollYRef.current = currentY;
    };

    lastScrollYRef.current = window.scrollY;
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  const navClass = `navbar${!isDarkBgRoute ? ' navbar-solid' : isLightSection ? ' navbar-light' : ''}${isHiddenMobile ? ' navbar-hidden-mobile' : ''}`;
  const logoSrc = isLightSection ? fakeShopLogoBlack : fakeShopLogo;

  return (
    <header className={navClass}>
      <div className="nav-container">
        <Link to="/" className="brand">
          <img style={{ height: '64px', width: 'auto' }} src={logoSrc} alt="NFC Store" />
        </Link>
        <div className="nav-actions">
          <Link to="/cart" className="nav-icon-btn" title="Cart">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"/>
              <circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61h9.72a2 2 0 001.99-1.61L23 6H6"/>
            </svg>
            {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
          </Link>
          {user ? (
            <div className="nav-avatar-wrap" ref={avatarWrapRef}>
              <button
                className={`nav-avatar${dropdownOpen ? ' nav-avatar-open' : ''}`}
                onClick={() => setDropdownOpen((o) => !o)}
                title={user.name || user.email}
              >
                {(user.name || user.email || '?')[0].toUpperCase()}
              </button>
              {dropdownOpen && (
                <div className="nav-dropdown">
                  <div className="dropdown-user-info">
                    <span className="dropdown-name">{user.name || user.email}</span>
                  </div>
                  {user.is_staff && (
                    <Link to="/adminDashboard" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                      Admin Panel
                    </Link>
                  )}
                  <button
                    className="dropdown-item dropdown-logout"
                    onClick={() => { logout(); setDropdownOpen(false); }}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
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
