import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, collection, addDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { firebaseConfig } from './config'; // Import your Firebase config

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Helper function to create a test user in Firebase Auth
async function createTestUser() {
  try {
    // Create a test user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      "test@example.com", 
      "Test123456"
    );
    
    // Update profile with display name
    await updateProfile(userCredential.user, {
      displayName: "Test User"
    });
    
    console.log(`Created test user with UID: ${userCredential.user.uid}`);
    return userCredential.user;
  } catch (error) {
    // Handle if user already exists
    if (error.code === 'auth/email-already-in-use') {
      console.log('Test user already exists, signing in...');
      // You might want to sign in here instead
      // For this example, we'll just return a mock user with a static ID
      return { uid: "test_user_id" };
    }
    console.error('Error creating test user:', error);
    throw error;
  }
}

// Create all collections with proper relationships
async function setupCollections() {
  try {
    // First create test user
    const user = await createTestUser();
    const userId = user.uid;
    
    // Use a batch write to ensure atomicity
    const batch = writeBatch(db);
    
    // 1. Create user document
    const userDocRef = doc(db, 'users', userId);
    batch.set(userDocRef, {
      email: "test@example.com",
      full_name: "Test User",
      bio: "This is a test user account",
      created_at: serverTimestamp(),
      last_login: serverTimestamp()
    });
    
    // 2. Create user settings document
    const settingsDocRef = doc(db, 'user_settings', userId);
    batch.set(settingsDocRef, {
      theme: "light",
      share_statistics: true,
      email_notifications: true,
      allow_data_analytics: true,
      public_profile: false,
      user_id: userId,
      updated_at: serverTimestamp()
    });
    
    // 3. Create user analytics document
    const analyticsDocRef = doc(db, 'user_analytics', userId);
    batch.set(analyticsDocRef, {
      negotiations_count: 0,
      successful_negotiations: 0,
      money_saved: 0,
      average_discount: 0,
      last_negotiation_date: null,
      last_updated: serverTimestamp(),
      user_id: userId
    });
    
    // Commit the batch
    await batch.commit();
    console.log('Created user-related collections (users, user_settings, user_analytics)');
    
    // 4. Create a test negotiation chat
    const chatRef = await addDoc(collection(db, 'negotiation_chats'), {
      user_id: userId,
      item_name: "Professional Camera",
      mode: "buyer",
      initial_price: 1200,
      target_price: 950,
      current_price: 1200,
      status: "ongoing",
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
      item_description: "High-end professional camera with accessories",
      seller_name: "PhotoGear Store",
      last_message_preview: "Hello, I'm interested in this camera."
    });
    
    console.log(`Created negotiation chat with ID: ${chatRef.id}`);
    
    // 5. Create test messages
    const messagesData = [
      {
        chat_id: chatRef.id,
        message: "Hello, I'm interested in purchasing this professional camera. Is the price negotiable?",
        sender: "user",
        timestamp: new Date(Date.now() - 60000) // 1 minute ago
      },
      {
        chat_id: chatRef.id,
        message: "Hello! Thank you for your interest. We might have some flexibility on the price. What did you have in mind?",
        sender: "ai",
        timestamp: new Date()
      }
    ];
    
    // Add messages
    for (const messageData of messagesData) {
      await addDoc(collection(db, 'messages'), messageData);
    }
    
    console.log('Created messages collection with test messages');
    
    console.log('All collections created successfully!');
  } catch (error) {
    console.error('Error setting up collections:', error);
  }
}

// Execute the setup
setupCollections();

// Export this function so it can be imported and used elsewhere
export default setupCollections; 