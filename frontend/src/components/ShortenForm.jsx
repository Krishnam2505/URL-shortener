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
    <div className="shorten-form-container" style={{ margin: '2rem 0', padding: '1.5rem', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h2>Create a ShortLink</h2>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label htmlFor="originalUrl">Destination URL</label>
          <input 
            type="url" 
            id="originalUrl"
            placeholder="https://example.com/very/long/path"
            value={originalUrl}
            onChange={(e) => setOriginalUrl(e.target.value)}
            disabled={isLoading}
            required
            style={{ padding: '0.5rem' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label htmlFor="customAlias">Custom Alias (Optional)</label>
          <input 
            type="text" 
            id="customAlias"
            placeholder="e.g. my-campaign"
            value={customAlias}
            onChange={(e) => setCustomAlias(e.target.value)}
            disabled={isLoading}
            style={{ padding: '0.5rem' }}
          />
        </div>

        {error && (
          <div style={{ color: 'red', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            {error}
          </div>
        )}

        <button 
          type="submit" 
          disabled={isLoading}
          style={{ padding: '0.75rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          {isLoading ? 'Shortening...' : 'Shorten URL'}
        </button>

      </form>

      {successResult && (
        <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#e0f2fe', borderRadius: '4px', border: '1px solid #bae6fd' }}>
          <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>Success!</p>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <a href={successResult.shortUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#0369a1', textDecoration: 'none', fontWeight: 'bold' }}>
              {successResult.shortUrl}
            </a>
            <button 
              onClick={handleCopy}
              style={{ padding: '0.4rem 0.8rem', background: copied ? '#10b981' : '#f8fafc', color: copied ? 'white' : '#334155', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}
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
