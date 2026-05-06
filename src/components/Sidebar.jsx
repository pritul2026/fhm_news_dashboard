import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Rss, 
  FileText, 
  Megaphone, 
  MessageSquare, 
  LogOut,
  Flame
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const Sidebar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/' },
    { name: 'News Feed', icon: <Rss size={20} />, path: '/news' },
    { name: 'Blogs', icon: <FileText size={20} />, path: '/blogs' },
    { name: 'Ads Management', icon: <Megaphone size={20} />, path: '/ads' },
    { name: 'Contacts', icon: <MessageSquare size={20} />, path: '/contacts' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar glass">
      <div className="sidebar-header">
        <div className="logo">
          <Flame className="logo-icon" />
          <span className="logo-text">FHM <span className="text-gradient">News</span></span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink 
            key={item.path} 
            to={item.path} 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button onClick={handleLogout} className="logout-btn">
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
