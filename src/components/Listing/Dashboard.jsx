import React, { useEffect, useState } from "react";
import "./Dashboard.css";
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
import { FiHome, FiEye, FiUser } from "react-icons/fi";   // ⬅ cute icons

const Dashboard = () => {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userKey] = useState(() => localStorage.getItem("currentUser") || "");

  /* ---------- colours ---------- */
  const palette = [
    "#42a5f5",
    "#66bb6a",
    "#ff7043",
    "#ab47bc",
    "#26c6da",
    "#ffa726",
    "#8d6e63",
    "#29b6f6",
    "#d4e157",
    "#ec407a",
  ];

  /* ---------- fetch once ---------- */
  useEffect(() => {
    if (!userKey) return;
    (async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/listings/stats/${encodeURIComponent(
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

  /* ---------- helpers ---------- */
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

  /* ---------- daily views line‑chart dataset ---------- */
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

  /* ---------- bar‑chart datasets ---------- */
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

  /* ---------- summary tile meta ---------- */
  const tiles = [
    {
      title: "Total Listings",
      value: totalListings,
      icon: <FiHome size={28} />,
      gradient: "linear-gradient(135deg,#42a5f5 0%,#4fc3f7 100%)",
    },
    {
      title: "Total Views",
      value: totalViewsExMe,
      icon: <FiEye size={28} />,
      gradient: "linear-gradient(135deg,#66bb6a 0%,#b2ff59 100%)",
    },
    {
      title: "Unique Visitors",
      value: totalUniqueVisitors,
      icon: <FiUser size={28} />,
      gradient: "linear-gradient(135deg,#ff7043 0%,#ffab91 100%)",
    },
  ];

  /* ============================== */
  return (
    <div className="dashboard-wrapper">
      {loading ? (
        <p>Loading…</p>
      ) : (
        <>
          {/* ---------- summary gradient cards ---------- */}
          <div className="summary-cards">
            {tiles.map((t) => (
              <div className="card" style={{ background: t.gradient }} key={t.title}>
                <div className="card-icon">{t.icon}</div>
                <div className="card-text">
                  <p className="card-value">{t.value}</p>
                  <p className="card-title">{t.title}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ---------- data table ---------- */}
          <table className="listing-stats-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Address</th>
                <th>Views</th>
                <th>Unique Visitors</th>
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
                    <td>{l.propertyAddress}</td>
                    <td>{viewsExMe}</td>
                    <td>{uniq}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* ---------- pretty charts ---------- */}
          <div className="charts-row">
            {/* --- line chart --- */}
            {lineData.length > 0 && (
              <div className="chart-box">
                <h3>Daily Views per Address</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={lineData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="date" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    {stats.map((l, idx) => (
                      <Line
                        key={l.propertyAddress}
                        type="monotone"
                        dataKey={l.propertyAddress}
                        stroke={palette[idx % palette.length]}
                        strokeWidth={2.5}
                        dot={false}
                        activeDot={{ r: 5 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* --- bar chart locality --- */}
            {localityData.length > 0 && (
              <div className="chart-box">
                <h3>Listings by Locality</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={localityData}>
                    <defs>
                      <linearGradient id="gradLoc" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"  stopColor="#42a5f5" />
                        <stop offset="100%" stopColor="#4fc3f7" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="locality" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="count"
                      name="Listings"
                      fill="url(#gradLoc)"
                      radius={[8, 8, 0, 0]}
                      barSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* --- bar chart property type --- */}
            {typeData.length > 0 && (
              <div className="chart-box">
                <h3>Listings by Property Type</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={typeData}>
                    <defs>
                      <linearGradient id="gradType" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"  stopColor="#ff7043" />
                        <stop offset="100%" stopColor="#ffab91" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="type" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="count"
                      name="Listings"
                      fill="url(#gradType)"
                      radius={[8, 8, 0, 0]}
                      barSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
