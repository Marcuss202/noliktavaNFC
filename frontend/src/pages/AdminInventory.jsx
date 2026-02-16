import { useEffect, useState, useRef } from 'react';
import { AdminPanel } from '../components/adminPanel';
import './AdminInventory.css';

export const AdminInventory = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
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
      const res = await fetch('/api/products/', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
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

      const res = await fetch('/api/products/', {
        method: 'POST',
        credentials: 'include',
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
      const res = await fetch(`/api/products/${id}/`, {
        method: 'DELETE',
        credentials: 'include',
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
          <h1>Inventory</h1>
          <button onClick={() => setShowForm(!showForm)} className="btn-add">
            {showForm ? 'Cancel' : '+ Add Product'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="product-form">
            <h3>Add New Product</h3>
            <div className="form-col">
              <div className="form-row">
                <input
                  type="text"
                  name="name"
                  placeholder="Product Name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
                <input
                  type="number"
                  name="nfc_tag_id"
                  placeholder="NFC Tag ID"
                  value={formData.nfc_tag_id}
                  onChange={handleInputChange}
                  required
                />
                <input
                  type="number"
                  name="price"
                  placeholder="Price"
                  step="0.01"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                />
                <input
                  type="number"
                  name="stock_quantity"
                  placeholder="Stock Quantity"
                  value={formData.stock_quantity}
                  onChange={handleInputChange}
                  required
                />
                <textarea
                  name="description"
                  placeholder="Description"
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-row">
                <div className="image-upload-wrapper">
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleImageChange}
                  />
                  <div className="image-preview" onClick={() => fileInputRef.current && fileInputRef.current.click()}>
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" />
                    ) : (
                      <div className="image-placeholder">Click to upload image</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <button type="submit" className="btn-submit">Create Product</button>
          </form>
        )}

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="products-table">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>NFC ID</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>{product.name}</td>
                    <td className="nfc-cell">{product.nfc_tag_id}</td>
                    <td>${parseFloat(product.price).toFixed(2)}</td>
                    <td>{product.stock_quantity}</td>
                    <td className="actions-cell">
                      <a href={`/adminInventory/${product.id}/`} className="link-edit">Admin Edit</a>
                      <button onClick={() => handleDelete(product.id)} className="btn-delete">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminPanel>
  );
};