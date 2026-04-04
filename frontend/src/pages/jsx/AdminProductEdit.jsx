import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchWithAuth } from '../../api';
import { AdminPanel } from '../../components/adminPanel';
import '../css/AdminInventory.css';
import '../css/AdminProductEdit.css';

export const AdminProductEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    stock_quantity: '',
    nfc_tag_id: '',
    description: '',
    image: null,
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      const res = await fetchWithAuth(`/api/products/${id}/`);
      if (res.ok) {
        const data = await res.json();
        setProduct(data);
        setFormData(data);
        if (data.image) {
          setImagePreview(data.image);
        }
      } else {
        setError('Product not found');
      }
    } catch (err) {
      setError('Failed to load product: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'price' || name === 'stock_quantity' ? parseFloat(value) : value,
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        image: file,
      });
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess('');
    setError(null);
    try {
      const form = new FormData();
      form.append('name', formData.name);
      form.append('price', formData.price);
      form.append('stock_quantity', formData.stock_quantity);
      form.append('nfc_tag_id', formData.nfc_tag_id);
      form.append('description', formData.description);
      if (formData.image && formData.image instanceof File) {
        form.append('image', formData.image);
      }

      const res = await fetchWithAuth(`/api/products/${id}/`, {
        method: 'PATCH',
        body: form,
      });

      if (res.ok) {
        const updated = await res.json();
        setProduct(updated);
        setFormData({
          name: updated.name || '',
          price: updated.price || '',
          stock_quantity: updated.stock_quantity ?? '',
          nfc_tag_id: updated.nfc_tag_id || '',
          description: updated.description || '',
          image: null,
        });
        setImagePreview(updated.image || null);
        setSuccess('Saved successfully.');
      } else {
        const err = await res.json();
        setError('Failed to save: ' + JSON.stringify(err));
      }
    } catch (err) {
      setError('Error saving product: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminPanel>
        <div className="edit-page">
          <div className="edit-page-header">
            <span className="skeleton" style={{height: 28, width: 180, display: 'block', borderRadius: 8}} />
          </div>
          <div className="skeleton-card" style={{padding: 20}}>
            <span className="skeleton" style={{height: 14, width: '35%', marginBottom: 16, display: 'block'}} />
            <span className="skeleton" style={{height: 150, width: 150, borderRadius: 10, marginBottom: 20, display: 'block'}} />
            {[1,2,3,4].map((i) => (
              <div key={i} style={{marginBottom: 18}}>
                <span className="skeleton" style={{height: 12, width: '35%', marginBottom: 8, display: 'block'}} />
                <span className="skeleton" style={{height: 40, display: 'block', borderRadius: 8}} />
              </div>
            ))}
          </div>
        </div>
      </AdminPanel>
    );
  }

  if (error) {
    return (
      <AdminPanel>
        <div className="edit-page">
          <div className="error-box">{error}</div>
          <Link to="/adminInventory" className="btn-back-link">← Back to Inventory</Link>
        </div>
      </AdminPanel>
    );
  }

  return (
    <AdminPanel>
      <div className="edit-page">
        <div className="edit-page-header">
          <div>
            <Link to="/adminInventory" className="btn-back-link">← Inventory</Link>
            <h1>{formData.name || 'Edit Product'}</h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="product-form">
          <div className="product-form-inner">
            <div className="form-fields">
              <h3>Edit Product</h3>
              {success && <div className="success-box">{success}</div>}
              {error && <div className="error-box">{error}</div>}
              <div className="form-grid-2">
                <div className="form-group">
                  <label>Product Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>NFC Tag ID *</label>
                  <input
                    type="text"
                    name="nfc_tag_id"
                    value={formData.nfc_tag_id}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Price (€) *</label>
                  <input
                    type="number"
                    name="price"
                    step="0.01"
                    value={formData.price}
                    onChange={handleInputChange}
                    onKeyDown={(e) => { if (['e','E','+','-'].includes(e.key)) e.preventDefault(); }}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Stock Quantity *</label>
                  <input
                    type="number"
                    name="stock_quantity"
                    value={formData.stock_quantity}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="5"
                />
              </div>
              <div className="edit-actions-inline">
                <button type="submit" className="btn-submit" disabled={saving}>
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
                <Link to="/adminInventory" className="btn-cancel-inline">Cancel</Link>
              </div>
            </div>

            <div className="form-image-col">
              <label className="form-img-label">Product Image</label>
              <input
                type="file"
                id="editImageInput"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageChange}
              />
              <div
                className="image-drop-zone"
                onClick={() => document.getElementById('editImageInput').click()}
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" />
                ) : (
                  <div className="image-placeholder">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" stroke="#94a3b8" strokeWidth="1.5"/><path d="M3 16l5-5 4 4 3-3 6 6" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round"/><circle cx="8.5" cy="8.5" r="1.5" fill="#94a3b8"/></svg>
                    <span>Click to upload</span>
                  </div>
                )}
              </div>
              <p className="edit-image-hint">Leave empty to keep current image.</p>
            </div>
          </div>
        </form>
      </div>
    </AdminPanel>
  );
};
