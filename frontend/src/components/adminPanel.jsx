import { useState } from 'react';
import { Navigate, NavLink } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import './adminPanel.css';

export const AdminPanel = ({ children }) => {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  // Redirect if not logged in or not an admin
  if (!user || !user.is_staff) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="adminLayout">
      <aside className="sidePanel">
        <div className="logo">Inventory</div>
        <div className="col">
          <NavLink to="/adminDashboard" className={({isActive}) => `wrapper ${isActive ? 'active' : ''}`}>
            <svg fill="#a5a5a5" width="24px" height="24px" viewBox="0 0 1920 1920" xmlns="http://www.w3.org/2000/svg" stroke="#5c5c5c"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M833.935 1063.327c28.913 170.315 64.038 348.198 83.464 384.79 27.557 51.84 92.047 71.944 144 44.387 51.84-27.558 71.717-92.273 44.16-144.113-19.426-36.593-146.937-165.46-271.624-285.064Zm-43.821-196.405c61.553 56.923 370.899 344.81 415.285 428.612 56.696 106.842 15.811 239.887-91.144 296.697-32.64 17.28-67.765 25.411-102.325 25.411-78.72 0-154.955-42.353-194.371-116.555-44.386-83.802-109.102-501.346-121.638-584.245-3.501-23.717 8.245-47.21 29.365-58.277 21.346-11.294 47.096-8.02 64.828 8.357ZM960.045 281.99c529.355 0 960 430.757 960 960 0 77.139-8.922 153.148-26.654 225.882l-10.39 43.144h-524.386v-112.942h434.258c9.487-50.71 14.231-103.115 14.231-156.084 0-467.125-380.047-847.06-847.059-847.06-467.125 0-847.059 379.935-847.059 847.06 0 52.97 4.744 105.374 14.118 156.084h487.454v112.942H36.977l-10.39-43.144C8.966 1395.137.044 1319.128.044 1241.99c0-529.243 430.645-960 960-960Zm542.547 390.686 79.85 79.85-112.716 112.715-79.85-79.85 112.716-112.715Zm-1085.184 0L530.123 785.39l-79.85 79.85L337.56 752.524l79.849-79.85Zm599.063-201.363v159.473H903.529V471.312h112.942Z" fill-rule="evenodd"></path> </g></svg>
            <h3>Dashboard</h3>
          </NavLink>
          <NavLink to="/adminSales" className={({isActive}) => `wrapper ${isActive ? 'active' : ''}`}>
            <svg version="1.0" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24px" height="24px" viewBox="0 0 64 64" enable-background="new 0 0 64 64" xml:space="preserve" fill="#a5a5a5" stroke="#9e9e9e"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <polygon fill="none" stroke="#9e9e9e" stroke-width="2" stroke-miterlimit="10" points="21.903,5 55,38.097 34.097,59 1,25.903 1,5 "></polygon> <polyline fill="none" stroke="#9e9e9e" stroke-width="2" stroke-miterlimit="10" points="29.903,5 63,38.097 42.097,59 "></polyline> <circle fill="none" stroke="#9e9e9e" stroke-width="2" stroke-miterlimit="10" cx="14" cy="18" r="5"></circle> </g> </g></svg>
            <h3>Sales</h3>
          </NavLink>
          <NavLink to="/adminPurchases" className={({isActive}) => `wrapper ${isActive ? 'active' : ''}`}>
            <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M9 11V6C9 4.34315 10.3431 3 12 3C13.6569 3 15 4.34315 15 6V10.9673M10.4 21H13.6C15.8402 21 16.9603 21 17.816 20.564C18.5686 20.1805 19.1805 19.5686 19.564 18.816C20 17.9603 20 16.8402 20 14.6V12.2C20 11.0799 20 10.5198 19.782 10.092C19.5903 9.71569 19.2843 9.40973 18.908 9.21799C18.4802 9 17.9201 9 16.8 9H7.2C6.0799 9 5.51984 9 5.09202 9.21799C4.71569 9.40973 4.40973 9.71569 4.21799 10.092C4 10.5198 4 11.0799 4 12.2V14.6C4 16.8402 4 17.9603 4.43597 18.816C4.81947 19.5686 5.43139 20.1805 6.18404 20.564C7.03968 21 8.15979 21 10.4 21Z" stroke="#636363" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>
            <h3>Purchases</h3>
          </NavLink>
          <NavLink to="/adminInventory" className={({isActive}) => `wrapper ${isActive ? 'active' : ''}`}>
            <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M20.3873 7.1575L11.9999 12L3.60913 7.14978" stroke="#636363" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M12 12V21" stroke="#636363" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M11 2.57735C11.6188 2.22008 12.3812 2.22008 13 2.57735L19.6603 6.42265C20.2791 6.77992 20.6603 7.44017 20.6603 8.1547V15.8453C20.6603 16.5598 20.2791 17.2201 19.6603 17.5774L13 21.4226C12.3812 21.7799 11.6188 21.7799 11 21.4226L4.33975 17.5774C3.72094 17.2201 3.33975 16.5598 3.33975 15.8453V8.1547C3.33975 7.44017 3.72094 6.77992 4.33975 6.42265L11 2.57735Z" stroke="#636363" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M8.5 4.5L16 9" stroke="#636363" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>
            <h3>Inventory</h3>
          </NavLink>
        </div>
      </aside>

      <div className="mainArea">
        <header className="topBar">
          <input
            type="text"
            className="topBarSearch"
            placeholder="Search..."
            value={searchQuery}
            onChange={handleSearch}
          />
          <div className="topBarUser">
            <span>{user.name || user.email}</span>
            <button onClick={logout} className="pill">Logout</button>
          </div>
        </header>

        <main className="contentArea">
          {children}
        </main>
      </div>
    </div>
  );
};
