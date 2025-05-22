console.log('Environment variables:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('REACT_APP_GPT_API_KEY exists:', !!process.env.REACT_APP_GPT_API_KEY);

// Import this file in your App.js
import './.env.test.js'; 