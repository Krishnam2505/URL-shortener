import React from 'react';

function LinkList({ links, onViewStats }) {
  if (!links || links.length === 0) {
    return (
      <div className="empty-state">
        Your shortened links will appear here.
      </div>
    );
  }

  return (
    <div className="glass-card">
      <h2 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
        Recent Links
      </h2>
      
      <div>
        {links.map((link, index) => (
          <div key={index} className="link-item">
            
            <div className="link-content">
              <a 
                href={link.shortUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="short-url"
              >
                {link.shortUrl}
              </a>
              
              <span className="original-url">
                {link.originalUrl}
              </span>
            </div>

            <button 
              onClick={() => onViewStats(link.shortCode)}
              className="btn-secondary"
            >
              View Stats
            </button>
            
          </div>
        ))}
      </div>
    </div>
  );
}

export default LinkList;
