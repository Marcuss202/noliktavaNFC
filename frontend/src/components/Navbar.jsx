import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import './Navbar.css';

export const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <header className="navbar">
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
