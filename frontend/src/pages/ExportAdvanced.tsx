import React, { useState } from 'react';
import api from '../services/api';
import AdvancedLayout from '../components/AdvancedLayout';
import '../styles/global-advanced.css';

export default function ExportAdvanced() {
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'json' | 'pdf'>('csv');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const handleExport = async (format: 'csv' | 'json' | 'pdf') => {
    try {
      setExporting(true);
      const response = await api.get(`/export/${format}`, {
        params: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        },
        responseType: format === 'pdf' ? 'blob' : 'json'
      });

      const filename = `expenses_${dateRange.startDate}_to_${dateRange.endDate}.${format === 'pdf' ? 'pdf' : format === 'json' ? 'json' : 'csv'}`;

      if (format === 'pdf' || format === 'csv') {
        const blob = new Blob([response.data], { type: format === 'pdf' ? 'application/pdf' : 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(response.data, null, 2)));
        element.setAttribute('download', filename);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
      }

      setMessage({ type: 'success', text: `Exported as ${format.toUpperCase()} successfully!` });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Failed to export data' });
    } finally {
      setExporting(false);
    }
  };

  return (
    <AdvancedLayout>
      <div className="page-content">
        {/* Page Header */}
        <div className="page-header">
          <h1>📥 Export Data</h1>
          <p>Download your expense data in multiple formats</p>
        </div>

        {/* Message Alert */}
        {message && (
          <div style={{
            padding: '16px',
            borderRadius: '12px',
            marginBottom: '24px',
            background: message.type === 'success'
              ? 'rgba(16, 185, 129, 0.1)'
              : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${message.type === 'success' ? '#10b981' : '#ef4444'}`,
            color: message.type === 'success' ? '#10b981' : '#ef4444'
          }}>
            {message.type === 'success' ? '✅' : '❌'} {message.text}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Date Range */}
          <div className="glass-card">
            <h3 style={{ margin: '0 0 20px 0', color: 'var(--text-primary)' }}>📅 Select Date Range</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Start Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">End Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                />
              </div>

              <div style={{
                padding: '12px',
                background: 'rgba(102, 126, 234, 0.05)',
                borderRadius: '8px',
                fontSize: '0.9rem',
                color: 'var(--text-secondary)'
              }}>
                📊 {Math.floor((new Date(dateRange.endDate).getTime() - new Date(dateRange.startDate).getTime()) / (1000 * 60 * 60 * 24))} days selected
              </div>
            </div>
          </div>

          {/* Export Formats */}
          <div className="glass-card">
            <h3 style={{ margin: '0 0 20px 0', color: 'var(--text-primary)' }}>📁 Export Format</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {([
                { format: 'csv', icon: '📊', title: 'CSV Export', desc: 'Excel compatible spreadsheet' },
                { format: 'json', icon: '{}', title: 'JSON Export', desc: 'Machine-readable format' },
                { format: 'pdf', icon: '📄', title: 'PDF Report', desc: 'Printable report with charts' }
              ] as const).map(option => (
                <button
                  key={option.format}
                  onClick={() => {
                    setSelectedFormat(option.format);
                    handleExport(option.format);
                  }}
                  disabled={exporting}
                  style={{
                    padding: '16px',
                    background: selectedFormat === option.format
                      ? 'linear-gradient(135deg, #667eea, #764ba2)'
                      : 'rgba(45, 55, 72, 0.3)',
                    border: `2px solid ${selectedFormat === option.format ? 'var(--primary)' : 'transparent'}`,
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    color: 'var(--text-primary)',
                    fontSize: '1rem',
                    fontWeight: '600',
                    textAlign: 'left',
                    opacity: exporting ? 0.6 : 1
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '1.5rem' }}>{option.icon}</span>
                    <div>
                      <p style={{ margin: 0, marginBottom: '4px', fontSize: '1rem', fontWeight: '600' }}>
                        {option.title}
                      </p>
                      <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.7 }}>
                        {option.desc}
                      </p>
                    </div>
                    {exporting && selectedFormat === option.format && (
                      <span style={{ marginLeft: 'auto' }}>⏳ Exporting...</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Export Options */}
        <div className="glass-card" style={{ marginTop: '24px' }}>
          <h3 style={{ margin: '0 0 20px 0', color: 'var(--text-primary)' }}>⚙️ Export Options</h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
            {[
              { title: 'Include Charts', desc: 'Embed visual charts in PDF' },
              { title: 'Include Settlements', desc: 'Show who owes whom' },
              { title: 'Include Categories', desc: 'Detailed category breakdown' },
              { title: 'Include Notes', desc: 'All transaction notes' }
            ].map((option, idx) => (
              <div
                key={idx}
                style={{
                  padding: '16px',
                  background: 'rgba(102, 126, 234, 0.05)',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <input type="checkbox" defaultChecked style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                <div>
                  <p style={{ margin: 0, fontWeight: '600', marginBottom: '2px' }}>{option.title}</p>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {option.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Information Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginTop: '24px' }}>
          <div className="glass-card">
            <p style={{ margin: 0, marginBottom: '8px', fontSize: '1.5rem' }}>📋</p>
            <h4 style={{ margin: 0, marginBottom: '8px', color: 'var(--text-primary)' }}>What's Included</h4>
            <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              <li>All expenses</li>
              <li>Family data</li>
              <li>Settlements</li>
              <li>Categories</li>
            </ul>
          </div>

          <div className="glass-card">
            <p style={{ margin: 0, marginBottom: '8px', fontSize: '1.5rem' }}>🔒</p>
            <h4 style={{ margin: 0, marginBottom: '8px', color: 'var(--text-primary)' }}>Privacy & Security</h4>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Data is exported directly to your device. No server copies kept.
            </p>
          </div>

          <div className="glass-card">
            <p style={{ margin: 0, marginBottom: '8px', fontSize: '1.5rem' }}>⚡</p>
            <h4 style={{ margin: 0, marginBottom: '8px', color: 'var(--text-primary)' }}>Performance</h4>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Exports process instantly. No waiting required.
            </p>
          </div>
        </div>
      </div>
    </AdvancedLayout>
  );
}
