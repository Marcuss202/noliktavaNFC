import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { AdminPanel } from '../../components/adminPanel';
import { reportsAPI } from '../../api';
import '../css/Dashboard.css';

const fmtMoney = (value) => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
}).format(value || 0);

const fmtNumber = (value) => new Intl.NumberFormat('en-US').format(value || 0);

const AreaChart = ({ data, color, gradId }) => {
  const W = 420, H = 150;
  const pad = 10;
  const { linePoints, areaPoints } = useMemo(() => {
    if (!data?.length) return { linePoints: '', areaPoints: '' };
    const vals = data.map((d) => d.amount);
    const max = Math.max(...vals, 1);
    const innerW = W - pad * 2;
    const innerH = H - pad * 2;
    const coords = data.map((d, i) => ({
      x: pad + (data.length > 1 ? (i / (data.length - 1)) * innerW : innerW / 2),
      y: pad + innerH * (1 - d.amount / max),
    }));
    const lp = coords.map(({ x, y }) => `${x},${y}`).join(' ');
    const ap = [
      `${coords[0].x},${H - pad}`,
      lp,
      `${coords[coords.length - 1].x},${H - pad}`,
    ].join(' ');
    return { linePoints: lp, areaPoints: ap };
  }, [data]);

  if (!linePoints) {
    return <div className="chart-empty">No data for selected period</div>;
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart-svg" preserveAspectRatio="none" role="img">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#${gradId})`} />
      <polyline points={linePoints} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const DonutChart = ({ critical, warning, healthy }) => {
  const total = critical + warning + healthy;
  const values = total ? [critical / total, warning / total, healthy / total] : [0, 0, 1];
  const colors = ['#e73c4e', '#0b75da', '#16a34a'];
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="donut-wrap">
      <svg width="170" height="170" viewBox="0 0 170 170" role="img" aria-label="Inventory health">
        <g transform="translate(85,85)">
          {values.map((segment, index) => {
            const dash = segment * circumference;
            const circle = (
              <circle
                key={colors[index]}
                r={radius}
                fill="transparent"
                stroke={colors[index]}
                strokeWidth="20"
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
                transform="rotate(-90)"
              />
            );
            offset += dash;
            return circle;
          })}
        </g>
      </svg>
      <div className="donut-center">{fmtNumber(total)}</div>
    </div>
  );
};

export const Dashboard = () => {
  const { user } = useAuth();
  const [range, setRange] = useState('30d');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await reportsAPI.dashboard({ range });
        if (isMounted) {
          setReport(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Could not load dashboard report');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [range]);

  // Redirect if not logged in or not an admin
  if (!user || !user.is_staff) {
    return <Navigate to="/" replace />;
  }

  const kpis = report?.kpis || {};
  const inventory = report?.inventory_health || { critical: 0, warning: 0, healthy: 0 };

  return (
    <AdminPanel>
      <div className="activity">
        <div className="dashboard-header-row">
          <h1>Dashboard</h1>
          <select value={range} onChange={(e) => setRange(e.target.value)} className="range-select">
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>

        {loading && (
          <div className="dash-skeleton">
            <div className="dashboard-grid">
              {[1,2,3,4].map((i) => (
                <div key={i} className="skeleton-card">
                  <span className="skeleton" style={{height: 12, width: '55%', marginBottom: 14, display: 'block'}} />
                  <span className="skeleton" style={{height: 34, width: '70%', display: 'block'}} />
                </div>
              ))}
            </div>
            <div className="chart-grid">
              {[1,2].map((i) => (
                <div key={i} className="skeleton-card">
                  <span className="skeleton" style={{height: 14, width: '40%', marginBottom: 16, display: 'block'}} />
                  <span className="skeleton" style={{height: 150, display: 'block'}} />
                </div>
              ))}
              <div className="skeleton-card inventory-health-card">
                <span className="skeleton" style={{height: 14, width: '40%', marginBottom: 16, display: 'block'}} />
                <span className="skeleton" style={{height: 150, display: 'block'}} />
              </div>
            </div>
          </div>
        )}
        {error && <div className="status-block error">{error}</div>}

        {!loading && !error && (
          <>
            <section className="dashboard-grid">
              <article className="stat-card accent-red">
                <p className="stat-label">Sales ({range})</p>
                <p className="stat-value">{fmtMoney(kpis.sales_total)}</p>
              </article>
              <article className="stat-card accent-blue">
                <p className="stat-label">Purchases ({range})</p>
                <p className="stat-value">{fmtMoney(kpis.purchases_total)}</p>
              </article>
              <article className="stat-card accent-green">
                <p className="stat-label">Low Inventory Items</p>
                <p className="stat-value">{fmtNumber(kpis.low_stock_count)}</p>
              </article>
              <article className="stat-card accent-mix">
                <p className="stat-label">Net Activity</p>
                <p className="stat-value">{fmtMoney(kpis.net_activity)}</p>
              </article>
            </section>

            <section className="chart-grid">
              <article className="chart-card">
                <h2>Sales Trend</h2>
                <AreaChart data={report?.sales_trend || []} color="#e73c4e" gradId="salesGrad" />
              </article>

              <article className="chart-card">
                <h2>Purchases Trend</h2>
                <AreaChart data={report?.purchases_trend || []} color="#0b75da" gradId="purchasesGrad" />
              </article>

              <article className="chart-card inventory-health-card">
                <h2>Inventory Health</h2>
                <DonutChart critical={inventory.critical} warning={inventory.warning} healthy={inventory.healthy} />
                <div className="legend-row">
                  <span><i className="dot red" />Critical</span>
                  <span><i className="dot blue" />Warning</span>
                  <span><i className="dot green" />Healthy</span>
                </div>
              </article>
            </section>

            <section className="table-card">
              <h2>Low Stock Snapshot</h2>
              {!report?.low_stock_products?.length ? (
                <p className="muted">No low-stock products in this range.</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>NFC Tag</th>
                      <th>In Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.low_stock_products.map((item) => (
                      <tr key={item.id}>
                        <td>{item.name}</td>
                        <td>{item.nfc_tag_id}</td>
                        <td>{item.stock_quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </>
        )}
      </div>
    </AdminPanel>
  );
};