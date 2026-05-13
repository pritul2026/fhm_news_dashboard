import axios from 'axios';

const API_BASE_URL = 'https://api.fhmnews.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Feed APIs
export const feedService = {
  getFeed: (params) => api.get('/feed/', { params }),
  filterNews: (params) => api.get('/feed/filter', { params }),
  getCategories: () => api.get('/feed/categories'), // New Categories API
  getArticleBySlug: (slug) => api.get(`/feed/slug/${slug}/`),
  createPost: (data) => api.post('/feed/', data),
  updatePost: (slug, data) => api.put(`/feed/${slug}`, data),
  fetchCustom: (data) => api.post('/feed/fetch', data),
  triggerRefresh: (pages = 5) => api.post(`/feed/refresh/?pages=${pages}`),
  deleteBySlug: (slug) => api.delete(`/feed/slug/${slug}/`),
  deleteCategory: (name) => api.delete(`/feed/category/${name}?confirm=yes`),
  deleteByDate: (startDate, endDate) => api.delete(`/feed/delete-by-date?start_date=${startDate}&end_date=${endDate}&confirm=yes`),
};

// Blog APIs
export const blogService = {
  createBlog: (data) => api.post('/blogs/', data),
  getAllBlogs: (params) => api.get('/blogs/', { params }),
  getBlog: (slugOrId) => api.get(`/blogs/${slugOrId}/`),
  deleteBlog: (id) => api.delete(`/blogs/${id}`),
};

// Ads APIs
export const adsService = {
  createAd: (data) => api.post('/ads/', data),
  getAllAds: (params) => api.get('/ads/', { params }),
  updateAd: (id, data) => api.put(`/ads/${id}`, data),
  deleteAd: (id) => api.delete(`/ads/${id}`),
};

// Contact APIs
export const contactService = {
  submitContact: (data) => api.post('/contact-us/', data),
  getAllContacts: (token) => api.get('/contact-us/', {
    headers: { Authorization: `Bearer ${token}` }
  }),
};

export default api;
