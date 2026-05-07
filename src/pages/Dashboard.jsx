import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Rss, 
  FileText, 
  Megaphone, 
  TrendingUp, 
  ArrowUpRight,
  ShieldCheck,
  Activity
} from 'lucide-react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend, 
  Filler 
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useAuth } from '../context/AuthContext';
import { feedService, blogService, adsService, contactService } from '../services/api';
import './Dashboard.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Dashboard = () => {
  const [totals, setTotals] = useState({ news: '...', blogs: '...', ads: '...', contacts: '...' });
  const [systemStatus, setSystemStatus] = useState({ status: 'checking', news_scheduler: 'checking' });
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      // News Total
      try {
        const res = await feedService.getFeed({ q: 'all', limit: 1 });
        setTotals(prev => ({ ...prev, news: (res.data.total || 0).toLocaleString() }));
      } catch (e) { console.error("News fetch error", e); }

      // Blogs Total
      try {
        const res = await blogService.getAllBlogs({ limit: 1 });
        setTotals(prev => ({ ...prev, blogs: (res.data.total || 0).toLocaleString() }));
      } catch (e) { console.error("Blogs fetch error", e); }

      // Ads Total
      try {
        const res = await adsService.getAllAds({ limit: 1 });
        setTotals(prev => ({ ...prev, ads: (res.data.total || 0).toLocaleString() }));
      } catch (e) { console.error("Ads fetch error", e); }

      // Contacts Total
      try {
        const res = await contactService.getAllContacts(user?.token);
        const count = (Array.isArray(res.data) ? res.data : (res.data.data || [])).length;
        setTotals(prev => ({ ...prev, contacts: count.toLocaleString() }));
      } catch (e) { console.error("Contacts fetch error", e); }

      // Health Check
      try {
        const res = await fetch('https://api.fhmnews.com/health').then(r => r.json());
        setSystemStatus(res);
      } catch (e) { console.error("Health check error", e); }
    };

    if (user) fetchData();
  }, [user]);

  const stats = [
    { title: 'Total News', value: totals.news, icon: <Rss />, change: '+12%', positive: true },
    { title: 'Total Blogs', value: totals.blogs, icon: <FileText />, change: '+5%', positive: true },
    { title: 'Active Ads', value: totals.ads, icon: <Megaphone />, change: '-2%', positive: false },
    { title: 'New Contacts', value: totals.contacts, icon: <Users />, change: '+18%', positive: true },
  ];

  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Traffic Overview',
        data: [30, 45, 35, 60, 55, 80],
        fill: true,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#f8fafc',
        bodyColor: '#94a3b8',
        padding: 12,
        cornerRadius: 8,
      },
    },
    scales: {
      y: { display: false },
      x: {
        grid: { display: false },
        ticks: { color: '#64748b' }
      }
    }
  };

  return (
    <div className="page-container animate-fade-in">
      <header className="page-header">
        <div>
          <h1>Dashboard Overview</h1>
          <p>Welcome back! Here's what's happening with FHM News.</p>
        </div>
        <div className="system-health glass">
          <div className="health-item">
            <ShieldCheck size={16} className={systemStatus.status === 'healthy' ? 'text-accent' : ''} />
            <span>System: {systemStatus.status}</span>
          </div>
          <div className="health-divider"></div>
          <div className="health-item">
            <Activity size={16} className={systemStatus.news_scheduler === 'running' ? 'text-primary' : ''} />
            <span>Scheduler: {systemStatus.news_scheduler}</span>
          </div>
        </div>
      </header>

      <div className="stats-grid">
        {stats.map((stat, i) => (
          <div key={i} className="glass-card stat-card">
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-content">
              <span className="stat-title">{stat.title}</span>
              <h2 className="stat-value">{stat.value}</h2>
              <div className={`stat-change ${stat.positive ? 'positive' : 'negative'}`}>
                <ArrowUpRight size={14} style={{ transform: stat.positive ? 'none' : 'rotate(90deg)' }} />
                <span>{stat.change} this month</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-charts">
        <div className="glass-card chart-container">
          <div className="chart-header">
            <h3>Analytics Performance</h3>
            <div className="chart-legend">
              <span className="dot"></span>
              <span>Daily Views</span>
            </div>
          </div>
          <div className="chart-wrapper">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        <div className="glass-card recent-activity">
          <h3>Recent Activity</h3>
          <div className="activity-list">
            {[
              { text: 'System triggered news refresh', time: '5 mins ago' },
              { text: 'Admin updated blog categories', time: '1 hour ago' },
              { text: 'New contact inquiry received', time: '3 hours ago' },
              { text: 'Ad campaign "Summer Sale" started', time: 'Yesterday' }
            ].map((activity, i) => (
              <div key={i} className="activity-item">
                <div className="activity-avatar"></div>
                <div className="activity-details">
                  <p>{activity.text}</p>
                  <span>{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .system-health {
          display: flex;
          align-items: center;
          padding: 0.75rem 1.25rem;
          border-radius: var(--radius-md);
          gap: 1rem;
        }
        .health-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          color: var(--text-muted);
        }
        .health-divider {
          width: 1px;
          height: 16px;
          background: var(--border);
        }
        .text-accent { color: var(--accent) !important; }
        .text-primary { color: var(--primary) !important; }
      `}} />
    </div>
  );
};

export default Dashboard;
