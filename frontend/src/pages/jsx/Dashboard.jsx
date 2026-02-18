import { Navigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { AdminPanel } from '../../components/adminPanel';
import '../css/Dashboard.css';

export const Dashboard = () => {
  const { user } = useAuth();

  // Redirect if not logged in or not an admin
  if (!user || !user.is_staff) {
    return <Navigate to="/" replace />;
  }

  return (
    <AdminPanel>
      <div className="activity">
        
      </div>
    </AdminPanel>
  );
};