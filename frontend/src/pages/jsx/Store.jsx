import { useEffect, useState } from 'react';
import { useAuth } from '../../AuthContext';
import { fetchWithAuth, fetchPublic } from '../../api';
import '../css/Store.css';

export const Store = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        // Try authenticated fetch (works for logged-in users)
        let res = await fetchWithAuth('/api/products/');
        if (!res.ok) {
          // fallback to public fetch for guests
          res = await fetchPublic('/api/products/');
        }
        if (res.ok) {
          const data = await res.json();
          setProducts(data);
        } else {
          console.error('Failed to load products, status:', res.status);
        }
      } catch (error) {
        console.error('Failed to load products:', error);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

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
        {loading ? (
          <p>Loading products...</p>
        ) : products.length === 0 ? (
          <p>No products available. Admin can add them via the dashboard.</p>
        ) : (
          <div className="product-grid">
            {products.map((product) => (
              <a key={product.id} href={`/item/${product.nfc_tag_id}`} className="card">
                <h3>{product.name}</h3>
                <p>${product.price}</p>
                <p className="stock">Stock: {product.stock_quantity}</p>
              </a>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
