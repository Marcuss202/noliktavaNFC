import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../AuthContext";
import { AdminPanel } from "../../components/adminPanel";
import { reportsAPI } from "../../api";
import "../css/Dashboard.css";

const fmtMoney = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value || 0);

const fmtNumber = (value) => new Intl.NumberFormat("en-US").format(value || 0);

const fmtChartDate = (value) => {
  if (!value) return "";
  const [year, month, day] = String(value).split("-").map(Number);
  const date =
    year && month && day ? new Date(year, month - 1, day) : new Date(value);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
};

const fmtAxisMoney = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
    notation: value >= 1000 ? "compact" : "standard",
    maximumFractionDigits: value >= 1000 ? 1 : 0,
  }).format(value || 0);

const AreaChart = ({ data, color, gradId }) => {
  const W = 520,
    H = 220;
  const pad = { top: 16, right: 18, bottom: 42, left: 58 };
  const { linePoints, areaPoints, coords, yTicks, xTicks } = useMemo(() => {
    if (!data?.length)
      return {
        linePoints: "",
        areaPoints: "",
        coords: [],
        yTicks: [],
        xTicks: [],
      };

    const vals = data.map((d) => Number(d.amount) || 0);
    const maxValue = Math.max(...vals, 1);
    const innerW = W - pad.left - pad.right;
    const innerH = H - pad.top - pad.bottom;
    const points = data.map((d, i) => ({
      x:
        pad.left +
        (data.length > 1 ? (i / (data.length - 1)) * innerW : innerW / 2),
      y: pad.top + innerH * (1 - (Number(d.amount) || 0) / maxValue),
      value: Number(d.amount) || 0,
      date: d.date,
    }));

    const lp = points.map(({ x, y }) => `${x},${y}`).join(" ");
    const baselineY = H - pad.bottom;
    const ap = [
      `${points[0].x},${baselineY}`,
      lp,
      `${points[points.length - 1].x},${baselineY}`,
    ].join(" ");
    const tickValues = [maxValue, maxValue / 2, 0];
    const yAxisTicks = tickValues.map((value) => ({
      value,
      label: fmtAxisMoney(value),
      y: pad.top + innerH * (1 - value / maxValue),
    }));
    const step = Math.max(1, Math.ceil(points.length / 5));
    const xAxisTicks = points.filter(
      (_, index) => index % step === 0 || index === points.length - 1,
    );

    return {
      linePoints: lp,
      areaPoints: ap,
      coords: points,
      yTicks: yAxisTicks,
      xTicks: xAxisTicks,
    };
  }, [data]);

  if (!linePoints) {
    return <div className="chart-empty">No data for selected period</div>;
  }

  const baselineY = H - pad.bottom;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="chart-svg"
      role="img"
      aria-label="Trend chart"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {yTicks.map((tick) => (
        <g key={tick.label}>
          <line
            x1={pad.left}
            x2={W - pad.right}
            y1={tick.y}
            y2={tick.y}
            className="chart-grid-line"
          />
          <text
            x={pad.left - 10}
            y={tick.y + 4}
            textAnchor="end"
            className="chart-axis-label"
          >
            {tick.label}
          </text>
        </g>
      ))}

      <line
        x1={pad.left}
        x2={W - pad.right}
        y1={baselineY}
        y2={baselineY}
        className="chart-axis-line"
      />
      <line
        x1={pad.left}
        x2={pad.left}
        y1={pad.top}
        y2={baselineY}
        className="chart-axis-line"
      />
      <polygon points={areaPoints} fill={`url(#${gradId})`} />
      <polyline
        points={linePoints}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {coords.map((point) => (
        <circle
          key={`${point.date}-${point.x}`}
          cx={point.x}
          cy={point.y}
          r="4"
          fill="#fff"
          stroke={color}
          strokeWidth="2.5"
        >
          <title>{`${fmtChartDate(point.date)}: ${fmtAxisMoney(point.value)}`}</title>
        </circle>
      ))}

      {xTicks.map((tick) => (
        <g key={`${tick.date}-${tick.x}`}>
          <line
            x1={tick.x}
            x2={tick.x}
            y1={baselineY}
            y2={baselineY + 5}
            className="chart-axis-line"
          />
          <text
            x={tick.x}
            y={baselineY + 24}
            textAnchor="middle"
            className="chart-axis-label"
          >
            {fmtChartDate(tick.date)}
          </text>
        </g>
      ))}
    </svg>
  );
};
const DonutChart = ({ critical, warning, healthy }) => {
  const total = critical + warning + healthy;
  const values = total
    ? [critical / total, warning / total, healthy / total]
    : [0, 0, 1];
  const colors = ["#e73c4e", "#0b75da", "#16a34a"];
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="donut-wrap">
      <svg
        width="170"
        height="170"
        viewBox="0 0 170 170"
        role="img"
        aria-label="Inventory health"
      >
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
  const [range, setRange] = useState("30d");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await reportsAPI.dashboard({ range });
        if (isMounted) {
          setReport(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Could not load dashboard report");
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

  if (!user || !user.is_staff) {
    return <Navigate to="/" replace />;
  }

  const kpis = report?.kpis || {};
  const inventory = report?.inventory_health || {
    critical: 0,
    warning: 0,
    healthy: 0,
  };

  return (
    <AdminPanel>
      <div className="activity">
        <div className="dashboard-header-row">
          <h1>Dashboard</h1>
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="range-select"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>

        {loading && (
          <div className="dash-skeleton">
            <div className="dashboard-grid">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="skeleton-card">
                  <span
                    className="skeleton"
                    style={{
                      height: 12,
                      width: "55%",
                      marginBottom: 14,
                      display: "block",
                    }}
                  />
                  <span
                    className="skeleton"
                    style={{ height: 34, width: "70%", display: "block" }}
                  />
                </div>
              ))}
            </div>
            <div className="chart-grid">
              {[1, 2].map((i) => (
                <div key={i} className="skeleton-card">
                  <span
                    className="skeleton"
                    style={{
                      height: 14,
                      width: "40%",
                      marginBottom: 16,
                      display: "block",
                    }}
                  />
                  <span
                    className="skeleton"
                    style={{ height: 150, display: "block" }}
                  />
                </div>
              ))}
              <div className="skeleton-card inventory-health-card">
                <span
                  className="skeleton"
                  style={{
                    height: 14,
                    width: "40%",
                    marginBottom: 16,
                    display: "block",
                  }}
                />
                <span
                  className="skeleton"
                  style={{ height: 150, display: "block" }}
                />
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
                <p className="stat-label">Orders ({range})</p>
                <p className="stat-value">{fmtNumber(kpis.orders_count)}</p>
              </article>
              <article className="stat-card accent-green">
                <p className="stat-label">Low Inventory Items</p>
                <p className="stat-value">{fmtNumber(kpis.low_stock_count)}</p>
              </article>
              <article className="stat-card accent-mix">
                <p className="stat-label">Pending Orders</p>
                <p className="stat-value">
                  {fmtNumber(kpis.pending_orders_count)}
                </p>
              </article>
            </section>

            <section className="chart-grid">
              <article className="chart-card">
                <h2>Sales Trend</h2>
                <AreaChart
                  data={report?.sales_trend || []}
                  color="#e73c4e"
                  gradId="salesGrad"
                />
              </article>

              <article className="chart-card">
                <h2>Orders Trend</h2>
                <AreaChart
                  data={report?.orders_trend || []}
                  color="#0b75da"
                  gradId="ordersGrad"
                />
              </article>

              <article className="chart-card inventory-health-card">
                <h2>Inventory Health</h2>
                <DonutChart
                  critical={inventory.critical}
                  warning={inventory.warning}
                  healthy={inventory.healthy}
                />
                <div className="legend-row">
                  <span>
                    <i className="dot red" />
                    Critical
                  </span>
                  <span>
                    <i className="dot blue" />
                    Warning
                  </span>
                  <span>
                    <i className="dot green" />
                    Healthy
                  </span>
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
