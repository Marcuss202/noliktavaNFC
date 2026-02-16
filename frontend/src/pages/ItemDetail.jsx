import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { fetchWithAuth, fetchPublic } from '../api';
import './ItemDetail.css';

export const ItemDetail = () => {
  const { nfc_tag_id } = useParams();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (loading) {
    return (
      <div className="item-detail-page">
        <div className="container">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="item-detail-page">
        <div className="container">
          <div className="error-box">{error}</div>
          <Link to="/" className="btn-back">Back to Store</Link>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="item-detail-page">
        <div className="container">
          <div className="error-box">Product not found</div>
          <Link to="/" className="btn-back">Back to Store</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="item-detail-page">
      <div className="container">
        <Link to="/" className="btn-back">← Back to Store</Link>

        <div className="detail-card">
          <div className="view-mode">
            <h1>{product.name}</h1>
            <p className="nfc-tag">NFC ID: {product.nfc_tag_id}</p>
            {product.image && (
              <div className="product-image">
                <img src={product.image} alt={product.name} />
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
              <button className="btn-purchase" disabled>Add to Cart (Coming Soon)</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
