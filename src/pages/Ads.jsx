import React, { useState, useEffect } from 'react';
import { Plus, Megaphone, ExternalLink, AlertCircle, Send, ToggleLeft, ToggleRight, X } from 'lucide-react';
import { adsService } from '../services/api';
import DataTable from '../components/DataTable';
import { toast } from 'react-toastify';

const Ads = () => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAd, setNewAd] = useState({
    image_link: '',
    ads_type: 'top',
    visit_link: '',
    status: 'active'
  });

  const fetchAds = async () => {
    setLoading(true);
    try {
      const response = await adsService.getAllAds();
      setAds(response.data.data || []);
    } catch (error) {
      toast.error('Failed to fetch ads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  const validateURL = (url) => {
    return url && (url.startsWith('http://') || url.startsWith('https://'));
  };

  const handleCreateAd = async (e) => {
    e.preventDefault();
    if (!validateURL(newAd.image_link)) {
      toast.error('Image URL must start with http:// or https://');
      return;
    }
    if (!validateURL(newAd.visit_link)) {
      toast.error('Destination Link must start with http:// or https://');
      return;
    }

    try {
      await adsService.createAd(newAd);
      toast.success('Ad created successfully');
      setIsModalOpen(false);
      setNewAd({ image_link: '', ads_type: 'top', visit_link: '', status: 'active' });
      fetchAds();
    } catch (error) {
      const detail = error.response?.data?.detail;
      const msg = Array.isArray(detail) ? detail[0]?.msg : (detail || 'Server error');
      toast.error(`Error: ${msg}`);
    }
  };

  const handleToggleStatus = async (row) => {
    const currentStatus = row.Ad?.Status || row.Ad?.status || 'inactive';
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    const updateData = {
      image_link: row.Ad?.["Image Link"] || row.Ad?.image_link,
      ads_type: row.Ad?.["Ads Type"] || row.Ad?.ads_type,
      visit_link: row.Ad?.["Visit Link"] || row.Ad?.visit_link,
      status: newStatus
    };

    try {
      await adsService.updateAd(row.id, updateData);
      toast.success(`Ad status changed to ${newStatus}`);
      fetchAds();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDeleteAd = async (row) => {
    if (window.confirm('Are you sure you want to delete this ad?')) {
      try {
        await adsService.deleteAd(row.id);
        toast.success('Ad deleted successfully');
        fetchAds();
      } catch (error) {
        toast.error('Failed to delete ad');
      }
    }
  };

  const columns = [
    {
      header: 'Preview',
      accessor: 'Ad',
      render: (val) => (
        <img src={val?.["Image Link"] || val?.image_link} alt="Ad" className="ad-preview-img" />
      )
    },
    {
      header: 'Type',
      accessor: 'Ad',
      render: (val) => val?.["Ads Type"] || val?.ads_type
    },
    {
      header: 'Destination',
      accessor: 'Ad',
      render: (val) => {
        const link = val?.["Visit Link"] || val?.visit_link || '#';
        return (
          <a href={link} target="_blank" rel="noopener noreferrer" className="link-cell">
            {link.substring(0, 30)}... <ExternalLink size={12} />
          </a>
        );
      }
    },
    {
      header: 'Status',
      accessor: 'Ad',
      render: (val, row) => {
        const status = val?.["Status"] || val?.status || 'inactive';
        return (
          <div className="status-toggle-wrapper">
            <span className={`status-pill ${status.toLowerCase()}`}>{status}</span>
            <button 
              className="toggle-status-btn" 
              onClick={() => handleToggleStatus(row)}
              title={`Switch to ${status === 'active' ? 'inactive' : 'active'}`}
            >
              {status === 'active' ? <ToggleRight size={20} className="text-accent" /> : <ToggleLeft size={20} className="text-muted" />}
            </button>
          </div>
        );
      }
    },
  ];

  return (
    <div className="page-container animate-fade-in">
      <header className="page-header">
        <div>
          <h1>Ads Management</h1>
          <p>Control the advertising banners across the platform.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-submit" style={{ marginTop: 0 }}>
          <Plus size={18} />
          <span>Create Ad</span>
        </button>
      </header>

      <DataTable
        columns={columns}
        data={ads}
        loading={loading}
        onDelete={handleDeleteAd}
      />

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content animate-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Advertisement</h3>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleCreateAd} className="modal-form">
                <div className="alert-box">
                  <AlertCircle size={16} />
                  <span>Backend only accepts real URLs (http/https). Base64 images are not supported.</span>
                </div>

                <div className="form-row">
                  <div className="form-group form-group-full">
                    <label>Image URL</label>
                    <input
                      type="text"
                      placeholder="https://example.com/banner.jpg"
                      value={newAd.image_link}
                      onChange={(e) => setNewAd({ ...newAd, image_link: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group form-group-full">
                    <label>Destination Link</label>
                    <input
                      type="text"
                      placeholder="https://sponsor-website.com"
                      value={newAd.visit_link}
                      onChange={(e) => setNewAd({ ...newAd, visit_link: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Ad Type</label>
                    <select
                      value={newAd.ads_type}
                      onChange={(e) => setNewAd({ ...newAd, ads_type: e.target.value })}
                    >
                      <option value="top">Top Banner</option>
                      <option value="sidebar">Sidebar</option>
                      <option value="middle">In-Content</option>
                      <option value="bottom">Bottom</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select
                      value={newAd.status}
                      onChange={(e) => setNewAd({ ...newAd, status: e.target.value })}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                <div className="form-footer">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-cancel">Cancel</button>
                  <button type="submit" className="btn-submit">
                    <Send size={16} />
                    <span>Create Ad</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        .ad-preview-img { width: 80px; height: 50px; border-radius: 4px; object-fit: cover; border: 1px solid var(--border); }
        .link-cell { color: var(--primary); text-decoration: none; display: flex; align-items: center; gap: 0.25rem; font-size: 0.8rem; }
        .link-cell:hover { text-decoration: underline; }
        .status-toggle-wrapper { display: flex; align-items: center; gap: 0.75rem; }
        .status-pill { padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600; text-transform: capitalize; }
        .status-pill.active { background: rgba(16, 185, 129, 0.1); color: var(--accent); }
        .status-pill.inactive { background: rgba(239, 68, 68, 0.1); color: var(--danger); }
        .toggle-status-btn { background: none; border: none; cursor: pointer; padding: 0.25rem; display: flex; align-items: center; transition: var(--transition); }
        .toggle-status-btn:hover { transform: scale(1.1); }
      `}} />
    </div>
  );
};

export default Ads;
