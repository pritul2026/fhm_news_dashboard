import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, AlertCircle, Send, X } from 'lucide-react';
import { feedService } from '../services/api';
import DataTable from '../components/DataTable';
import { toast } from 'react-toastify';

import Modal from '../components/Modal';

const NewsFeed = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFetchModalOpen, setIsFetchModalOpen] = useState(false);

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

  const [fetchParams, setFetchParams] = useState({
    categories: 'sports',
    search: 'ipl',
    published_on: new Date().toISOString().split('T')[0],
    language: 'en',
    limit: 15
  });

  const [fetchResult, setFetchResult] = useState(null);

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
    if (newPost.title.length < 3) {
      toast.warning('Title must be at least 3 characters');
      return;
    }
    if (newPost.excerpt.length < 10) {
      toast.warning('Excerpt must be at least 10 characters');
      return;
    }
    if (newPost.content.length < 20) {
      toast.warning('Content must be at least 20 characters');
      return;
    }
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

  const handleFetchSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    toast.info('Fetching from External API...');
    try {
      const response = await feedService.fetchCustom(fetchParams);
      setFetchResult(response.data);
      toast.success('Fetch completed!');
      fetchNews();
    } catch (error) {
      toast.error('Failed to fetch from API');
    } finally {
      setLoading(false);
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
          <button onClick={() => setIsFetchModalOpen(true)} className="refresh-btn" style={{ background: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}>
            <Send size={16} />
            <span>Fetch from API</span>
          </button>
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

      {/* Manual Creation Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New News Post"
        size="large"
      >
        <form onSubmit={handleCreatePost} className="modal-form">
          <div className="alert-box">
            <AlertCircle size={15} />
            <span>All URL fields must start with <strong>http://</strong> or <strong>https://</strong>. Categories are comma-separated.</span>
          </div>

          <div className="form-row">
            <div className="form-group form-group-full">
              <label>Article Title (Min 3)</label>
              <input
                type="text"
                placeholder="Breaking: India launches new space mission..."
                value={newPost.title}
                onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                required
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <small style={{ color: newPost.title.length < 3 ? '#ef4444' : '#10b981', fontWeight: 600 }}>
                  {newPost.title.length} / 3
                </small>
              </div>
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
              <label>Excerpt (Min 10)</label>
              <textarea
                rows="2"
                placeholder="Short summary of the article..."
                value={newPost.excerpt}
                onChange={(e) => setNewPost({ ...newPost, excerpt: e.target.value })}
                required
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <small style={{ color: newPost.excerpt.length < 10 ? '#ef4444' : '#10b981', fontWeight: 600 }}>
                  {newPost.excerpt.length} / 10
                </small>
              </div>
            </div>

            <div className="form-group form-group-full">
              <label>Full Content (Min 20)</label>
              <textarea
                rows="5"
                placeholder="Full article body..."
                value={newPost.content}
                onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                required
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <small style={{ color: newPost.content.length < 20 ? '#ef4444' : '#10b981', fontWeight: 600 }}>
                  {newPost.content.length} / 20
                </small>
              </div>
            </div>
          </div>

          <div className="modal-footer" style={{ padding: '1.25rem 0 0 0', background: 'transparent', border: 'none' }}>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-cancel">Cancel</button>
            <button type="submit" className="btn-submit">
              <Send size={15} />
              <span>Publish Post</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Fetch from External API Modal */}
      <Modal
        isOpen={isFetchModalOpen}
        onClose={() => {
          setIsFetchModalOpen(false);
          setFetchResult(null);
        }}
        title="Fetch News from External API"
      >
        {!fetchResult ? (
          <form onSubmit={handleFetchSubmit} className="modal-form">
            <div className="alert-box" style={{ background: 'rgba(16, 185, 129, 0.08)', borderColor: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}>
              <Send size={15} />
              <span>This will fetch news from the external API and save them to your database.</span>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Category</label>
                <input
                  type="text"
                  value={fetchParams.categories}
                  onChange={(e) => setFetchParams({ ...fetchParams, categories: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Search Query</label>
                <input
                  type="text"
                  value={fetchParams.search}
                  onChange={(e) => setFetchParams({ ...fetchParams, search: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Published On</label>
                <input
                  type="date"
                  value={fetchParams.published_on}
                  onChange={(e) => setFetchParams({ ...fetchParams, published_on: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Language</label>
                <select
                  value={fetchParams.language}
                  onChange={(e) => setFetchParams({ ...fetchParams, language: e.target.value })}
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                </select>
              </div>
              <div className="form-group form-group-full">
                <label>Result Limit</label>
                <input
                  type="number"
                  value={fetchParams.limit}
                  onChange={(e) => setFetchParams({ ...fetchParams, limit: parseInt(e.target.value) })}
                  required
                />
              </div>
            </div>

            <div className="modal-footer" style={{ padding: '1.25rem 0 0 0', background: 'transparent', border: 'none' }}>
              <button type="button" onClick={() => setIsFetchModalOpen(false)} className="btn-cancel">Cancel</button>
              <button type="submit" disabled={loading} className="btn-submit" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 10px 20px -5px rgba(16, 185, 129, 0.4)' }}>
                <Send size={15} />
                <span>{loading ? 'Fetching...' : 'Fetch News'}</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="fetch-results animate-fade-in">
            <div className="result-header">
              <div className="result-icon-success">
                <AlertCircle size={32} />
              </div>
              <h3>Fetch Completed Successfully</h3>
              <p>{fetchResult.message}</p>
            </div>

            <div className="result-stats-grid">
              <div className="res-stat-card">
                <span>Inserted</span>
                <h4 style={{ color: '#10b981' }}>{fetchResult.inserted}</h4>
              </div>
              <div className="res-stat-card">
                <span>Skipped</span>
                <h4 style={{ color: '#f59e0b' }}>{fetchResult.skipped}</h4>
              </div>
              <div className="res-stat-card">
                <span>Total Fetched</span>
                <h4>{fetchResult.total_fetched}</h4>
              </div>
            </div>

            {fetchResult.categories_seen?.length > 0 && (
              <div className="res-categories">
                <label>Categories Seen:</label>
                <div className="res-cat-tags">
                  {fetchResult.categories_seen.map((cat, i) => (
                    <span key={i} className="res-cat-tag">{cat}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="modal-footer" style={{ padding: '1.5rem 0 0 0', background: 'transparent', border: 'none' }}>
              <button 
                type="button" 
                onClick={() => {
                  setIsFetchModalOpen(false);
                  setFetchResult(null);
                }} 
                className="btn-submit"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Done
              </button>
            </div>
          </div>
        )}
      </Modal>


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

        /* Fetch Results Styling */
        .fetch-results { padding: 1rem 0; }
        .result-header { text-align: center; margin-bottom: 2rem; }
        .result-icon-success { 
          width: 64px; height: 64px; background: rgba(16, 185, 129, 0.1); 
          color: #10b981; border-radius: 50%; display: flex; 
          align-items: center; justify-content: center; margin: 0 auto 1rem;
        }
        .result-header h3 { font-size: 1.25rem; margin-bottom: 0.5rem; color: var(--text-main); }
        .result-header p { font-size: 0.9rem; color: var(--text-dim); }

        .result-stats-grid { 
          display: grid; grid-template-columns: repeat(3, 1fr); 
          gap: 1rem; margin-bottom: 2rem; 
        }
        .res-stat-card { 
          background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border); 
          padding: 1rem; border-radius: var(--radius-md); text-align: center;
        }
        .res-stat-card span { font-size: 0.75rem; color: var(--text-dim); display: block; margin-bottom: 0.5rem; }
        .res-stat-card h4 { font-size: 1.5rem; font-weight: 700; }

        .res-categories { margin-bottom: 1rem; }
        .res-categories label { font-size: 0.85rem; color: var(--text-dim); margin-bottom: 0.75rem; display: block; }
        .res-cat-tags { display: flex; gap: 0.5rem; flex-wrap: wrap; }
        .res-cat-tag { 
          padding: 0.3rem 0.75rem; background: rgba(59, 130, 246, 0.1); 
          color: #60a5fa; border-radius: 20px; font-size: 0.75rem; font-weight: 600; 
        }
      `}} />
    </div>
  );
};

export default NewsFeed;