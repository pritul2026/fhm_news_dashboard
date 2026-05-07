import React, { useState, useEffect } from 'react';
import { Plus, Search, AlertCircle, Send, X } from 'lucide-react';
import { blogService } from '../services/api';
import DataTable from '../components/DataTable';
import { toast } from 'react-toastify';

import Modal from '../components/Modal';

const Blogs = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBlog, setNewBlog] = useState({
    title: '',
    slug: '',
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
    short_description: '',
    author: 'Admin',
    category: 'General',
    body: '',
    tags: '',
    featured_image: '',
    status: 'draft',
    visibility: 'public',
    featured: false
  });

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const response = await blogService.getAllBlogs();
      setBlogs(response.data.data || []);
    } catch (error) {
      toast.error('Failed to fetch blogs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const validateURL = (url) => {
    return url && (url.startsWith('http://') || url.startsWith('https://'));
  };

  const handleCreateBlog = async (e) => {
    e.preventDefault();
    
    // Validation based on backend Pydantic constraints
    if (newBlog.title.length < 3) {
      toast.warning('Title must be at least 3 characters');
      return;
    }
    if (newBlog.slug.length < 3) {
      toast.warning('Slug must be at least 3 characters');
      return;
    }
    if (newBlog.meta_description.length < 10) {
      toast.warning('Meta Description must be at least 10 characters');
      return;
    }
    if (newBlog.short_description.length < 20) {
      toast.warning('Short Description must be at least 20 characters');
      return;
    }
    if (newBlog.body.length < 50) {
      toast.warning('Blog body must be at least 50 characters');
      return;
    }
    if (!validateURL(newBlog.featured_image)) {
      toast.error('Featured Image must be a real URL (http/https)');
      return;
    }

    // Convert comma-separated strings to arrays
    const payload = {
      ...newBlog,
      meta_keywords: newBlog.meta_keywords.split(',').map(s => s.trim()).filter(Boolean),
      tags: newBlog.tags.split(',').map(s => s.trim()).filter(Boolean)
    };

    try {
      await blogService.createBlog(payload);
      toast.success('Blog created successfully');
      setIsModalOpen(false);
      setNewBlog({
        title: '', slug: '', meta_title: '', meta_description: '', meta_keywords: '',
        short_description: '', author: 'Admin', category: 'General', body: '',
        tags: '', featured_image: '', status: 'draft', visibility: 'public', featured: false
      });
      fetchBlogs();
    } catch (error) {
      const detail = error.response?.data?.detail;
      const msg = Array.isArray(detail) ? detail[0]?.msg : (detail || 'Server error');
      toast.error(`Error: ${msg}`);
    }
  };

  const handleDeleteBlog = async (row) => {
    if (window.confirm('Are you sure you want to delete this blog post?')) {
      try {
        await blogService.deleteBlog(row.id);
        toast.success('Blog deleted successfully');
        fetchBlogs();
      } catch (error) {
        toast.error('Failed to delete blog');
      }
    }
  };

  const columns = [
    {
      header: 'Blog Title',
      accessor: 'title',
      render: (val, row) => (
        <div className="title-cell">
          <span className="main-title">{val || 'Untitled'}</span>
          <span className="slug-hint">{row.slug || 'no-slug'}</span>
        </div>
      )
    },
    { header: 'Author', accessor: 'author' },
    { header: 'Category', accessor: 'category' },
    {
      header: 'Status',
      accessor: 'status',
      render: (val) => (
        <span className={`status-pill ${val?.toLowerCase()}`}>
          {val}
        </span>
      )
    },
  ];

  return (
    <div className="page-container animate-fade-in">
      <header className="page-header">
        <div>
          <h1>Blog Management</h1>
          <p>Create and edit articles for the FHM News blog.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-submit" style={{ marginTop: 0 }}>
          <Plus size={18} />
          <span>New Blog</span>
        </button>
      </header>

      <div className="table-controls glass">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search blogs..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={blogs.filter(b => (b.title || '').toLowerCase().includes(searchTerm.toLowerCase()))}
        loading={loading}
        onDelete={handleDeleteBlog}
        onEdit={(row) => toast.info(`Editing ${row.title}`)}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Blog Post"
        size="large"
      >
        <form onSubmit={handleCreateBlog} className="modal-form">
          <div className="alert-box">
            <AlertCircle size={16} />
            <span>Ensure all SEO fields are filled correctly. Keywords and Tags should be comma-separated.</span>
          </div>

          <div className="form-row">
            <div className="form-group form-group-full">
              <label>Blog Title (Min 3)</label>
              <input
                type="text"
                placeholder="How to build..."
                value={newBlog.title}
                onChange={(e) => {
                  const val = e.target.value;
                  const slug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
                  setNewBlog({ ...newBlog, title: val, slug: slug });
                }}
                required
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <small style={{ color: newBlog.title.length < 3 ? '#ef4444' : '#10b981', fontWeight: 600 }}>
                  {newBlog.title.length} / 3
                </small>
              </div>
            </div>
            <div className="form-group">
              <label>Slug (Min 3)</label>
              <input
                type="text"
                value={newBlog.slug}
                onChange={(e) => setNewBlog({ ...newBlog, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') })}
                required
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <small style={{ color: newBlog.slug.length < 3 ? '#ef4444' : '#10b981', fontWeight: 600 }}>
                  {newBlog.slug.length} / 3
                </small>
              </div>
            </div>
            <div className="form-group">
              <label>Category</label>
              <input
                type="text"
                value={newBlog.category}
                onChange={(e) => setNewBlog({ ...newBlog, category: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Meta Title</label>
              <input
                type="text"
                placeholder="SEO Title..."
                value={newBlog.meta_title}
                onChange={(e) => setNewBlog({ ...newBlog, meta_title: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Meta Keywords (comma separated)</label>
              <input
                type="text"
                placeholder="news, blog, tech"
                value={newBlog.meta_keywords}
                onChange={(e) => setNewBlog({ ...newBlog, meta_keywords: e.target.value })}
                required
              />
            </div>

            <div className="form-group form-group-full">
              <label>Featured Image URL (http/https)</label>
              <input
                type="text"
                placeholder="https://example.com/image.jpg"
                value={newBlog.featured_image}
                onChange={(e) => setNewBlog({ ...newBlog, featured_image: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Tags (comma separated)</label>
              <input
                type="text"
                placeholder="tag1, tag2"
                value={newBlog.tags}
                onChange={(e) => setNewBlog({ ...newBlog, tags: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Visibility</label>
              <select
                value={newBlog.visibility}
                onChange={(e) => setNewBlog({ ...newBlog, visibility: e.target.value })}
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>

            <div className="form-group">
              <label>Status</label>
              <select
                value={newBlog.status}
                onChange={(e) => setNewBlog({ ...newBlog, status: e.target.value })}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
            <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
              <input
                type="checkbox"
                checked={newBlog.featured}
                onChange={(e) => setNewBlog({ ...newBlog, featured: e.target.checked })}
                style={{ width: 'auto' }}
              />
              <label style={{ margin: 0 }}>Featured Post</label>
            </div>

            <div className="form-group form-group-full">
              <label>Meta Description (Min 10)</label>
              <input
                type="text"
                placeholder="SEO meta description..."
                value={newBlog.meta_description}
                onChange={(e) => setNewBlog({ ...newBlog, meta_description: e.target.value })}
                required
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <small style={{ color: newBlog.meta_description.length < 10 ? '#ef4444' : '#10b981', fontWeight: 600 }}>
                  {newBlog.meta_description.length} / 10
                </small>
              </div>
            </div>
            <div className="form-group form-group-full">
              <label>Short Description (Min 20)</label>
              <textarea
                rows="2"
                placeholder="Brief intro..."
                value={newBlog.short_description}
                onChange={(e) => setNewBlog({ ...newBlog, short_description: e.target.value })}
                required
              ></textarea>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <small style={{ color: newBlog.short_description.length < 20 ? '#ef4444' : '#10b981', fontWeight: 600 }}>
                  {newBlog.short_description.length} / 20
                </small>
              </div>
            </div>
            <div className="form-group form-group-full">
              <label>Blog Content (Min 50 chars)</label>
              <textarea
                rows="5"
                placeholder="Start writing..."
                value={newBlog.body}
                onChange={(e) => setNewBlog({ ...newBlog, body: e.target.value })}
                required
              ></textarea>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <small style={{ color: newBlog.body.length < 50 ? '#ef4444' : '#10b981', fontWeight: 600 }}>
                  Character Count: {newBlog.body.length} / 50
                </small>
              </div>
            </div>
          </div>
          <div className="modal-footer" style={{ padding: '1.25rem 0 0 0', background: 'transparent', border: 'none' }}>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-cancel">Cancel</button>
            <button type="submit" className="btn-submit">
              <Send size={16} />
              <span>Publish Blog</span>
            </button>
          </div>
        </form>
      </Modal>

      <style dangerouslySetInnerHTML={{
        __html: `
        .status-pill {
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: capitalize;
        }
        .status-pill.published { background: rgba(16, 185, 129, 0.1); color: var(--accent); }
        .status-pill.draft { background: rgba(245, 158, 11, 0.1); color: var(--warning); }
        .title-cell { display: flex; flex-direction: column; gap: 0.25rem; }
        .main-title { font-weight: 600; color: var(--text-main); }
        .slug-hint { font-size: 0.75rem; color: var(--text-dim); }
        .table-controls { padding: 1.5rem; border-radius: var(--radius-md); margin-bottom: 2rem; }
      `}} />
    </div>
  );
};

export default Blogs;
