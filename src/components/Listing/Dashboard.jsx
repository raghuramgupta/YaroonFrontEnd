import React, { useEffect, useState, useMemo } from "react";
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
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from "recharts";
import {
  FiHome,
  FiEye,
  FiUsers,
  FiTrendingUp,
  FiTrendingDown,
  FiMapPin,
  FiLayers,
  FiMessageSquare,
  FiCalendar,
  FiFilter,
  FiRefreshCw
} from "react-icons/fi";
import { FaSpinner } from "react-icons/fa";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, subDays, isAfter, isBefore } from "date-fns";

const Dashboard = () => {
  const [stats, setStats] = useState([]);
  const [messageStats, setMessageStats] = useState({
    totalMessages: 0,
    messagesPerProperty: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    start: subDays(new Date(), 30),
    end: new Date()
  });
  const [activeProperty, setActiveProperty] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const userKey = localStorage.getItem("currentUser") || "";

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

  const fetchData = async () => {
    if (!userKey) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Fetch listing stats
      const statsRes = await fetch(
        `${config.apiBaseUrl}/api/listings/stats/${encodeURIComponent(userKey)}`
      );
      if (!statsRes.ok) throw new Error("Failed to fetch listing stats");
      const statsData = await statsRes.json();
      setStats(statsData);

      // Fetch message stats
      const messagesRes = await fetch(
        `${config.apiBaseUrl}/api/messages/stats/${encodeURIComponent(userKey)}`
      );
      if (!messagesRes.ok) throw new Error("Failed to fetch message stats");
      const messagesData = await messagesRes.json();
      setMessageStats(messagesData);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userKey]);

  const filteredStats = useMemo(() => {
    if (!dateRange.start || !dateRange.end) return stats;
    
    return stats.map(property => {
      const filteredViews = (property.viewsLog || []).filter(view => {
        const viewDate = new Date(view.date);
        return isAfter(viewDate, dateRange.start) && isBefore(viewDate, dateRange.end);
      });
      
      return {
        ...property,
        viewsLog: filteredViews
      };
    });
  }, [stats, dateRange]);

  const processedData = useMemo(() => {
    const totalListings = filteredStats.length;

    const totalViewsExMe = filteredStats.reduce((sum, l) => {
      if (!l.viewsLog) return sum;
      return sum + l.viewsLog.filter((v) => v.viewer && v.viewer !== userKey).length;
    }, 0);

    const visitors = new Set();
    filteredStats.forEach((l) =>
      (l.viewsLog || []).forEach((v) => {
        if (v.viewer && v.viewer !== userKey) visitors.add(v.viewer);
      })
    );
    const totalUniqueVisitors = visitors.size;

    // Prepare daily views data
    const dayMap = {};
    filteredStats.forEach((listing) => {
      const addrKey = listing.propertyAddress;
      (listing.viewsLog || []).forEach((v) => {
        if (!v.viewer || v.viewer === userKey) return;
        const day = new Date(v.date).toISOString().slice(0, 10);
        if (!dayMap[day]) dayMap[day] = { date: day };
        dayMap[day][addrKey] = (dayMap[day][addrKey] || 0) + 1;
      });
    });

    const lineData = Object.values(dayMap).sort((a, b) => a.date.localeCompare(b.date));

    // Prepare locality and type data
    const localityCounts = {};
    const typeCounts = {};
    filteredStats.forEach((l) => {
      const loc = l.locality || "Unknown";
      const typ = l.propertyStructure || "Unknown";
      localityCounts[loc] = (localityCounts[loc] || 0) + 1;
      typeCounts[typ] = (typeCounts[typ] || 0) + 1;
    });

    const localityData = Object.entries(localityCounts)
      .map(([locality, count]) => ({ locality, count }))
      .sort((a, b) => b.count - a.count);

    const typeData = Object.entries(typeCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);

    // Prepare message data
    const messageBarData = [
      { name: 'Total Messages', count: messageStats.totalMessages },
      ...messageStats.messagesPerProperty.map(item => ({
        ...item,
        name: item.propertyName || 'Unknown',
        count: item.count
      }))
    ].sort((a, b) => b.count - a.count);

    const messagePieData = messageStats.messagesPerProperty
      .map((item, index) => ({
        name: item.propertyName || 'Unknown',
        value: item.count,
        color: palette[index % palette.length]
      }))
      .sort((a, b) => b.value - a.value);

    return {
      totalListings,
      totalViewsExMe,
      totalUniqueVisitors,
      lineData,
      localityData,
      typeData,
      messageBarData,
      messagePieData
    };
  }, [filteredStats, messageStats, userKey]);

  const handlePropertyClick = (propertyId) => {
    setActiveProperty(activeProperty === propertyId ? null : propertyId);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const tiles = [
    {
      title: "Total Listings",
      value: processedData.totalListings,
      icon: <FiHome className="tile-icon" />,
      color: "bg-indigo-100 text-indigo-600",
    },
    {
      title: "Total Views",
      value: processedData.totalViewsExMe,
      icon: <FiEye className="tile-icon" />,
      color: "bg-emerald-100 text-emerald-600",
    },
    {
      title: "Unique Visitors",
      value: processedData.totalUniqueVisitors,
      icon: <FiUsers className="tile-icon" />,
      color: "bg-amber-100 text-amber-600",
    },
    {
      title: "Total Messages",
      value: messageStats.totalMessages,
      icon: <FiMessageSquare className="tile-icon" />,
      color: "bg-blue-100 text-blue-600",
    },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-date">{label}</p>
          {payload.map((entry, index) => (
            <p key={`tooltip-${index}`} style={{ color: entry.color }}>
              {entry.name}: <strong>{entry.value}</strong>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <div>
            <h1>Property Analytics Dashboard</h1>
            <p className="dashboard-subtitle">Performance overview of your listings</p>
          </div>
          <div className="header-actions">
            <button 
              onClick={handleRefresh} 
              className="refresh-button"
              disabled={refreshing}
            >
              <FiRefreshCw className={refreshing ? "spin" : ""} />
              {refreshing ? "Refreshing..." : "Refresh Data"}
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div className="error-alert">
          <p>Error: {error}</p>
          <button onClick={fetchData}>Retry</button>
        </div>
      )}

      {loading ? (
        <div className="loading-overlay">
          <FaSpinner className="spinner" />
          <p>Loading dashboard data...</p>
        </div>
      ) : (
        <>
          <section className="controls-section">
            <div className="date-range-picker">
              <div className="date-picker-group">
                <FiCalendar className="date-picker-icon" />
                <DatePicker
                  selected={dateRange.start}
                  onChange={(date) => setDateRange({ ...dateRange, start: date })}
                  selectsStart
                  startDate={dateRange.start}
                  endDate={dateRange.end}
                  maxDate={dateRange.end}
                  className="date-picker-input"
                  dateFormat="MMM d, yyyy"
                />
              </div>
              <span className="date-range-separator">to</span>
              <div className="date-picker-group">
                <FiCalendar className="date-picker-icon" />
                <DatePicker
                  selected={dateRange.end}
                  onChange={(date) => setDateRange({ ...dateRange, end: date })}
                  selectsEnd
                  startDate={dateRange.start}
                  endDate={dateRange.end}
                  minDate={dateRange.start}
                  maxDate={new Date()}
                  className="date-picker-input"
                  dateFormat="MMM d, yyyy"
                />
              </div>
            </div>
            <div className="filter-controls">
              <button className="filter-button">
                <FiFilter />
                <span>Filter Properties</span>
              </button>
            </div>
          </section>

          <section className="metrics-grid">
            {tiles.map((tile, index) => (
              <div key={index} className={`metric-card ${tile.color}`}>
                <div className="metric-icon">{tile.icon}</div>
                <div className="metric-content">
                  <h3>{tile.title}</h3>
                  <p className="metric-value">{tile.value}</p>
                </div>
              </div>
            ))}
          </section>

          <section className="data-section">
            <h2 className="section-title">
              Listing Performance
              <span className="date-range-label">
                {format(dateRange.start, 'MMM d, yyyy')} - {format(dateRange.end, 'MMM d, yyyy')}
              </span>
            </h2>
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
                    <th>
                      <div className="table-header-cell">
                        <FiMessageSquare />
                        <span>Messages</span>
                      </div>
                    </th>
                    <th>Last Viewed</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStats.map((l, i) => {
                    const viewsExMe = (l.viewsLog || []).filter((v) => v.viewer !== userKey).length;
                    const uniq = new Set(
                      (l.viewsLog || [])
                        .filter((v) => v.viewer && v.viewer !== userKey)
                        .map((v) => v.viewer)
                    ).size;
                    const propertyMessages = messageStats.messagesPerProperty.find(
                      item => item.propertyId === l._id
                    )?.count || 0;
                    const lastView = l.viewsLog?.length 
                      ? format(new Date(l.viewsLog[l.viewsLog.length - 1].date), 'MMM d, yyyy')
                      : 'Never';

                    return (
                      <tr 
                        key={l._id} 
                        className={activeProperty === l._id ? 'active' : ''}
                        onClick={() => handlePropertyClick(l._id)}
                      >
                        <td>{i + 1}</td>
                        <td className="address-cell">
                          <div className="property-address">
                            <span>{l.propertyAddress}</span>
                            <span className="property-locality">{l.locality}</span>
                          </div>
                        </td>
                        <td>
                          <div className="metric-with-trend">
                            {viewsExMe}
                            {viewsExMe > 0 && <FiTrendingUp className="trend-up" />}
                          </div>
                        </td>
                        <td>{uniq}</td>
                        <td>
                          <div className="metric-with-trend">
                            {propertyMessages}
                            {propertyMessages > 0 && <FiTrendingUp className="trend-up" />}
                          </div>
                        </td>
                        <td>{lastView}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className="charts-section">
            <div className="chart-grid">
              <div className="chart-card">
                <div className="chart-header">
                  <FiTrendingUp className="chart-icon" />
                  <h3>Daily Views Trend</h3>
                </div>
                <div className="chart-container">
                  {processedData.lineData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={processedData.lineData}>
                        <defs>
                          <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fill: '#6b7280' }}
                          tickFormatter={(date) => format(new Date(date), 'MMM d')}
                        />
                        <YAxis 
                          allowDecimals={false} 
                          tick={{ fill: '#6b7280' }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                          type="monotone"
                          dataKey={activeProperty || "total"}
                          stroke="#4f46e5"
                          fillOpacity={1}
                          fill="url(#colorViews)"
                          activeDot={{ r: 6 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="no-data-message">
                      No view data available for the selected period
                    </div>
                  )}
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-header">
                  <FiMessageSquare className="chart-icon" />
                  <h3>Messages by Property</h3>
                </div>
                <div className="chart-container">
                  {processedData.messageBarData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart 
                        data={processedData.messageBarData.slice(0, 5)} 
                        layout="vertical"
                      >
                        <defs>
                          <linearGradient id="gradMsg" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="#93c5fd" />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} horizontal={false} />
                        <XAxis 
                          type="number" 
                          tick={{ fill: '#6b7280' }}
                        />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          width={100}
                          tick={{ fill: '#6b7280' }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar
                          dataKey="count"
                          name="Messages"
                          fill="url(#gradMsg)"
                          radius={[0, 4, 4, 0]}
                          barSize={20}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="no-data-message">
                      No message data available
                    </div>
                  )}
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-header">
                  <FiMapPin className="chart-icon" />
                  <h3>Listings by Locality</h3>
                </div>
                <div className="chart-container">
                  {processedData.localityData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={processedData.localityData.slice(0, 5)}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                          nameKey="locality"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {processedData.localityData.slice(0, 5).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={palette[index % palette.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend 
                          layout="vertical" 
                          align="right" 
                          verticalAlign="middle" 
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="no-data-message">
                      No locality data available
                    </div>
                  )}
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-header">
                  <FiLayers className="chart-icon" />
                  <h3>Listings by Property Type</h3>
                </div>
                <div className="chart-container">
                  {processedData.typeData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={processedData.typeData.slice(0, 5)}>
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
                        <Tooltip content={<CustomTooltip />} />
                        <Bar
                          dataKey="count"
                          name="Listings"
                          fill="url(#gradType)"
                          radius={[4, 4, 0, 0]}
                          barSize={30}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="no-data-message">
                      No property type data available
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default Dashboard;