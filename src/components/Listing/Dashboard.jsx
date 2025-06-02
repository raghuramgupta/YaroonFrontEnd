import React, { useEffect, useState } from "react";
import "./Dashboard.css";
import config from "../../config";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { FiHome, FiEye, FiUsers, FiTrendingUp, FiMapPin, FiLayers } from "react-icons/fi";
import { FaSpinner } from "react-icons/fa";

const Dashboard = () => {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userKey] = useState(() => localStorage.getItem("currentUser") || "");

  const palette = [
    "#4f46e5", // Indigo
    "#10b981", // Emerald
    "#f59e0b", // Amber
    "#3b82f6", // Blue
    "#ef4444", // Red
    "#8b5cf6", // Violet
    "#ec4899", // Pink
    "#14b8a6", // Teal
    "#f97316", // Orange
    "#64748b", // Slate
  ];

  useEffect(() => {
    if (!userKey) return;
    (async () => {
      try {
        const res = await fetch(
          `${config.apiBaseUrl}/api/listings/stats/${encodeURIComponent(
            userKey
          )}`
        );
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error("Error fetching stats:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [userKey]);

  const totalListings = stats.length;

  const totalViewsExMe =
    stats.reduce((sum, l) => {
      if (!l.viewsLog) return sum;
      return sum + l.viewsLog.filter((v) => v.viewer && v.viewer !== userKey).length;
    }, 0) / 2;

  const visitors = new Set();
  stats.forEach((l) =>
    (l.viewsLog || []).forEach((v) => {
      if (v.viewer && v.viewer !== userKey) visitors.add(v.viewer);
    })
  );
  const totalUniqueVisitors = visitors.size;

  const dayMap = {};
  stats.forEach((listing) => {
    const addrKey = listing.propertyAddress;
    (listing.viewsLog || []).forEach((v) => {
      if (!v.viewer || v.viewer === userKey) return;
      const day = new Date(v.date).toISOString().slice(0, 10);
      if (!dayMap[day]) dayMap[day] = { date: day };
      dayMap[day][addrKey] = (dayMap[day][addrKey] || 0) + 1;
    });
  });
  Object.values(dayMap).forEach((o) =>
    Object.keys(o).forEach((k) => {
      if (k !== "date") o[k] = o[k] / 2;
    })
  );
  const lineData = Object.values(dayMap).sort((a, b) => a.date.localeCompare(b.date));

  const localityCounts = {};
  const typeCounts = {};
  stats.forEach((l) => {
    const loc = l.locality || "Unknown";
    const typ = l.propertyStructure || "Unknown";
    localityCounts[loc] = (localityCounts[loc] || 0) + 1;
    typeCounts[typ] = (typeCounts[typ] || 0) + 1;
  });
  const localityData = Object.entries(localityCounts).map(([locality, count]) => ({
    locality,
    count,
  }));
  const typeData = Object.entries(typeCounts).map(([type, count]) => ({ type, count }));

  const tiles = [
    {
      title: "Total Listings",
      value: totalListings,
      icon: <FiHome className="tile-icon" />,
      color: "bg-indigo-100 text-indigo-600",
      trend: null,
    },
    {
      title: "Total Views",
      value: totalViewsExMe,
      icon: <FiEye className="tile-icon" />,
      color: "bg-emerald-100 text-emerald-600",
      trend: null,
    },
    {
      title: "Unique Visitors",
      value: totalUniqueVisitors,
      icon: <FiUsers className="tile-icon" />,
      color: "bg-amber-100 text-amber-600",
      trend: null,
    },
  ];

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Property Analytics Dashboard</h1>
        <p className="dashboard-subtitle">Performance overview of your listings</p>
      </header>

      {loading ? (
        <div className="loading-overlay">
          <FaSpinner className="spinner" />
          <p>Loading dashboard data...</p>
        </div>
      ) : (
        <>
          <section className="metrics-grid">
            {tiles.map((tile, index) => (
              <div key={index} className={`metric-card ${tile.color}`}>
                <div className="metric-icon">{tile.icon}</div>
                <div className="metric-content">
                  <h3>{tile.title}</h3>
                  <p className="metric-value">{tile.value}</p>
                  {tile.trend && (
                    <div className="metric-trend">
                      <FiTrendingUp />
                      <span>{tile.trend}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </section>

          <section className="data-section">
            <h2 className="section-title">Listing Performance</h2>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Address</th>
                    <th>
                      <div className="table-header-cell">
                        <FiEye />
                        <span>Views</span>
                      </div>
                    </th>
                    <th>
                      <div className="table-header-cell">
                        <FiUsers />
                        <span>Unique Visitors</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((l, i) => {
                    const viewsExMe =
                      (l.viewsLog || []).filter((v) => v.viewer !== userKey).length / 2;
                    const uniq = new Set(
                      (l.viewsLog || [])
                        .filter((v) => v.viewer && v.viewer !== userKey)
                        .map((v) => v.viewer)
                    ).size;
                    return (
                      <tr key={l._id}>
                        <td>{i + 1}</td>
                        <td className="address-cell">{l.propertyAddress}</td>
                        <td>{viewsExMe}</td>
                        <td>{uniq}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className="charts-section">
            <div className="chart-grid">
              {lineData.length > 0 && (
                <div className="chart-card">
                  <div className="chart-header">
                    <FiTrendingUp className="chart-icon" />
                    <h3>Daily Views Trend</h3>
                  </div>
                  <div className="chart-container">
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={lineData}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fill: '#6b7280' }}
                          tickMargin={10}
                        />
                        <YAxis 
                          allowDecimals={false} 
                          tick={{ fill: '#6b7280' }}
                        />
                        <Tooltip 
                          contentStyle={{
                            background: '#fff',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                            border: 'none'
                          }}
                        />
                        <Legend />
                        {stats.map((l, idx) => (
                          <Line
                            key={l.propertyAddress}
                            type="monotone"
                            dataKey={l.propertyAddress}
                            stroke={palette[idx % palette.length]}
                            strokeWidth={2}
                            dot={{ r: 2 }}
                            activeDot={{ r: 5 }}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {localityData.length > 0 && (
                <div className="chart-card">
                  <div className="chart-header">
                    <FiMapPin className="chart-icon" />
                    <h3>Listings by Locality</h3>
                  </div>
                  <div className="chart-container">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={localityData}>
                        <defs>
                          <linearGradient id="gradLoc" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#4f46e5" />
                            <stop offset="100%" stopColor="#8b5cf6" />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis 
                          dataKey="locality" 
                          tick={{ fill: '#6b7280' }}
                        />
                        <YAxis 
                          allowDecimals={false} 
                          tick={{ fill: '#6b7280' }}
                        />
                        <Tooltip 
                          contentStyle={{
                            background: '#fff',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                            border: 'none'
                          }}
                        />
                        <Legend />
                        <Bar
                          dataKey="count"
                          name="Listings"
                          fill="url(#gradLoc)"
                          radius={[4, 4, 0, 0]}
                          barSize={30}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {typeData.length > 0 && (
                <div className="chart-card">
                  <div className="chart-header">
                    <FiLayers className="chart-icon" />
                    <h3>Listings by Property Type</h3>
                  </div>
                  <div className="chart-container">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={typeData}>
                        <defs>
                          <linearGradient id="gradType" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" />
                            <stop offset="100%" stopColor="#34d399" />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis 
                          dataKey="type" 
                          tick={{ fill: '#6b7280' }}
                        />
                        <YAxis 
                          allowDecimals={false} 
                          tick={{ fill: '#6b7280' }}
                        />
                        <Tooltip 
                          contentStyle={{
                            background: '#fff',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                            border: 'none'
                          }}
                        />
                        <Legend />
                        <Bar
                          dataKey="count"
                          name="Listings"
                          fill="url(#gradType)"
                          radius={[4, 4, 0, 0]}
                          barSize={30}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default Dashboard;