import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { Navbar } from './components/Navbar';
import { Store } from './pages/jsx/Store';
import { ItemDetail } from './pages/jsx/ItemDetail';
import { Login } from './pages/jsx/Login';
import { Register } from './pages/jsx/Register';
import { Dashboard } from './pages/jsx/Dashboard';
import { AdminSales } from './pages/jsx/AdminSales';
import { AdminPurchases } from './pages/jsx/AdminPurchases';
import { AdminInventory } from './pages/jsx/AdminInventory';
import { AdminProductEdit } from './pages/jsx/AdminProductEdit';
import { NFCRedirect } from './pages/jsx/NFCRedirect';
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
  const hideNavbar = location.pathname.startsWith('/admin') || location.pathname.startsWith('/nfc');

  return (
    <>
      {!hideNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<Store />} />
        <Route path="/nfc/:nfc_tag_id" element={<NFCRedirect />} />
        <Route path="/item/:nfc_tag_id" element={<ItemDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/adminDashboard" element={<ProtectedRoute adminOnly><Dashboard /></ProtectedRoute>} />
        <Route path="/adminSales" element={<ProtectedRoute adminOnly><AdminSales /></ProtectedRoute>} />
        <Route path="/adminPurchases" element={<ProtectedRoute adminOnly><AdminPurchases /></ProtectedRoute>} />
        <Route path="/adminInventory" element={<ProtectedRoute adminOnly><AdminInventory /></ProtectedRoute>} />
        <Route path="/adminInventory/:id" element={<ProtectedRoute adminOnly><AdminProductEdit /></ProtectedRoute>} />
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
