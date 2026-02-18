import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AdminPanel } from '../../components/adminPanel';
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

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      const res = await fetch(`/api/products/${id}/`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
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

      const res = await fetch(`/api/products/${id}/`, {
        method: 'PATCH',
        credentials: 'include',
        body: form,
      });

      if (res.ok) {
        alert('Product updated successfully');
        navigate('/adminInventory');
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
        <div className="edit-container">
          <p>Loading...</p>
        </div>
      </AdminPanel>
    );
  }

  if (error) {
    return (
      <AdminPanel>
        <div className="edit-container">
          <div className="error-box">{error}</div>
          <Link to="/adminInventory" className="btn-back">Back to Inventory</Link>
        </div>
      </AdminPanel>
    );
  }

  return (
    <AdminPanel>
      <div className="edit-container">
        <div className="edit-header">
          <h1>Edit Product</h1>
          <Link to="/adminInventory" className="btn-back">← Back to Inventory</Link>
        </div>

        <form onSubmit={handleSubmit} className="product-edit-form">
          <div className="form-section">
            <h2>Product Details</h2>
            
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

            <div className="form-row">
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
                <label>Price ($) *</label>
                <input
                  type="number"
                  name="price"
                  step="0.01"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
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
          </div>

          <div className="form-section">
            <h2>Product Image</h2>
            
            {imagePreview && (
              <div className="image-preview">
                <img src={imagePreview} alt="Preview" />
              </div>
            )}

            <div className="form-group">
              <label>Upload Image</label>
              <input
                type="file"
                name="image"
                accept="image/*"
                onChange={handleImageChange}
              />
              <p className="help-text">Leave empty to keep current image</p>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-save" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <Link to="/adminInventory" className="btn-cancel">Cancel</Link>
          </div>
        </form>
      </div>
    </AdminPanel>
  );
};
