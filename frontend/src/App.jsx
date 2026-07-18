import React, { useState } from 'react';
import ShortenForm from './components/ShortenForm';
import LinkList from './components/LinkList';

function App() {
  const [links, setLinks] = useState([]);

  const handleLinkCreated = (newLink) => {
    // Add the new link to the TOP of the list
    setLinks(prevLinks => [newLink, ...prevLinks]);
  };

  const handleViewStats = (shortCode) => {
    console.log("User wants to view stats for:", shortCode);
    alert(`Stats panel coming in Chunk 7.4! You clicked on: ${shortCode}`);
  };

  return (
    <div className="app-container" style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ textAlign: 'center', margin: '0 0 0.5rem 0' }}>ShortLink</h1>
      <p style={{ textAlign: 'center', color: '#64748b' }}>Your premium URL shortener.</p>
      
      <ShortenForm onShortened={handleLinkCreated} />
      
      <LinkList links={links} onViewStats={handleViewStats} />
    </div>
  );
}

export default App;
