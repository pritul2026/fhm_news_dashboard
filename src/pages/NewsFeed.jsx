import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, AlertCircle, Send, X, Trash2, Calendar } from 'lucide-react';
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
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingSlug, setEditingSlug] = useState('');
  const [categoriesList, setCategoriesList] = useState(['all']);
  
  // Bulk Delete State
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [bulkDeleteDates, setBulkDeleteDates] = useState({ start: '', end: '' });
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [bulkDeleteResult, setBulkDeleteResult] = useState(null);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 15;

  const [filters, setFilters] = useState({
    category: 'all',
    start_date: '',
    end_date: '',
    q: ''
  });

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
      let response;
      const hasFilters = filters.category !== 'all' || filters.start_date || filters.end_date || filters.q;
      
      if (hasFilters) {
        response = await feedService.filterNews({
          category: filters.category === 'all' ? undefined : filters.category,
          start_date: filters.start_date || undefined,
          end_date: filters.end_date || undefined,
          q: filters.q || undefined,
          page: currentPage,
          limit: itemsPerPage
        });
        setTotalPages(response.data.total_pages || 1);
      } else {
        response = await feedService.getFeed({ 
          q: 'all', 
          page: currentPage, 
          limit: itemsPerPage 
        });
        // Calculate total pages for getFeed if not provided
        const total = response.data.total || 0;
        setTotalPages(Math.ceil(total / itemsPerPage) || 1);
      }
      setNews(response.data.response || []);
    } catch (error) {
      toast.error('Failed to fetch news feed');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await feedService.getCategories(); 
      setCategoriesList(res.data.categories || ['all']);
    } catch (e) {
      console.error("Error loading categories", e);
    }
  };

  useEffect(() => {
    fetchNews();
  }, [currentPage]);

  useEffect(() => {
    loadCategories();
  }, []);

  const validateURL = (url) => {
    return url && (url.startsWith('http://') || url.startsWith('https://'));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
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

    const categoriesArray = typeof newPost.categories === 'string' 
      ? newPost.categories.split(',').map(c => c.trim()).filter(Boolean)
      : newPost.categories;

    try {
      if (isEditMode) {
        await feedService.updatePost(editingSlug, { ...newPost, categories: categoriesArray });
        toast.success('News article updated successfully');
      } else {
        await feedService.createPost({ ...newPost, categories: categoriesArray });
        toast.success('News article created successfully');
      }
      
      setIsModalOpen(false);
      resetForm();
      fetchNews();
    } catch (error) {
      const detail = error.response?.data?.detail;
      const msg = Array.isArray(detail) ? detail[0]?.msg : (detail || 'Server error');
      toast.error(`Error: ${msg}`);
    }
  };

  const resetForm = () => {
    setNewPost({ title: '', source_url: '', excerpt: '', content: '', imageSrc: '', categories: '', source_name: 'FHM News Admin', author_name: 'Admin' });
    setIsEditMode(false);
    setEditingSlug('');
  };

  const handleEdit = (row) => {
    setIsEditMode(true);
    setEditingSlug(row.slug);
    setNewPost({
      title: row.title || '',
      source_url: row.source_url || '',
      excerpt: row.excerpt || '',
      content: row.content || '',
      imageSrc: row.imageSrc || '',
      categories: Array.isArray(row.categories) ? row.categories.join(', ') : (row.categories || ''),
      source_name: row.author?.source_name || 'FHM News Admin',
      author_name: row.author?.author_name || 'Admin'
    });
    setIsModalOpen(true);
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

  const handleBulkDelete = async (e) => {
    e.preventDefault();
    if (!bulkDeleteDates.start || !bulkDeleteDates.end) {
      toast.warning('Please select both start and end dates');
      return;
    }

    if (!showBulkConfirm) {
      setShowBulkConfirm(true);
      return;
    }

    setIsBulkDeleting(true);
    try {
      const response = await feedService.deleteByDate(bulkDeleteDates.start, bulkDeleteDates.end);
      setBulkDeleteResult(response.data);
      toast.success('News articles deleted successfully');
      fetchNews();
    } catch (error) {
      toast.error('Failed to delete news articles');
    } finally {
      setIsBulkDeleting(false);
      setShowBulkConfirm(false);
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
          <button 
            onClick={() => setIsBulkDeleteModalOpen(true)} 
            className="refresh-btn" 
            style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}
          >
            <Trash2 size={16} />
            <span>Bulk Delete</span>
          </button>
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

      <div className="table-controls glass filter-bar">
        <div className="filter-group">
          <div className="page-search-box">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ color: 'var(--text-dim)', flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Search title/excerpt..."
              value={filters.q}
              onChange={(e) => setFilters({ ...filters, q: e.target.value })}
            />
          </div>
        </div>

        <div className="filter-group">
          <select 
            className="filter-select"
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          >
            {categoriesList.map(cat => (
              <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
            ))}
          </select>
        </div>

        <div className="filter-group date-filters">
          <input 
            type="date" 
            className="filter-date"
            value={filters.start_date}
            onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
          />
          <span className="date-sep">to</span>
          <input 
            type="date" 
            className="filter-date"
            value={filters.end_date}
            onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
          />
        </div>

        <div className="filter-actions">
          <button onClick={fetchNews} className="btn-filter-apply">Apply</button>
          <button onClick={() => {
            setFilters({ category: 'all', start_date: '', end_date: '', q: '' });
            setTimeout(() => fetchNews(), 0);
          }} className="btn-filter-reset">Reset</button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={news}
        loading={loading}
        onDelete={handleDelete}
        onEdit={handleEdit}
      />

      {/* Pagination Controls */}
      {!loading && totalPages > 1 && (
        <div className="pagination-wrapper glass">
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => prev - 1)}
            className="pagination-btn"
          >
            Previous
          </button>
          
          <div className="pagination-numbers">
            {[...Array(totalPages)].map((_, i) => {
              const pageNum = i + 1;
              // Show only current, first, last, and neighbors
              if (
                pageNum === 1 || 
                pageNum === totalPages || 
                (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
              ) {
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`pagination-num ${currentPage === pageNum ? 'active' : ''}`}
                  >
                    {pageNum}
                  </button>
                );
              }
              if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                return <span key={pageNum} className="pagination-ellipsis">...</span>;
              }
              return null;
            })}
          </div>

          <button 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => prev + 1)}
            className="pagination-btn"
          >
            Next
          </button>
        </div>
      )}

      {/* Manual Creation/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={isEditMode ? "Edit News Article" : "Create New News Post"}
        size="large"
      >
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="alert-box">
            <AlertCircle size={15} />
            <span>{isEditMode ? "Updating this article will clear its cache." : "All URL fields must start with http:// or https://."} Categories are comma-separated.</span>
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
            <button type="button" onClick={() => { setIsModalOpen(false); resetForm(); }} className="btn-cancel">Cancel</button>
            <button type="submit" className="btn-submit">
              <Send size={15} />
              <span>{isEditMode ? "Update Article" : "Publish Post"}</span>
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

      {/* Bulk Delete by Date Modal */}
      <Modal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => {
          setIsBulkDeleteModalOpen(false);
          setBulkDeleteResult(null);
          setShowBulkConfirm(false);
        }}
        title="Bulk Delete News by Date"
        size="small"
      >
        {!bulkDeleteResult ? (
          <form onSubmit={handleBulkDelete} className="modal-form">
            {!showBulkConfirm ? (
              <>
                <div className="alert-box" style={{ background: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}>
                  <AlertCircle size={15} />
                  <span>Select a date range to wipe out old news articles.</span>
                </div>

                <div className="form-row">
                  <div className="form-group form-group-full">
                    <label>Start Date</label>
                    <input
                      type="date"
                      value={bulkDeleteDates.start}
                      onChange={(e) => setBulkDeleteDates({ ...bulkDeleteDates, start: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group form-group-full">
                    <label>End Date</label>
                    <input
                      type="date"
                      value={bulkDeleteDates.end}
                      onChange={(e) => setBulkDeleteDates({ ...bulkDeleteDates, end: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="modal-footer" style={{ padding: '1.25rem 0 0 0', background: 'transparent', border: 'none' }}>
                  <button type="button" onClick={() => setIsBulkDeleteModalOpen(false)} className="btn-cancel">Cancel</button>
                  <button type="submit" className="btn-submit" style={{ background: '#ef4444' }}>
                    <Trash2 size={15} />
                    <span>Proceed to Delete</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="delete-confirm-content animate-fade-in">
                <div className="delete-warning-icon">
                  <AlertCircle size={32} />
                </div>
                <h3>Final Confirmation</h3>
                <p>
                  You are about to delete news from <strong>{bulkDeleteDates.start}</strong> to <strong>{bulkDeleteDates.end}</strong>.
                  This action is <strong>irreversible</strong>.
                </p>
                <div className="modal-footer" style={{ marginTop: '2rem', padding: 0, background: 'transparent', border: 'none' }}>
                  <button type="button" onClick={() => setShowBulkConfirm(false)} className="btn-cancel">Back</button>
                  <button 
                    type="submit" 
                    disabled={isBulkDeleting} 
                    className="btn-submit" 
                    style={{ background: '#ef4444', boxShadow: '0 10px 20px -5px rgba(239, 68, 68, 0.4)' }}
                  >
                    <span>{isBulkDeleting ? 'Deleting...' : 'Yes, Delete Everything'}</span>
                  </button>
                </div>
              </div>
            )}
          </form>
        ) : (
          <div className="fetch-results animate-fade-in">
            <div className="result-header">
              <div className="result-icon-success" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                <Trash2 size={32} />
              </div>
              <h3>Bulk Deletion Successful</h3>
              <p>{bulkDeleteResult.message}</p>
              <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                Range: <strong>{bulkDeleteResult.date_range}</strong>
              </div>
            </div>

            <div className="result-stats-grid">
              <div className="res-stat-card">
                <span>Main DB</span>
                <h4 style={{ color: '#ef4444' }}>{bulkDeleteResult.deleted_from_main}</h4>
              </div>
              <div className="res-stat-card">
                <span>Scrap DB</span>
                <h4 style={{ color: '#f59e0b' }}>{bulkDeleteResult.deleted_from_scrap}</h4>
              </div>
              <div className="res-stat-card">
                <span>Total Deleted</span>
                <h4 style={{ fontWeight: 800 }}>{bulkDeleteResult.total_deleted}</h4>
              </div>
            </div>

            <div className="modal-footer" style={{ padding: '1.5rem 0 0 0', background: 'transparent', border: 'none' }}>
              <button 
                type="button" 
                onClick={() => {
                  setIsBulkDeleteModalOpen(false);
                  setBulkDeleteResult(null);
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

        .filter-bar {
          display: flex;
          gap: 1rem;
          padding: 1rem 1.5rem;
          margin-bottom: 2rem;
          align-items: center;
          flex-wrap: wrap;
        }
        .filter-group { display: flex; align-items: center; gap: 0.5rem; }
        .filter-select, .filter-date {
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--border);
          color: var(--text-main);
          padding: 0.6rem 1rem;
          border-radius: var(--radius-md);
          outline: none;
        }
        .filter-select option { background: #1e293b; color: white; }
        .date-filters { display: flex; align-items: center; gap: 0.5rem; }
        .date-sep { font-size: 0.8rem; color: var(--text-dim); }
        .filter-actions { display: flex; gap: 0.5rem; margin-left: auto; }
        .btn-filter-apply { 
          padding: 0.6rem 1.5rem; background: var(--primary); color: white; 
          border: none; border-radius: var(--radius-md); cursor: pointer; font-weight: 600;
        }
        .btn-filter-reset {
          padding: 0.6rem 1.25rem; background: rgba(255,255,255,0.05); color: var(--text-dim);
          border: 1px solid var(--border); border-radius: var(--radius-md); cursor: pointer;
        }
        .btn-filter-apply:hover { opacity: 0.9; }

        .pagination-wrapper {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          margin-top: 2rem;
          border-radius: var(--radius-md);
        }
        .pagination-btn {
          padding: 0.6rem 1.25rem;
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--border);
          color: white;
          border-radius: var(--radius-md);
          cursor: pointer;
          font-size: 0.85rem;
          transition: var(--transition);
        }
        .pagination-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .pagination-btn:not(:disabled):hover { background: rgba(255,255,255,0.1); }

        .pagination-numbers { display: flex; gap: 0.5rem; align-items: center; }
        .pagination-num {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: 1px solid transparent;
          color: var(--text-dim);
          border-radius: var(--radius-sm);
          cursor: pointer;
          font-size: 0.9rem;
          transition: var(--transition);
        }
        .pagination-num.active {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }
        .pagination-num:not(.active):hover { border-color: var(--border); color: white; }
        .pagination-ellipsis { color: var(--text-dim); padding: 0 0.5rem; }

        /* Fetch Results Styling ... kept as is ... */
` + `
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