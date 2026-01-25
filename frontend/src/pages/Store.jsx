import { useAuth } from '../AuthContext';
import './Store.css';

export const Store = () => {
  const { user } = useAuth();

  return (
    <div className="store-page">
      <section className="hero">
        <div className="panel">
          <h1>Welcome to the store</h1>
          <p>Browse items and manage your profile.</p>
          <div className="status">
            {user ? `Signed in as ${user.name || user.email}` : 'Guest session'}
          </div>
        </div>
        <div className="panel">
          <div className="badge">Demo</div>
          <p style={{ marginTop: '10px' }}>
            This uses JWT cookies for authentication. Scan NFC tags to test persistent login.
          </p>
        </div>
      </section>

      <section className="products">
        <div className="product-grid">
          <div className="card">
            <h3>Starter pack</h3>
            <p>Placeholder item. Replace with your catalog.</p>
          </div>
          <div className="card">
            <h3>Adhesive tags</h3>
            <p>Another placeholder item to make it feel store-like.</p>
          </div>
          <div className="card">
            <h3>Readers</h3>
            <p>Premium reader hardware demo tile.</p>
          </div>
        </div>
      </section>
    </div>
  );
};
