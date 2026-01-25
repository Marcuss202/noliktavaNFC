import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { Navbar } from './components/Navbar';
import { Store } from './pages/Store';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { AdminSales } from './pages/AdminSales';
import { AdminPurchases } from './pages/AdminPurchases';
import { AdminInventory } from './pages/AdminInventory';
import './App.css';

// Protected route wrapper
const ProtectedRoute = ({ children, adminOnly }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && !user.is_staff) return <Navigate to="/" />;
  
  return children;
};

function AppContent() {
  const location = useLocation();
  const hideNavbar = location.pathname.startsWith('/admin');

  return (
    <>
      {!hideNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<Store />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/adminDashboard" element={<ProtectedRoute adminOnly><Dashboard /></ProtectedRoute>} />
        <Route path="/adminSales" element={<ProtectedRoute adminOnly><AdminSales /></ProtectedRoute>} />
        <Route path="/adminPurchases" element={<ProtectedRoute adminOnly><AdminPurchases /></ProtectedRoute>} />
        <Route path="/adminInventory" element={<ProtectedRoute adminOnly><AdminInventory /></ProtectedRoute>} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
