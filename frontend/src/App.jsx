import React, { useState } from 'react';
import ShortenForm from './components/ShortenForm';
import LinkList from './components/LinkList';
import StatsPanel from './components/StatsPanel';
import './index.css';

function App() {
  const [links, setLinks] = useState([]);
  const [selectedShortCode, setSelectedShortCode] = useState(null);

  const handleLinkCreated = (newLink) => {
    // Add the new link to the TOP of the list
    setLinks(prevLinks => [newLink, ...prevLinks]);
    // Automatically select the new link to view stats
    setSelectedShortCode(newLink.shortCode);
  };

  const handleViewStats = (shortCode) => {
    setSelectedShortCode(shortCode);
  };

  return (
    <div className="app-container">
      <h1>ShortLink</h1>
      <p className="subtitle">Your enterprise-grade URL shortener.</p>
      
      <div className="dashboard-grid">
        {/* Left Column: Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <ShortenForm onShortened={handleLinkCreated} />
          <LinkList links={links} onViewStats={handleViewStats} />
        </div>
        
        {/* Right Column: Analytics */}
        <div>
          <StatsPanel selectedShortCode={selectedShortCode} />
        </div>
      </div>
    </div>
  );
}

export default App;
