import React from 'react';

const DebugNegotiationChat = (props) => {
  console.log("Debug component props:", props);
  
  return (
    <div style={{
      border: '3px solid red',
      padding: '20px',
      margin: '20px',
      backgroundColor: 'lightyellow'
    }}>
      <h2>DEBUG COMPONENT LOADED</h2>
      <p>This is a test component to confirm rendering</p>
      <p>Time: {new Date().toLocaleTimeString()}</p>
      <pre>{JSON.stringify(props, null, 2)}</pre>
    </div>
  );
};

export default DebugNegotiationChat; 