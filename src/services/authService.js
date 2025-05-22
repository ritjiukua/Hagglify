import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  updateProfile,
  EmailAuthProvider,
  reauthenticateWithCredential,
  confirmPasswordReset,
  verifyPasswordResetCode
} from 'firebase/auth';
import { setDoc, doc, serverTimestamp, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

// Register a new user - this will create collections
export const register = async (email, password, fullName) => {
  try {
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update profile with full name
    await updateProfile(user, {
      displayName: fullName
    });
    
    // Create user document - will create 'users' collection if it doesn't exist
    await setDoc(doc(db, 'users', user.uid), {
      email,
      full_name: fullName,
      created_at: serverTimestamp(),
      last_login: serverTimestamp()
    });
    
    // Create user settings document - will create 'user_settings' collection if it doesn't exist
    await setDoc(doc(db, 'user_settings', user.uid), {
      theme: 'light',
      share_statistics: true,
      email_notifications: true,
      allow_data_analytics: true,
      public_profile: false,
      user_id: user.uid,
      updated_at: serverTimestamp()
    });
    
    // Create initial user analytics record - will create 'user_analytics' collection
    await setDoc(doc(db, 'user_analytics', user.uid), {
      negotiations_count: 0,
      successful_negotiations: 0,
      money_saved: 0,
      average_discount: 0,
      last_updated: serverTimestamp(),
      user_id: user.uid
    });
    
    return user;
  } catch (error) {
    throw error;
  }
};

// Login
export const login = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

// Logout
export const logout = () => {
  return signOut(auth);
};

// Request password reset
export const requestPasswordReset = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return true;
  } catch (error) {
    throw error;
  }
};

// Reset password with token (action code)
export const resetPassword = async (actionCode, newPassword) => {
  try {
    // First verify the password reset code is valid
    await verifyPasswordResetCode(auth, actionCode);
    
    // If valid, confirm the password reset
    await confirmPasswordReset(auth, actionCode, newPassword);
    
    return true;
  } catch (error) {
    console.error('Error resetting password:', error);
    throw error;
  }
};

// Change password (authenticated)
export const changePassword = async (currentPassword, newPassword) => {
  try {
    const user = auth.currentUser;
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    
    // Re-authenticate user
    await reauthenticateWithCredential(user, credential);
    
    // Update password
    await updatePassword(user, newPassword);
    
    return true;
  } catch (error) {
    throw error;
  }
};

// Get current user
export const getCurrentUser = () => {
  return auth.currentUser;
};

// Update user profile - Firebase version
export const updateUserProfile = async (profileData) => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Update displayName in Firebase Auth if provided
    if (profileData.fullName) {
      await updateProfile(user, {
        displayName: profileData.fullName
      });
    }
    
    // Update Firestore user document
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      full_name: profileData.fullName || user.displayName,
      bio: profileData.bio || '',
      last_updated: serverTimestamp()
    });
    
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      ...profileData
    };
  } catch (error) {
    console.error('Profile update error:', error);
    throw error;
  }
};

// Get user profile data - Firebase version
export const getMe = async () => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Get user data from Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const settingsDoc = await getDoc(doc(db, 'user_settings', user.uid));
    const analyticsDoc = await getDoc(doc(db, 'user_analytics', user.uid));
    
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      ...(userDoc.exists() ? userDoc.data() : {}),
      settings: settingsDoc.exists() ? settingsDoc.data() : {},
      analytics: analyticsDoc.exists() ? analyticsDoc.data() : {}
    };
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

// Firebase doesn't need this function, as it manages tokens internally
// But we can keep a similar function that gets the current user's ID token
export const getAuthToken = async () => {
  const user = auth.currentUser;
  if (!user) return null;
  
  try {
    return await user.getIdToken();
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}; 