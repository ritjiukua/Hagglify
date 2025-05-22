import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

// Get user profile data
export const getUserProfile = async (uid) => {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    return userSnap.data();
  } else {
    return null;
  }
};

// Update or create user profile
export const updateUserProfile = async (uid, profileData) => {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  const standardFields = {
    updatedAt: serverTimestamp(),
    ...profileData,
  };
  if (!userSnap.exists()) {
    await setDoc(userRef, {
      ...standardFields,
      createdAt: serverTimestamp(),
    });
  } else {
    await updateDoc(userRef, standardFields);
  }
};

// Initialize user profile after registration
export const initializeUserProfile = async (uid, email, fullName) => {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) {
    await setDoc(userRef, {
      email,
      full_name: fullName,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}; 