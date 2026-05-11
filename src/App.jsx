import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import NewsFeed from './pages/NewsFeed';
import Blogs from './pages/Blogs';
import Ads from './pages/Ads';
import Contacts from './pages/Contacts';
import Categories from './pages/Categories';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" replace />} />
      
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <div className="dashboard-layout">
              <Sidebar />
              <div className="main-content">
                <Topbar />
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/news" element={<NewsFeed />} />
                  <Route path="/blogs" element={<Blogs />} />
                  <Route path="/ads" element={<Ads />} />
                  <Route path="/contacts" element={<Contacts />} />
                  <Route path="/categories" element={<Categories />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </div>
            </div>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
