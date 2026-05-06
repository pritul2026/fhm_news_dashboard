import React, { useState, useEffect } from 'react';
import { Mail, Phone, MessageSquare } from 'lucide-react';
import { contactService } from '../services/api';
import DataTable from '../components/DataTable';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const Contacts = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const response = await contactService.getAllContacts();
      // API structure might be { data: [...] } or direct list
      setContacts(response.data.data || response.data || []);
    } catch (error) {
      console.log(error);
      toast.error('Failed to fetch contact requests');
      setContacts([
        { first_name: 'Rahul', last_name: 'Kumar', email: 'rahul@example.com', subject: 'Collaboration', message: 'I want to work with your platform.', phone: '9876543210' },
        { first_name: 'Anjali', last_name: 'Singh', email: 'anjali@example.com', subject: 'Bug Report', message: 'The search is not working properly.', phone: '9123456789' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const columns = [
    {
      header: 'Name',
      accessor: 'first_name',
      render: (val, row) => `${val} ${row.last_name}`
    },
    {
      header: 'Email',
      accessor: 'email',
      render: (val) => (
        <div className="contact-info-cell">
          <Mail size={14} />
          <span>{val}</span>
        </div>
      )
    },
    { header: 'Subject', accessor: 'subject' },
    {
      header: 'Message',
      accessor: 'message',
      render: (val) => (
        <div className="message-preview" title={val}>
          {val.substring(0, 40)}{val.length > 40 ? '...' : ''}
        </div>
      )
    },
  ];

  return (
    <div className="page-container animate-fade-in">
      <header className="page-header">
        <div>
          <h1>Contact Requests</h1>
          <p>Review and respond to messages from your users.</p>
        </div>
      </header>

      <DataTable
        columns={columns}
        data={contacts}
        loading={loading}
        onDelete={() => toast.error('Admin restricted action')}
      />

      <style dangerouslySetInnerHTML={{
        __html: `
        .contact-info-cell { 
          display: flex; align-items: center; gap: 0.5rem; 
          color: var(--text-muted); font-size: 0.875rem;
        }
        .contact-info-cell svg { color: var(--text-dim); flex-shrink: 0; }
        .message-preview { 
          font-size: 0.82rem; color: var(--text-dim); 
          font-style: italic; max-width: 260px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .contact-name { font-weight: 600; color: var(--text-main); }
      `}} />
    </div>
  );
};

export default Contacts;
