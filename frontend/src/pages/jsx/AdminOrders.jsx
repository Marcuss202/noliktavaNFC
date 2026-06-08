import { useEffect, useState } from 'react';
import { AdminPanel } from '../../components/adminPanel';
import { ordersAPI } from '../../api';
import '../css/AdminOrders.css';

const fmtMoney = (value) => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
}).format(value || 0);

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'at_location', label: 'At Processing Location' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const SORTABLE_COLUMNS = [
  { key: 'created_at', label: 'Date' },
  { key: 'full_name', label: 'Customer' },
  { key: 'email', label: 'Email' },
  { key: 'address', label: 'Address' },
  { key: 'status', label: 'Status' },
];

export const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortKey, setSortKey] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');
  const [savingId, setSavingId] = useState(null);

  const loadOrders = async (key, dir) => {
    setLoading(true);
    setError('');
    try {
      const sort = `${dir === 'desc' ? '-' : ''}${key}`;
      const data = await ordersAPI.list(sort);
      setOrders(data);
    } catch (err) {
      setError(err.message || 'Could not load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders(sortKey, sortDir);
  }, [sortKey, sortDir]);

  const handleSort = (key) => {
    if (key === sortKey) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortIndicator = (key) => {
    if (key !== sortKey) return '';
    return sortDir === 'asc' ? ' ▲' : ' ▼';
  };

  const handleStatusChange = async (order, status) => {
    setSavingId(order.id);
    try {
      const updated = await ordersAPI.updateStatus(order.id, status);
      setOrders((current) => current.map((o) => (o.id === order.id ? { ...o, ...updated } : o)));
      try {
        window.dispatchEvent(new CustomEvent('show-toast', {
          detail: { type: 'success', text: `Order #${order.id} → ${updated.status_display}` },
        }));
      } catch { /* noop */ }
    } catch (err) {
      try {
        window.dispatchEvent(new CustomEvent('show-toast', {
          detail: { type: 'error', text: err.message || 'Failed to update status' },
        }));
      } catch { /* noop */ }
    } finally {
      setSavingId(null);
    }
  };

  const itemsCount = (order) =>
    (order.items || []).reduce((sum, item) => sum + item.quantity, 0);

  return (
    <AdminPanel>
      <section className="orders-page">
        <div className="orders-header">
          <h1>Orders</h1>
          <span className="orders-count">{orders.length} order{orders.length === 1 ? '' : 's'}</span>
        </div>

        {error && <div className="orders-status error">{error}</div>}

        {loading ? (
          <div className="orders-status">Loading orders…</div>
        ) : orders.length === 0 ? (
          <div className="orders-status">No orders yet.</div>
        ) : (
          <div className="orders-table-wrap">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>ID</th>
                  {SORTABLE_COLUMNS.map((col) => (
                    <th
                      key={col.key}
                      className="sortable"
                      onClick={() => handleSort(col.key)}
                      title={`Sort by ${col.label}`}
                    >
                      {col.label}{sortIndicator(col.key)}
                    </th>
                  ))}
                  <th>Items</th>
                  <th>Total</th>
                  <th>Set status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>#{order.id}</td>
                    <td>{new Date(order.created_at).toLocaleString()}</td>
                    <td>{order.full_name || '—'}</td>
                    <td>{order.email}</td>
                    <td className="orders-address">{order.address || '—'}</td>
                    <td>
                      <span className={`status-badge status-${order.status}`}>
                        {order.status_display}
                      </span>
                    </td>
                    <td>{itemsCount(order)}</td>
                    <td>{fmtMoney(order.total_amount)}</td>
                    <td>
                      <select
                        className="status-select"
                        value={order.status}
                        disabled={savingId === order.id}
                        onChange={(e) => handleStatusChange(order, e.target.value)}
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AdminPanel>
  );
};
