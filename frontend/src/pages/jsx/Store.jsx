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

      <section className="about-section" id="about">
        <div className="section-inner">
          <span className="about-label">Who we are</span>
          <h2>Built for <span>modern</span> shopping</h2>
          <div className="about-body">
            <div className="about-text">
              <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
              <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
            </div>
            <div className="about-stats">
              <div className="about-stat-card">
                <strong>10k+</strong>
                <span>Happy customers worldwide</span>
              </div>
              <div className="about-stat-card">
                <strong>500+</strong>
                <span>Products available in store</span>
              </div>
              <div className="about-stat-card">
                <strong>99.9%</strong>
                <span>Uptime &amp; reliability</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="contact-section" id="contact">
        <div className="section-inner">
          <span className="contact-label">Get in touch</span>
          <h2>Contact Us</h2>
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.</p>
          <div className="contact-grid">
            <div className="contact-item">
              <div className="contact-item-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <strong>Email</strong>
              <span>hello@fakeshop.com</span>
            </div>
            <div className="contact-item">
              <div className="contact-item-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.64A2 2 0 012.18 1h3a2 2 0 012 1.72c.13.96.36 1.9.71 2.81a2 2 0 01-.45 2.11L6.91 8.09a16 16 0 006 6l.45-.45a2 2 0 012.11-.45c.91.35 1.85.58 2.81.71A2 2 0 0122 16.92z"/>
                </svg>
              </div>
              <strong>Phone</strong>
              <span>+1 (555) 123-4567</span>
            </div>
            <div className="contact-item">
              <div className="contact-item-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
              <strong>Address</strong>
              <span>123 Lorem Street, Ipsum City</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
