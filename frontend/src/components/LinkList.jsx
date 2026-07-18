import React from 'react';

function LinkList({ links, onViewStats }) {
  if (!links || links.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', border: '1px dashed #cbd5e1', borderRadius: '8px', marginTop: '2rem' }}>
        Your shortened links will appear here.
      </div>
    );
  }

  return (
    <div style={{ marginTop: '2rem' }}>
      <h3 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
        Recent Links
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {links.map((link, index) => (
          <div key={index} style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '1rem', 
            background: '#f8fafc', 
            border: '1px solid #e2e8f0', 
            borderRadius: '8px' 
          }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', marginRight: '1rem' }}>
              <a 
                href={link.shortUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                style={{ color: '#0369a1', fontWeight: 'bold', textDecoration: 'none', marginBottom: '0.25rem' }}
              >
                {link.shortUrl}
              </a>
              
              {/* CSS Text-Overflow ensures massive URLs don't break the UI */}
              <span style={{ 
                color: '#64748b', 
                fontSize: '0.85rem', 
                whiteSpace: 'nowrap', 
                overflow: 'hidden', 
                textOverflow: 'ellipsis' 
              }}>
                {link.originalUrl}
              </span>
            </div>

            <button 
              onClick={() => onViewStats(link.shortCode)}
              style={{ 
                whiteSpace: 'nowrap', 
                padding: '0.5rem 1rem', 
                background: '#e2e8f0', 
                color: '#334155', 
                border: 'none', 
                borderRadius: '4px', 
                cursor: 'pointer',
                fontWeight: '500'
              }}
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
