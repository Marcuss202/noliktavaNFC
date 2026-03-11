import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { fetchWithAuth } from '../../api';
import { AdminPanel } from '../../components/adminPanel';
import '../css/AdminInventory.css';

export const AdminInventory = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    stock_quantity: '',
    nfc_tag_id: '',
    description: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const fileInputRef = useRef(null);
  const [imagePreview, setImagePreview] = useState(null);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    String(p.nfc_tag_id).includes(search)
  );

  useEffect(() => {
    loadProducts();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setImageFile(file);
    // Keep the file reference out of formData (we send FormData separately)
    const reader = new FileReader();
    reader.onload = (event) => setImagePreview(event.target.result);
    reader.readAsDataURL(file);
  };

  const loadProducts = async () => {
    try {
      const res = await fetchWithAuth('/api/products/');
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };


  const openFileDialog = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const form = new FormData();
      form.append('name', formData.name);
      form.append('nfc_tag_id', formData.nfc_tag_id);
      form.append('price', parseFloat(formData.price || 0));
      form.append('stock_quantity', parseInt(formData.stock_quantity || 0));
      form.append('description', formData.description || '');
      if (imageFile) form.append('image', imageFile);

      const res = await fetchWithAuth('/api/products/', {
        method: 'POST',
        body: form,
      });
      if (res.ok) {
        setFormData({
          name: '',
          price: '',
          stock_quantity: '',
          nfc_tag_id: '',
          description: '',
        });
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setShowForm(false);
        loadProducts();
      } else {
        alert('Failed to create product');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      const res = await fetchWithAuth(`/api/products/${id}/`, {
        method: 'DELETE',
      });
      if (res.ok) {
        loadProducts();
      } else {
        alert('Failed to delete product');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <AdminPanel>
      <div className="inventory-container">
        <div className="inventory-header">
          <div>
            <h1>Inventory</h1>
            <p className="inv-subtitle">{products.length} product{products.length !== 1 ? 's' : ''} total</p>
          </div>
          <div className="inventory-header-actions">
            <input
              type="text"
              className="inv-search"
              placeholder="Search by name or NFC ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button onClick={() => setShowForm(!showForm)} className="btn-add">
              {showForm ? '✕ Cancel' : '+ Add Product'}
            </button>
          </div>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="product-form">
            <div className="product-form-inner">
              <div className="form-fields">
                <h3>New Product</h3>
                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Product Name *</label>
                    <input type="text" name="name" placeholder="e.g. Widget Pro" value={formData.name} onChange={handleInputChange} required />
                  </div>
                  <div className="form-group">
                    <label>NFC Tag ID *</label>
                    <input type="number" name="nfc_tag_id" placeholder="e.g. 10042" value={formData.nfc_tag_id} onChange={handleInputChange} required />
                  </div>
                  <div className="form-group">
                    <label>Price (€) *</label>
                    <input type="number" name="price" placeholder="0.00" step="0.01" value={formData.price} onChange={handleInputChange} onKeyDown={(e) => { if (['+','-'].includes(e.key)) e.preventDefault(); }} required />
                  </div>
                  <div className="form-group">
                    <label>Stock Quantity *</label>
                    <input type="number" name="stock_quantity" placeholder="0" value={formData.stock_quantity} onChange={handleInputChange} required />
                  </div>
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea name="description" placeholder="Optional product description…" value={formData.description} onChange={handleInputChange} rows="3" />
                </div>
                <button type="submit" className="btn-submit">Create Product</button>
              </div>
              <div className="form-image-col">
                <label className="form-img-label">Product Image</label>
                <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImageChange} />
                <div className="image-drop-zone" onClick={() => fileInputRef.current && fileInputRef.current.click()}>
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" />
                  ) : (
                    <div className="image-placeholder">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" stroke="#94a3b8" strokeWidth="1.5"/><path d="M3 16l5-5 4 4 3-3 6 6" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round"/><circle cx="8.5" cy="8.5" r="1.5" fill="#94a3b8"/></svg>
                      <span>Click to upload</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </form>
        )}

        {loading ? (
          <div className="inv-skeleton">
            {[1,2,3,4,5].map((i) => (
              <div key={i} className="inv-skel-row">
                <span className="skeleton" style={{width: 44, height: 44, borderRadius: 8, flexShrink: 0, display: 'block'}} />
                <span className="skeleton" style={{flex: 2, height: 16, display: 'block'}} />
                <span className="skeleton" style={{flex: 1, height: 16, display: 'block'}} />
                <span className="skeleton" style={{flex: 1, height: 16, display: 'block'}} />
                <span className="skeleton" style={{flex: 1, height: 16, display: 'block'}} />
                <span className="skeleton" style={{width: 120, height: 32, borderRadius: 6, display: 'block'}} />
              </div>
            ))}
          </div>
        ) : (
          <div className="products-table">
            <table>
              <thead>
                <tr>
                  <th style={{width: 56}}></th>
                  <th>Product</th>
                  <th>NFC ID</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan="6" className="empty-row">No products found.</td></tr>
                )}
                {filtered.map((product) => {
                  const stock = product.stock_quantity;
                  const stockClass = stock <= 5 ? 'badge-critical' : stock <= 15 ? 'badge-warning' : 'badge-ok';
                  return (
                    <tr key={product.id}>
                      <td className="thumb-cell">
                        {product.image ? (
                          <img src={product.image} alt={product.name} className="product-thumb" />
                        ) : (
                          <div className="product-thumb-placeholder" />
                        )}
                      </td>
                      <td className="name-cell">{product.name}</td>
                      <td className="nfc-cell">{product.nfc_tag_id}</td>
                      <td>€{parseFloat(product.price).toFixed(2)}</td>
                      <td><span className={`stock-badge ${stockClass}`}>{stock}</span></td>
                      <td className="actions-cell">
                        <Link to={`/adminInventory/${product.id}/`} className="link-edit">Edit</Link>
                        <button onClick={() => handleDelete(product.id)} className="btn-delete">Delete</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminPanel>
  );
};