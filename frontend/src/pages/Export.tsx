import { useState } from 'react';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';

export default function Export() {
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  const [reportType, setReportType] = useState<'none' | 'monthly' | 'yearly'>('none');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const familyId = useAuthStore((state) => state.familyId);

  const handleExportExpenses = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await api.get(`/export/${familyId}/${format}?${params}`, {
        responseType: format === 'csv' ? 'blob' : 'json',
      });

      if (format === 'csv') {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `expenses-${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
        // CRITICAL: Cleanup blob URL to prevent memory leak
        window.URL.revokeObjectURL(url);
      } else {
        const dataStr = JSON.stringify(response.data.data, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const link = document.createElement('a');
        link.setAttribute('href', dataUri);
        link.setAttribute('download', `expenses-${Date.now()}.json`);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
      }

      setSuccess(`Export successful! 📥`);
    } catch (error: any) {
      const errorMsg = error.response?.data?.error?.message || 'Export failed';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const endpoint =
        reportType === 'monthly'
          ? `/export/${familyId}/monthly-report?month=${month}&year=${year}`
          : `/export/${familyId}/yearly-report?year=${year}`;

      const response = await api.get(endpoint);
      const data = response.data.data;

      // Create downloadable report
      const reportHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Expense Report</title>
          <style>
            body { font-family: Arial; margin: 20px; }
            h1 { color: #1e40af; }
            .summary { background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .category-list { margin: 20px 0; }
            .category-item { display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid #e5e7eb; }
            .amount { font-weight: bold; color: #059669; }
          </style>
        </head>
        <body>
          <h1>💰 Expense Report</h1>
          <div class="summary">
            <h2>${reportType === 'monthly' ? `Monthly Report - ${data.month}` : `Yearly Report - ${data.year}`}</h2>
            <p><strong>Total Spent:</strong> ₹${data.totalSpent?.toLocaleString()}</p>
            <p><strong>Average ${reportType === 'monthly' ? 'Transaction' : 'Monthly'}:</strong> ₹${data.averageTransaction?.toLocaleString() || data.averageMonthly?.toLocaleString()}</p>
            <p><strong>Transactions:</strong> ${data.transactionCount}</p>
          </div>

          ${reportType === 'monthly' ? `
            <h3>Category Breakdown</h3>
            <div class="category-list">
              ${Object.entries(data.categoryBreakdown || {})
                .map(
                  ([cat, amt]: any) => `
                <div class="category-item">
                  <span>${cat}</span>
                  <span class="amount">₹${amt.toLocaleString()}</span>
                </div>
              `
                )
                .join('')}
            </div>
          ` : `
            <h3>Monthly Breakdown</h3>
            <div class="category-list">
              ${Object.entries(data.monthlyBreakdown || {})
                .map(
                  ([month, amt]: any) => `
                <div class="category-item">
                  <span>${month}</span>
                  <span class="amount">₹${amt.toLocaleString()}</span>
                </div>
              `
                )
                .join('')}
            </div>
          `}

          <hr />
          <p style="color: #666; font-size: 12px;">Generated: ${new Date().toLocaleString()}</p>
        </body>
        </html>
      `;

      const blob = new Blob([reportHTML], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report-${Date.now()}.html`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      // CRITICAL: Cleanup blob URL to prevent memory leak
      window.URL.revokeObjectURL(url);

      setSuccess('Report generated successfully! 📊');
    } catch (error: any) {
      const errorMsg = error.response?.data?.error?.message || 'Report generation failed';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">📥 Export & Reports</h1>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Success Display */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
            {success}
          </div>
        )}

        <div className="space-y-8">
          {/* Export Expenses */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-6">📊 Export Expenses</h2>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
                <div className="flex gap-4">
                  <label>
                    <input
                      type="radio"
                      value="csv"
                      checked={format === 'csv'}
                      onChange={(e) => setFormat(e.target.value as any)}
                      className="mr-2"
                    />
                    CSV (Spreadsheet)
                  </label>
                  <label>
                    <input
                      type="radio"
                      value="json"
                      checked={format === 'json'}
                      onChange={(e) => setFormat(e.target.value as any)}
                      className="mr-2"
                    />
                    JSON (Data)
                  </label>
                </div>
              </div>

              <button
                onClick={handleExportExpenses}
                disabled={loading}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition"
              >
                {loading ? 'Exporting...' : `Export as ${format.toUpperCase()}`}
              </button>
            </div>
          </div>

          {/* Generate Reports */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-6">📋 Generate Report</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
                <div className="flex gap-4">
                  <label>
                    <input
                      type="radio"
                      value="monthly"
                      checked={reportType === 'monthly'}
                      onChange={(e) => setReportType(e.target.value as any)}
                      className="mr-2"
                    />
                    Monthly
                  </label>
                  <label>
                    <input
                      type="radio"
                      value="yearly"
                      checked={reportType === 'yearly'}
                      onChange={(e) => setReportType(e.target.value as any)}
                      className="mr-2"
                    />
                    Yearly
                  </label>
                </div>
              </div>

              {reportType === 'monthly' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
                    <select
                      value={month}
                      onChange={(e) => setMonth(parseInt(e.target.value))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i} value={i + 1}>
                          {new Date(2024, i).toLocaleString('default', { month: 'long' })}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                    <input
                      type="number"
                      value={year}
                      onChange={(e) => setYear(parseInt(e.target.value))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              )}

              {reportType === 'yearly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              )}

              <button
                onClick={handleGenerateReport}
                disabled={loading || reportType === 'none'}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium transition"
              >
                {loading ? 'Generating...' : 'Generate Report (HTML)'}
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-2">💡 Export Information</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>✓ CSV format for use in Excel or Google Sheets</li>
              <li>✓ JSON format for data integration</li>
              <li>✓ HTML reports for printing and sharing</li>
              <li>✓ All exports include complete transaction details</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
