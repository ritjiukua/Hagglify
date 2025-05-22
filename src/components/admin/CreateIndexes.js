import React, { useState } from 'react';
import { createRequiredIndexes } from '../../utils/createFirestoreIndexes';

const CreateIndexes = () => {
  const [indexLinks, setIndexLinks] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const handleCreateIndexes = async () => {
    setLoading(true);
    try {
      // Override console.log temporarily to capture index links
      const originalConsoleLog = console.log;
      const links = [];
      
      console.log = (...args) => {
        originalConsoleLog(...args);
        
        // Capture Firestore index creation links
        const str = args.join(' ');
        if (str.includes('https://console.firebase.google.com')) {
          links.push(str);
        }
      };
      
      await createRequiredIndexes();
      
      // Restore original console.log
      console.log = originalConsoleLog;
      
      setIndexLinks(links);
    } catch (error) {
      console.error('Error generating index links:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Create Firestore Indexes</h1>
      <p>
        Click the button below to generate links for creating required Firestore indexes.
        You'll need to click each link and follow the Firebase console instructions to create the indexes.
      </p>
      
      <button 
        onClick={handleCreateIndexes}
        style={{
          padding: '10px 20px',
          background: '#4285F4',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginBottom: '20px'
        }}
        disabled={loading}
      >
        {loading ? 'Generating...' : 'Generate Index Links'}
      </button>
      
      {indexLinks.length > 0 && (
        <div>
          <h2>Required Indexes</h2>
          <p>Click each link below to create the required indexes in Firebase Console:</p>
          
          <ul style={{ listStyleType: 'none', padding: 0 }}>
            {indexLinks.map((link, index) => {
              // Extract the URL from the log message
              const urlMatch = link.match(/(https:\/\/console\.firebase\.google\.com\S+)/);
              const url = urlMatch ? urlMatch[1] : '';
              
              return (
                <li key={index} style={{ marginBottom: '10px', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}>
                  <div style={{ marginBottom: '10px' }}>{link}</div>
                  {url && (
                    <a 
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-block',
                        padding: '8px 16px',
                        background: '#4CAF50',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '4px'
                      }}
                    >
                      Create Index
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
          
          <p><strong>Note:</strong> After creating all indexes, you may need to wait a few minutes for them to be fully deployed.</p>
        </div>
      )}
    </div>
  );
};

export default CreateIndexes; 