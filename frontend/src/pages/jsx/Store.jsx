import { useEffect, useState } from 'react';
import { useAuth } from '../../AuthContext';
import { API_BASE, fetchWithAuth, fetchPublic } from '../../api';
import '../css/Store.css';

export const Store = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const scrollToProducts = () => {
    const productsSection = document.getElementById('store-products');
    if (productsSection) {
      productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const getImageUrl = (image) => {
    if (!image) return null;
    if (image.startsWith('http://') || image.startsWith('https://')) return image;
    if (API_BASE) return `${API_BASE}${image.startsWith('/') ? image : `/${image}`}`;
    return image;
  };

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
          <h1>Tools That Make You More Productive</h1>
          <button
            type="button"
            className="hero-scroll-btn"
            onClick={scrollToProducts}
            aria-label="Scroll to products"
          >
            <svg width="32px" height="32px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fillRule="evenodd" clipRule="evenodd" d="M12 3C12.5523 3 13 3.44772 13 4V17.5858L18.2929 12.2929C18.6834 11.9024 19.3166 11.9024 19.7071 12.2929C20.0976 12.6834 20.0976 13.3166 19.7071 13.7071L12.7071 20.7071C12.3166 21.0976 11.6834 21.0976 11.2929 20.7071L4.29289 13.7071C3.90237 13.3166 3.90237 12.6834 4.29289 12.2929C4.68342 11.9024 5.31658 11.9024 5.70711 12.2929L11 17.5858V4C11 3.44772 11.4477 3 12 3Z" fill="#e0e0e0"></path> </g></svg>
          </button>
          {/* <div className="status">
            {user ? `Signed in as ${user.name || user.email}` : 'Guest session'}
          </div> */}
      </section>

      <section className="products" id="store-products">
        {loading ? (
          <p>Loading products...</p>
        ) : products.length === 0 ? (
          <p>No products available. Admin can add them via the dashboard.</p>
        ) : (
          <div className="product-grid">
            {products.map((product) => (
              <a key={product.id} href={`/item/${product.nfc_tag_id}`} className="card">
                {product.image ? (
                  <div className="card-image-wrap">
                    <img
                      src={getImageUrl(product.image)}
                      alt={product.name}
                      className="card-image"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="card-image-wrap card-image-placeholder">No image</div>
                )}
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
