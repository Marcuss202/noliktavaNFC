import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { API_BASE, fetchWithAuth, fetchPublic } from '../../api';
import { useCart } from '../../CartContext';
import '../css/ItemDetail.css';

export const ItemDetail = () => {
  const { nfc_tag_id } = useParams();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [cartMessage, setCartMessage] = useState('');

  const getImageUrl = (image) => {
    if (!image) return null;
    if (image.startsWith('http://') || image.startsWith('https://')) return image;
    if (API_BASE) return `${API_BASE}${image.startsWith('/') ? image : `/${image}`}`;
    return image;
  };

  const handleAddToCart = () => {
    if (!product || quantity <= 0) return;

    const safeQuantity = Math.min(quantity, Number(product.stock_quantity || 0));
    if (safeQuantity <= 0) {
      setCartMessage('This product is out of stock.');
      return;
    }

    addToCart(product, safeQuantity);
    setCartMessage(`Added ${safeQuantity} item(s) to cart.`);
  };

  useEffect(() => {
    const loadProduct = async () => {
      try {
        let res = await fetchWithAuth(`/api/products/lookup_nfc/?nfc_tag_id=${encodeURIComponent(nfc_tag_id)}`);
        if (!res.ok) {
          res = await fetchPublic(`/api/products/lookup_nfc/?nfc_tag_id=${encodeURIComponent(nfc_tag_id)}`);
        }
        if (res.ok) {
          const data = await res.json();
          setProduct(data);
        } else {
          setError('Product not found');
        }
      } catch (err) {
        setError('Failed to load product: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    loadProduct();
  }, [nfc_tag_id]);

  const backBtn = (
    <Link to="/" className="btn-back-float">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5M12 5l-7 7 7 7"/>
      </svg>
      Back to Store
    </Link>
  );

  if (loading) {
    return (
      <div className="item-detail-page">
        {backBtn}
        <div className="container"><p style={{color:'#fff'}}>Loading...</p></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="item-detail-page">
        {backBtn}
        <div className="container"><div className="error-box">{error}</div></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="item-detail-page">
        {backBtn}
        <div className="container"><div className="error-box">Product not found</div></div>
      </div>
    );
  }

  return (
    <div className="item-detail-page">
      {backBtn}
      <div className="container">
        <div className="detail-card">
          <div className="view-mode">
            <h1>{product.name}</h1>
            <p className="nfc-tag">NFC ID: {product.nfc_tag_id}</p>
            {product.image && (
              <div className="product-image">
                <img src={getImageUrl(product.image)} alt={product.name} />
              </div>
            )}
            <p className="description">{product.description}</p>
            <div className="product-info">
              <div className="info-item">
                <span className="label">Price</span>
                <span className="value">${parseFloat(product.price).toFixed(2)}</span>
              </div>
              <div className="info-item">
                <span className="label">Stock</span>
                <span className="value">{product.stock_quantity} units</span>
              </div>
            </div>

            <div className="customer-actions">
              <div className="cart-controls">
                <label htmlFor="item-quantity">Quantity</label>
                <input
                  id="item-quantity"
                  type="number"
                  min="1"
                  max={Math.max(1, Number(product.stock_quantity || 1))}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value) || 1)}
                />
              </div>
              <button
                type="button"
                className="btn-purchase active"
                disabled={Number(product.stock_quantity) <= 0}
                onClick={handleAddToCart}
              >
                {Number(product.stock_quantity) <= 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
              {cartMessage && <p className="cart-message">{cartMessage}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
