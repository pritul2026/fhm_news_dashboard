import { Search, Bell, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Topbar.css';

const Topbar = () => {
  const { user } = useAuth();

  return (
    <header className="topbar glass">
      <div className="search-box">
        <Search size={18} className="search-icon" />
        <input type="text" placeholder="Search for news, blogs, ads..." />
      </div>

      <div className="topbar-actions">
        <button className="icon-btn">
          <Bell size={20} />
          <span className="badge"></span>
        </button>
        
        <div className="user-profile">
          <div className="user-info">
            <span className="username">{user?.username}</span>
            <span className="role">{user?.role}</span>
          </div>
          <div className="avatar">
            <User size={20} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
