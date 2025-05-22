require('dotenv').config(); // If using environment variables
const { setupCollections } = require('../src/firebase/setupCollections');

// Run the setup
setupCollections()
  .then(() => {
    console.log('Firestore collections setup complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('Setup failed:', error);
    process.exit(1);
  }); 