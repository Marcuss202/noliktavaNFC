import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { accountsAPI, checkoutAPI } from '../../api';
import { useAuth } from '../../AuthContext';
import { useCart } from '../../CartContext';
import '../css/Checkout.css';

const fmtMoney = (value) => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
}).format(value || 0);

const STREET_OPTIONS = ['Maple Avenue', 'Sunset Boulevard', 'Birch Lane'];
const HOUSE_NUMBER_OPTIONS = ['12A', '47', '105'];
const CITY_OPTIONS = ['Springfield', 'Rivertown', 'Lakeside'];
const POSTAL_CODE_OPTIONS = ['LV-1001', 'LV-2050', 'LV-3099'];
const COUNTRY_OPTIONS = ['Latvia', 'Germany', 'Spain'];

export const Checkout = () => {
  const { user, loading } = useAuth();
  const { items, totalAmount, clearCart } = useCart();

  const [emails, setEmails] = useState([]);
  const [form, setForm] = useState({
    email: '',
    street: STREET_OPTIONS[0],
    house_number: HOUSE_NUMBER_OPTIONS[0],
    city: CITY_OPTIONS[0],
    postal_code: POSTAL_CODE_OPTIONS[0],
    country: COUNTRY_OPTIONS[0],
    note: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [placedOrder, setPlacedOrder] = useState(null);

  useEffect(() => {
    if (user?.email) {
      setForm((prev) => ({ ...prev, email: prev.email || user.email }));
    }
  }, [user]);


  const checkoutPayload = useMemo(
    () => items.map((item) => ({ product_id: item.product_id, quantity: item.quantity })),
    [items],
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!items.length) return;
    setSubmitting(true);
    setError('');
    try {
      const data = await checkoutAPI.placeOrder({
        items: checkoutPayload,
        ...form,
      });
      clearCart();
      setPlacedOrder(data);
      try {
        window.dispatchEvent(new CustomEvent('show-toast', {
          detail: { type: 'success', text: `Order #${data.id} placed successfully.` },
        }));
      } catch { /* noop */ }
    } catch (err) {
      const text = err.message || 'Checkout failed';
      setError(text);
      try {
        window.dispatchEvent(new CustomEvent('show-toast', { detail: { type: 'error', text } }));
      } catch { /* noop */ }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="checkout-page"><div className="checkout-shell">Loading...</div></div>;
  }

  if (!user) {
    return (
      <div className="checkout-page">
        <section className="checkout-shell checkout-gate">
          <h1>Account required</h1>
          <p>You need an account to place an order. Please create one or log in to continue.</p>
          <div className="checkout-gate-actions">
            <Link to="/register" className="checkout-btn">Create account</Link>
            <Link to="/login" className="checkout-secondary-btn">Login</Link>
          </div>
        </section>
      </div>
    );
  }

  if (placedOrder) {
    return (
      <div className="checkout-page">
        <section className="checkout-shell checkout-confirm">
          <h1>Thank you!</h1>
          <p>Your order <strong>#{placedOrder.id}</strong> has been placed.</p>
          <p className="checkout-confirm-meta">
            Status: <strong>{placedOrder.status_display || placedOrder.status}</strong><br />
            Shipping to: {placedOrder.address || '—'}
          </p>
          <Link to="/" className="checkout-btn">Back to Store</Link>
        </section>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="checkout-page">
        <section className="checkout-shell checkout-gate">
          <h1>Your cart is empty</h1>
          <p>Add some items before checking out.</p>
          <Link to="/" className="checkout-btn">Go to Store</Link>
        </section>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <section className="checkout-shell">
        <div className="checkout-header">
          <h1>Checkout</h1>
          <Link to="/cart" className="checkout-back-link">Back to Cart</Link>
        </div>

        <div className="checkout-grid">
          <form className="checkout-form" onSubmit={handleSubmit}>
            <h2>Shipping details</h2>

            <label>
              Account email
              <select name="email" value={form.email} onChange={handleChange} required>
                {/* Ensure the current user's email is always selectable */}
                {user.email && !emails.includes(user.email) && (
                  <option value={user.email}>{user.email}</option>
                )}
                {emails.map((email) => (
                  <option key={email} value={email}>{email}</option>
                ))}
              </select>
            </label>

            <div className="checkout-row">
              <label>
                Street
                <select name="street" value={form.street} onChange={handleChange}>
                  {STREET_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </label>
              <label>
                House number
                <select name="house_number" value={form.house_number} onChange={handleChange}>
                  {HOUSE_NUMBER_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </label>
            </div>

            <div className="checkout-row">
              <label>
                City
                <select name="city" value={form.city} onChange={handleChange}>
                  {CITY_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </label>
              <label>
                Postal code
                <select name="postal_code" value={form.postal_code} onChange={handleChange}>
                  {POSTAL_CODE_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </label>
            </div>

            <label>
              Country
              <select name="country" value={form.country} onChange={handleChange}>
                {COUNTRY_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </label>

            <label>
              Note (optional)
              <input
                type="text"
                name="note"
                value={form.note}
                onChange={handleChange}
                placeholder="Leave at the front door, etc."
              />
            </label>

            {error && <p className="checkout-error">{error}</p>}

            <button type="submit" className="checkout-btn" disabled={submitting}>
              {submitting ? 'Placing order...' : `Place Order · ${fmtMoney(totalAmount)}`}
            </button>
          </form>

          <aside className="checkout-summary">
            <h2>Order summary</h2>
            <ul className="checkout-items">
              {items.map((item) => (
                <li key={item.product_id}>
                  <span>{item.name} × {item.quantity}</span>
                  <strong>{fmtMoney(item.price * item.quantity)}</strong>
                </li>
              ))}
            </ul>
            <div className="checkout-total-row">
              <span>Total</span>
              <strong>{fmtMoney(totalAmount)}</strong>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
};
