import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StaffHeader from '../Header/StaffHeader';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import './StaffDashboard.css';

const StaffDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
  totalListings: 0,
  totalUsers: 0,
  todayListings: 0,
  activeListings: 0,
  weeklyListings: 0,
  monthlyListings: 0,
  weeklyUsers: 0,
  monthlyUsers: 0,
  listingsByLocation: [],
  usersByLocation: [],
  openTickets: 0,
  inProgressTickets: 0,
  resolvedTickets: 0,
  totalTickets: 0
});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('staffToken');
    if (!token) {
      navigate('/staff/login');
    } else {
      fetchDashboardData();
    }
  }, [navigate]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('staffToken');
      const response = await fetch('http://localhost:5000/api/staff/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      
      const data = await response.json();
      setStats({
        totalListings: data.totalListings || 0,
        totalUsers: data.totalUsers || 0,
        todayListings: data.todayListings || 0,
        activeListings: data.activeListings || 0,
        weeklyListings: data.weeklyListings || 0,
        monthlyListings: data.monthlyListings || 0,
        weeklyUsers: data.weeklyUsers || 0,
        monthlyUsers: data.monthlyUsers || 0,
        listingsByLocation: data.listingsByCity || [],
        usersByLocation: data.usersByLocation || [],
        openTickets: data.openTickets || 0,
        inProgressTickets: data.inProgressTickets || 0,
        resolvedTickets: data.resolvedTickets || 0,
        totalTickets: data.totalTickets || 0
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('staffToken');
    navigate('/staff/login');
  };

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
  <div className="staff-dashboard">
    <StaffHeader />
    <div className="dashboard-header">
      <h1>Dashboard Overview</h1>
      <button onClick={handleLogout} className="logout-btn">
        Sign Out
      </button>
    </div>

    {loading ? (
      <div className="loading-state">Loading data...</div>
    ) : (
      <>
        {/* Main Stats Grid */}
        <div className="stats-grid">
          {/* Property Stats */}
          <div className="stat-card">
            <h3>Total Listings</h3>
            <p>{stats.totalListings.toLocaleString()}</p>
          </div>
          <div className="stat-card">
            <h3>Total Users</h3>
            <p>{stats.totalUsers.toLocaleString()}</p>
          </div>
          <div className="stat-card">
            <h3>Active Listings</h3>
            <p>{stats.activeListings.toLocaleString()}</p>
          </div>
          <div className="stat-card">
            <h3>Today's Listings</h3>
            <p>{stats.todayListings.toLocaleString()}</p>
          </div>
          
          {/* Ticket Stats */}
          <div className="stat-card">
            <h3>Total Tickets</h3>
            <p>{stats.totalTickets.toLocaleString()}</p>
          </div>
          <div className="stat-card">
            <h3>Open Tickets</h3>
            <p>{stats.openTickets.toLocaleString()}</p>
          </div>
          <div className="stat-card">
            <h3>In Progress</h3>
            <p>{stats.inProgressTickets.toLocaleString()}</p>
          </div>
          <div className="stat-card">
            <h3>Resolved</h3>
            <p>{stats.resolvedTickets.toLocaleString()}</p>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="dashboard-section">
          <h2 className="section-title">Recent Activity</h2>
          <div className="activity-grid">
            <div className="activity-card">
              <h3>Listings</h3>
              <div className="activity-stats">
                <div>
                  <span>This Week</span>
                  <strong>{stats.weeklyListings}</strong>
                </div>
                <div>
                  <span>This Month</span>
                  <strong>{stats.monthlyListings}</strong>
                </div>
              </div>
            </div>
            <div className="activity-card">
              <h3>Users</h3>
              <div className="activity-stats">
                <div>
                  <span>This Week</span>
                  <strong>{stats.weeklyUsers}</strong>
                </div>
                <div>
                  <span>This Month</span>
                  <strong>{stats.monthlyUsers}</strong>
                </div>
              </div>
            </div>
            <div className="activity-card">
              <h3>Tickets</h3>
              <div className="activity-stats">
                <div>
                  <span>Open</span>
                  <strong>{stats.openTickets}</strong>
                </div>
                <div>
                  <span>In Progress</span>
                  <strong>{stats.inProgressTickets}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="dashboard-section">
          <h2 className="section-title">Analytics</h2>
          <div className="charts-grid">
            <div className="chart-card">
              <h3>Listings by Location</h3>
              {stats.listingsByLocation?.length > 0 ? (
                <BarChart
                  width={500}
                  height={300}
                  data={stats.listingsByLocation}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="_id" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : (
                <p className="no-data">No listing data available</p>
              )}
            </div>
            
            <div className="chart-card">
              <h3>Users by Location</h3>
              {stats.usersByLocation?.length > 0 ? (
                <PieChart width={400} height={300}>
                  <Pie
                    data={stats.usersByLocation}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="_id"
                    label={({ name, count }) => `${name}: ${count}`}
                  >
                    {stats.usersByLocation.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              ) : (
                <p className="no-data">No user data available</p>
              )}
            </div>
          </div>
        </div>
      </>
    )}
  </div>
);
};

export default StaffDashboard;