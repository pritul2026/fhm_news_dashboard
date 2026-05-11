import React, { useState, useEffect } from 'react';
import { Trash2, Hash, AlertTriangle, RefreshCw, X } from 'lucide-react';
import { feedService } from '../services/api';
import { toast } from 'react-toastify';
import Modal from '../components/Modal';
import './Dashboard.css';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await feedService.getCategories();
      const list = (res.data.categories || []).filter(c => c !== 'all');
      setCategories(list);
    } catch (error) {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openDeleteModal = (category) => {
    setSelectedCategory(category);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await feedService.deleteCategory(selectedCategory);
      toast.success(`Category "${selectedCategory}" deleted successfully`);
      setIsDeleteModalOpen(false);
      loadCategories();
    } catch (error) {
      toast.error('Failed to delete category');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="page-container animate-fade-in">
      <header className="page-header">
        <div>
          <h1>Manage Categories</h1>
          <p>Delete and manage news categories and their associated content.</p>
        </div>
        <button onClick={loadCategories} className="refresh-btn">
          <RefreshCw size={16} />
          <span>Refresh List</span>
        </button>
      </header>

      <div className="alert-box" style={{ background: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', marginBottom: '2rem' }}>
        <AlertTriangle size={18} />
        <span><strong>Important:</strong> Deleting a category is permanent and removes all news items in that category from the system.</span>
      </div>

      {loading ? (
        <div className="loading-state">
          <RefreshCw className="animate-spin" />
          <span>Loading categories...</span>
        </div>
      ) : (
        <div className="categories-grid">
          {categories.length > 0 ? (
            categories.map((cat, i) => (
              <div key={i} className="glass-card category-item-card">
                <div className="cat-info">
                  <div className="cat-icon">
                    <Hash size={20} />
                  </div>
                  <span className="cat-name">{cat}</span>
                </div>
                <button 
                  onClick={() => openDeleteModal(cat)}
                  className="cat-delete-btn"
                  title={`Delete ${cat}`}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))
          ) : (
            <div className="empty-state glass">
              <p>No custom categories found.</p>
            </div>
          )}
        </div>
      )}

      {/* Professional Deletion Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Category Deletion"
        size="small"
      >
        <div className="delete-confirm-content">
          <div className="delete-warning-icon">
            <AlertTriangle size={32} />
          </div>
          <h3>Are you absolutely sure?</h3>
          <p>
            You are about to delete the category <strong style={{ color: 'var(--primary)', textTransform: 'capitalize' }}>"{selectedCategory}"</strong>. 
            This action will permanently remove <strong>all news articles</strong> associated with this category.
          </p>
          
          <div className="modal-footer" style={{ marginTop: '2rem', padding: 0, background: 'transparent', border: 'none' }}>
            <button 
              className="btn-cancel" 
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button 
              className="btn-submit" 
              style={{ background: '#ef4444', boxShadow: '0 10px 20px -5px rgba(239, 68, 68, 0.4)' }}
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              <Trash2 size={16} />
              <span>{isDeleting ? 'Deleting...' : 'Yes, Delete All'}</span>
            </button>
          </div>
        </div>
      </Modal>

      <style dangerouslySetInnerHTML={{ __html: `
        .delete-confirm-content {
          text-align: center;
          padding: 1rem 0;
        }
        .delete-warning-icon {
          width: 64px;
          height: 64px;
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
        }
        .delete-confirm-content h3 {
          font-size: 1.25rem;
          color: var(--text-main);
          margin-bottom: 0.75rem;
        }
        .delete-confirm-content p {
          color: var(--text-dim);
          line-height: 1.6;
          font-size: 0.95rem;
        }

        .categories-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
        }
        .category-item-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem 1.5rem;
          transition: var(--transition);
        }
        .category-item-card:hover {
          transform: translateY(-4px);
          border-color: rgba(239, 68, 68, 0.3);
        }
        .cat-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .cat-icon {
          width: 40px;
          height: 40px;
          background: rgba(59, 130, 246, 0.1);
          color: var(--primary);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .cat-name {
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-main);
          text-transform: capitalize;
        }
        .cat-delete-btn {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          border: none;
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: var(--transition);
        }
        .cat-delete-btn:hover {
          background: #ef4444;
          color: white;
        }
        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem;
          gap: 1rem;
          color: var(--text-dim);
        }
      `}} />
    </div>
  );
};

export default Categories;
