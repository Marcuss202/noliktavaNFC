import { Link, useNavigate } from "react-router-dom";
import { API_BASE } from "../../api";
import { useCart } from "../../CartContext";
import "../css/Cart.css";

const fmtMoney = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(value || 0);

const getImageUrl = (image) => {
  if (!image) return null;
  if (image.startsWith("http://") || image.startsWith("https://")) return image;
  if (API_BASE)
    return `${API_BASE}${image.startsWith("/") ? image : `/${image}`}`;
  return image;
};

export const Cart = () => {
  const { items, setCartItemQuantity, removeFromCart, clearCart, totalAmount } =
    useCart();
  const navigate = useNavigate();

  const handleCheckout = () => {
    if (!items.length) return;
    navigate("/checkout");
  };

  return (
    <div className="cart-page">
      <section className="cart-shell">
        <div className="cart-header">
          <h1>Your Cart</h1>
          <Link to="/" className="cart-back-link">
            Continue Shopping
          </Link>
        </div>

        {!items.length ? (
          <div className="cart-empty">
            <p>Your cart is empty.</p>
            <Link to="/" className="cart-cta">
              Go to Store
            </Link>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {items.map((item) => (
                <article key={item.product_id} className="cart-item-card">
                  {item.image ? (
                    <img
                      src={getImageUrl(item.image)}
                      alt={item.name}
                      className="cart-item-image"
                    />
                  ) : (
                    <div className="cart-item-image placeholder">No image</div>
                  )}

                  <div className="cart-item-content">
                    <h3>{item.name}</h3>
                    <p className="cart-item-meta">NFC: {item.nfc_tag_id}</p>
                    <p className="cart-item-price">
                      {fmtMoney(item.price)} each
                    </p>
                  </div>

                  <div className="cart-item-actions">
                    <label htmlFor={`qty-${item.product_id}`}>Qty</label>
                    <input
                      id={`qty-${item.product_id}`}
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        setCartItemQuantity(
                          item.product_id,
                          Number(e.target.value),
                        )
                      }
                    />
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.product_id)}
                      className="remove-btn"
                    >
                      Remove
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <aside className="cart-summary">
              <h2>Summary</h2>
              <div className="summary-row">
                <span>Total</span>
                <strong>{fmtMoney(totalAmount)}</strong>
              </div>
              <button
                type="button"
                className="checkout-btn"
                onClick={handleCheckout}
              >
                Buy / Checkout
              </button>
              <button type="button" className="clear-btn" onClick={clearCart}>
                Clear Cart
              </button>
            </aside>
          </>
        )}
      </section>
    </div>
  );
};
