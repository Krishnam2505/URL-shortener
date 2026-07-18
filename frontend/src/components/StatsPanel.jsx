import React, { useState, useEffect } from 'react';
import apiClient from '../api/axios';

function StatsPanel({ selectedShortCode }) {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchStats = async (shortCode) => {
    if (!shortCode) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await apiClient.get(`/stats/${shortCode}`);
      setStats(response.data);
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Failed to fetch statistics.');
      }
      setStats(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats(selectedShortCode);
  }, [selectedShortCode]);

  if (!selectedShortCode) {
    return (
      <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
        <p className="subtitle" style={{ margin: 0 }}>Select a link to view its real-time analytics.</p>
      </div>
    );
  }

  return (
    <div className="glass-card">
      <div className="flex-row" style={{ marginBottom: '1.5rem' }}>
        <h2>Live Analytics</h2>
        <button 
          className="btn-secondary" 
          onClick={() => fetchStats(selectedShortCode)}
          disabled={isLoading}
        >
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error ? (
        <div className="error-message">⚠️ {error}</div>
      ) : stats ? (
        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
          <div className="stats-label">Total Clicks</div>
          <div className="stats-number">{stats.clickCount}</div>
          
          <div className="stats-detail">
            <span><strong>Short Link:</strong> {stats.shortCode}</span>
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              <strong>Original URL:</strong> {stats.originalUrl}
            </span>
            <span><strong>Created:</strong> {new Date(stats.createdAt).toLocaleString()}</span>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
          Loading statistics...
        </div>
      )}
    </div>
  );
}

export default StatsPanel;
