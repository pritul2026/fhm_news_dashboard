import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, AlertCircle, Send, X } from 'lucide-react';
import { feedService } from '../services/api';
import DataTable from '../components/DataTable';
import { toast } from 'react-toastify';

const NewsFeed = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [newPost, setNewPost] = useState({
    title: '',
    source_url: '',
    excerpt: '',
    content: '',
    imageSrc: '',
    categories: '',
    source_name: 'FHM News Admin',
    author_name: 'Admin'
  });

  const fetchNews = async () => {
    setLoading(true);
    try {
      const response = await feedService.getFeed({ q: 'all', limit: 50 });
      setNews(response.data.response || []);
    } catch (error) {
      toast.error('Failed to fetch news feed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const validateURL = (url) => {
    return url && (url.startsWith('http://') || url.startsWith('https://'));
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!validateURL(newPost.source_url)) {
      toast.error('Source URL must start with http:// or https://');
      return;
    }
    if (newPost.imageSrc && !validateURL(newPost.imageSrc)) {
      toast.error('Image URL must start with http:// or https://');
      return;
    }
    const categoriesArray = newPost.categories.split(',').map(c => c.trim()).filter(Boolean);
    if (categoriesArray.length === 0) {
      toast.warning('Please add at least one category');
      return;
    }
    try {
      await feedService.createPost({ ...newPost, categories: categoriesArray });
      toast.success('News article created successfully');
      setIsModalOpen(false);
      setNewPost({ title: '', source_url: '', excerpt: '', content: '', imageSrc: '', categories: '', source_name: 'FHM News Admin', author_name: 'Admin' });
      fetchNews();
    } catch (error) {
      const detail = error.response?.data?.detail;
      const msg = Array.isArray(detail) ? detail[0]?.msg : (detail || 'Server error');
      toast.error(`Error: ${msg}`);
    }
  };

  const handleDelete = async (row) => {
    if (window.confirm(`Delete "${row.title}"?`)) {
      try {
        await feedService.deleteBySlug(row.slug);
        toast.success('Article deleted');
        fetchNews();
      } catch {
        toast.error('Failed to delete article');
      }
    }
  };

  const handleRefresh = async () => {
    toast.info('Syncing feed...');
    try {
      await feedService.triggerRefresh();
      toast.success('Feed synced!');
      fetchNews();
    } catch {
      toast.error('Sync failed');
    }
  };

  const filtered = news.filter(n =>
    (n.title || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      header: 'Title',
      accessor: 'title',
      render: (val, row) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{val || 'Untitled'}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{row.slug || '—'}</span>
        </div>
      )
    },
    {
      header: 'Source',
      accessor: 'author',
      render: (val) => val?.source_name || 'N/A'
    },
    {
      header: 'Categories',
      accessor: 'categories',
      render: (val) => (
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {val?.map((cat, i) => (
            <span key={i} style={{ padding: '0.2rem 0.6rem', background: 'rgba(59,130,246,0.12)', color: '#60a5fa', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 600 }}>
              {cat}
            </span>
          ))}
        </div>
      )
    },
    {
      header: 'Published',
      accessor: 'date',
      render: (val) => val ? new Date(val).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
    },
  ];

  return (
    <div className="page-container animate-fade-in">
      <header className="page-header">
        <div>
          <h1>News Feed</h1>
          <p>Manage and monitor all incoming news articles.</p>
        </div>
        <div className="header-actions">
          <button onClick={handleRefresh} className="refresh-btn">
            <RefreshCw size={16} />
            <span>Sync Feed</span>
          </button>
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="btn-submit" 
            style={{ marginTop: 0 }}
          >
            <Plus size={18} />
            <span>Add Post</span>
          </button>
        </div>
      </header>

      <div className="table-controls glass">
        <div className="page-search-box">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ color: 'var(--text-dim)', flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Search articles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        onDelete={handleDelete}
        onEdit={(row) => toast.info(`Editing: ${row.title}`)}
      />

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content animate-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New News Post</h3>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleCreatePost} className="modal-form">
                <div className="alert-box">
                  <AlertCircle size={15} />
                  <span>All URL fields must start with <strong>http://</strong> or <strong>https://</strong>. Categories are comma-separated.</span>
                </div>

                <div className="form-row">
                  <div className="form-group form-group-full">
                    <label>Article Title</label>
                    <input
                      type="text"
                      placeholder="Breaking: India launches new space mission..."
                      value={newPost.title}
                      onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group form-group-full">
                    <label>Source URL</label>
                    <input
                      type="text"
                      placeholder="https://example.com/article"
                      value={newPost.source_url}
                      onChange={(e) => setNewPost({ ...newPost, source_url: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Author Name</label>
                    <input
                      type="text"
                      value={newPost.author_name}
                      onChange={(e) => setNewPost({ ...newPost, author_name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Source Name</label>
                    <input
                      type="text"
                      value={newPost.source_name}
                      onChange={(e) => setNewPost({ ...newPost, source_name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group form-group-full">
                    <label>Image URL</label>
                    <input
                      type="text"
                      placeholder="https://example.com/image.jpg"
                      value={newPost.imageSrc}
                      onChange={(e) => setNewPost({ ...newPost, imageSrc: e.target.value })}
                    />
                  </div>

                  <div className="form-group form-group-full">
                    <label>Categories (comma separated)</label>
                    <input
                      type="text"
                      placeholder="india, science, space"
                      value={newPost.categories}
                      onChange={(e) => setNewPost({ ...newPost, categories: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group form-group-full">
                    <label>Excerpt</label>
                    <textarea
                      rows="2"
                      placeholder="Short summary of the article..."
                      value={newPost.excerpt}
                      onChange={(e) => setNewPost({ ...newPost, excerpt: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group form-group-full">
                    <label>Full Content</label>
                    <textarea
                      rows="5"
                      placeholder="Full article body..."
                      value={newPost.content}
                      onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-footer">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-cancel">Cancel</button>
                  <button type="submit" className="btn-submit">
                    <Send size={15} />
                    <span>Publish Post</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .header-actions { display: flex; gap: 1rem; align-items: center; }
        .refresh-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border);
          color: white;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: var(--transition);
        }
        .refresh-btn:hover { background: rgba(255, 255, 255, 0.1); }
      `}} />
    </div>
  );
};

export default NewsFeed;