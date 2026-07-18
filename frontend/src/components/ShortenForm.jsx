import React, { useState } from 'react';
import apiClient from '../api/axios';

function ShortenForm({ onShortened }) {
  const [originalUrl, setOriginalUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successResult, setSuccessResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset previous states
    setError('');
    setSuccessResult(null);
    setCopied(false);
    
    if (!originalUrl) {
      setError("Please enter a URL to shorten.");
      return;
    }

    setIsLoading(true);

    try {
      const payload = { originalUrl };
      if (customAlias.trim()) {
        payload.customAlias = customAlias.trim();
      }

      const response = await apiClient.post('/shorten', payload);
      
      // Clear inputs on success
      setOriginalUrl('');
      setCustomAlias('');
      
      // Store result to show the copy button
      setSuccessResult(response.data);
      
      // Notify parent component
      if (onShortened) {
        onShortened(response.data);
      }
      
    } catch (err) {
      // Extract the error message safely from the API response
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (successResult && successResult.shortUrl) {
      navigator.clipboard.writeText(successResult.shortUrl);
      setCopied(true);
      
      // Reset the "Copied!" text back to "Copy" after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    }
  };

  return (
    <div className="glass-card">
      <h2>Create a ShortLink</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="originalUrl">Destination URL</label>
          <input 
            type="url" 
            id="originalUrl"
            placeholder="https://example.com/very/long/path"
            value={originalUrl}
            onChange={(e) => setOriginalUrl(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="customAlias">Custom Alias (Optional)</label>
          <input 
            type="text" 
            id="customAlias"
            placeholder="e.g. my-campaign"
            value={customAlias}
            onChange={(e) => setCustomAlias(e.target.value)}
            disabled={isLoading}
          />
        </div>

        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        <button 
          type="submit" 
          className="btn-primary"
          disabled={isLoading}
        >
          {isLoading ? 'Shortening...' : 'Shorten URL'}
        </button>
      </form>

      {successResult && (
        <div className="success-box">
          <p style={{ margin: '0 0 0.5rem 0', fontWeight: '600', color: 'var(--text-main)' }}>Success! Your link is ready:</p>
          <div className="flex-row">
            <a href={successResult.shortUrl} target="_blank" rel="noopener noreferrer">
              {successResult.shortUrl}
            </a>
            <button 
              onClick={handleCopy}
              className="btn-secondary"
              style={copied ? { background: 'var(--success)', color: 'white', borderColor: 'var(--success)' } : {}}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ShortenForm;
