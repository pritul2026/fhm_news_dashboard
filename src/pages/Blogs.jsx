import React, { useState, useEffect } from 'react';
import { Plus, Search, AlertCircle, Send, X } from 'lucide-react';
import { blogService } from '../services/api';
import DataTable from '../components/DataTable';
import { toast } from 'react-toastify';

const Blogs = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBlog, setNewBlog] = useState({
    title: '',
    slug: '',
    meta_description: '',
    short_description: '',
    author: 'Admin',
    category: 'Technology',
    body: '',
    featured_image: '',
    status: 'published'
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
    if (!validateURL(newBlog.featured_image)) {
      toast.error('Featured Image must be a real URL (http/https)');
      return;
    }
    if (newBlog.body.length < 50) {
      toast.warning('Blog body must be at least 50 characters');
      return;
    }

    try {
      await blogService.createBlog(newBlog);
      toast.success('Blog created successfully');
      setIsModalOpen(false);
      setNewBlog({
        title: '', slug: '', meta_description: '', short_description: '',
        author: 'Admin', category: 'Technology', body: '',
        featured_image: '', status: 'published'
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

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content animate-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Blog Post</h3>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleCreateBlog} className="modal-form">
                <div className="alert-box">
                  <AlertCircle size={16} />
                  <span>All image fields require real URLs (http/https). Base64 not allowed.</span>
                </div>

                <div className="form-row">
                  <div className="form-group form-group-full">
                    <label>Blog Title</label>
                    <input
                      type="text"
                      placeholder="How to build..."
                      value={newBlog.title}
                      onChange={(e) => setNewBlog({ ...newBlog, title: e.target.value, slug: e.target.value.toLowerCase().replace(/ /g, '-') })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Slug</label>
                    <input
                      type="text"
                      value={newBlog.slug}
                      onChange={(e) => setNewBlog({ ...newBlog, slug: e.target.value })}
                      required
                    />
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
                  <div className="form-group form-group-full">
                    <label>Meta Description</label>
                    <input
                      type="text"
                      placeholder="SEO meta description..."
                      value={newBlog.meta_description}
                      onChange={(e) => setNewBlog({ ...newBlog, meta_description: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group form-group-full">
                    <label>Short Description</label>
                    <textarea
                      rows="2"
                      placeholder="Brief intro..."
                      value={newBlog.short_description}
                      onChange={(e) => setNewBlog({ ...newBlog, short_description: e.target.value })}
                      required
                    ></textarea>
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
                      <small style={{ color: newBlog.body.length < 50 ? 'var(--danger)' : 'var(--accent)', fontWeight: 600 }}>
                        Character Count: {newBlog.body.length} / 50
                      </small>
                    </div>
                  </div>
                </div>
                <div className="form-footer">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-cancel">Cancel</button>
                  <button type="submit" className="btn-submit">
                    <Send size={16} />
                    <span>Publish Blog</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

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
