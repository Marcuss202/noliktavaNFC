import { useEffect, useMemo, useState } from 'react';
import { AdminPanel } from '../../components/adminPanel';
import { reportsAPI } from '../../api';
import '../css/AdminSales.css';

const fmtMoney = (value) => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
}).format(value || 0);

const fmtNumber = (value) => new Intl.NumberFormat('en-US').format(value || 0);

const AreaChart = ({ data }) => {
  const W = 420, H = 150, pad = 10;
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
    const ap = [`${coords[0].x},${H - pad}`, lp, `${coords[coords.length - 1].x},${H - pad}`].join(' ');
    return { linePoints: lp, areaPoints: ap };
  }, [data]);

  if (!linePoints) return <div className="chart-empty">No data for selected period</div>;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="report-chart" preserveAspectRatio="none" role="img">
      <defs>
        <linearGradient id="salesAreaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e73c4e" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#e73c4e" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill="url(#salesAreaGrad)" />
      <polyline points={linePoints} fill="none" stroke="#e73c4e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export const AdminSales = () => {
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
        const data = await reportsAPI.sales({ range });
        if (isMounted) {
          setReport(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Could not load sales report');
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

  const summary = report?.summary || {};

  return (
    <AdminPanel>
      <section className="report-page">
        <div className="report-header">
          <h1>Sales</h1>
          <select value={range} onChange={(e) => setRange(e.target.value)} className="range-select">
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>

        {loading && (
          <div>
            <div className="stats-grid">
              {[1,2,3].map((i) => (
                <div key={i} className="skeleton-card">
                  <span className="skeleton" style={{height: 12, width: '55%', marginBottom: 12, display: 'block'}} />
                  <span className="skeleton" style={{height: 32, width: '65%', display: 'block'}} />
                </div>
              ))}
            </div>
            <div className="split-grid" style={{marginBottom: 16}}>
              <div className="skeleton-card"><span className="skeleton" style={{height: 14, width: '40%', marginBottom: 14, display: 'block'}} /><span className="skeleton" style={{height: 150, display: 'block'}} /></div>
              <div className="skeleton-card"><span className="skeleton" style={{height: 14, width: '50%', marginBottom: 14, display: 'block'}} /><span className="skeleton" style={{height: 150, display: 'block'}} /></div>
            </div>
            <div className="skeleton-card"><span className="skeleton" style={{height: 14, width: '35%', marginBottom: 14, display: 'block'}} /><span className="skeleton" style={{height: 200, display: 'block'}} /></div>
          </div>
        )}
        {error && <div className="status-block error">{error}</div>}

        {!loading && !error && (
          <>
            <div className="stats-grid">
              <article className="stat-card red">
                <p>Total Sales</p>
                <strong>{fmtMoney(summary.total_sales_amount)}</strong>
              </article>
              <article className="stat-card blue">
                <p>Sales Count</p>
                <strong>{fmtNumber(summary.sales_count)}</strong>
              </article>
              <article className="stat-card green">
                <p>Items Sold</p>
                <strong>{fmtNumber(summary.items_sold)}</strong>
              </article>
            </div>

            <div className="split-grid">
              <article className="card-box">
                <h2>Sales Trend</h2>
                <AreaChart data={report?.trend || []} />
              </article>

              <article className="card-box">
                <h2>Top Products</h2>
                <ul className="simple-list">
                  {(report?.top_products || []).map((item) => (
                    <li key={item.name}>
                      <span>{item.name}</span>
                      <strong>{fmtNumber(item.quantity)}</strong>
                    </li>
                  ))}
                </ul>
              </article>
            </div>

            <article className="card-box">
              <h2>Recent Sales</h2>
              <table className="report-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Date</th>
                    <th>Items</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(report?.recent_sales || []).map((sale) => (
                    <tr key={sale.id}>
                      <td>#{sale.id}</td>
                      <td>{new Date(sale.created_at).toLocaleDateString()}</td>
                      <td>{fmtNumber(sale.items?.length || 0)}</td>
                      <td>{fmtMoney(sale.total_amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </article>
          </>
        )}
      </section>
    </AdminPanel>
  );
};