import React from 'react';
import { ChevronRight, ChevronLeft, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import './DataTable.css';

const DataTable = ({ columns, data, loading, onEdit, onDelete }) => {
  if (loading) {
    return (
      <div className="table-loader">
        <div className="spinner"></div>
        <span>Loading data...</span>
      </div>
    );
  }

  return (
    <div className="table-container glass">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col, i) => (
              <th key={i} style={{ width: col.width }}>{col.header}</th>
            ))}
            <th className="actions-col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((row, i) => (
              <tr key={i} className="table-row">
                {columns.map((col, j) => (
                  <td key={j}>
                    {col.render ? col.render(row[col.accessor], row) : row[col.accessor]}
                  </td>
                ))}
                <td className="actions-col">
                  <div className="action-btns">
                    {onEdit && (
                      <button onClick={() => onEdit(row)} className="action-btn edit">
                        <Edit2 size={16} />
                      </button>
                    )}
                    {onDelete && (
                      <button onClick={() => onDelete(row)} className="action-btn delete">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length + 1} className="no-data">
                No records found
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="table-pagination">
        <div className="pagination-info">
          Showing <span>1 to {data.length}</span> of <span>{data.length}</span> results
        </div>
        <div className="pagination-btns">
          <button className="page-btn" disabled><ChevronLeft size={18} /></button>
          <button className="page-btn active">1</button>
          <button className="page-btn"><ChevronRight size={18} /></button>
        </div>
      </div>
    </div>
  );
};

export default DataTable;
