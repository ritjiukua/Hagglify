import { collection, addDoc, getDocs, query, where, doc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

// Create a new template
export const createTemplate = async (templateData) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const template = {
      title: templateData.title,
      content: templateData.content,
      category: templateData.category,
      user_id: user.uid,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
      usage: 0,
      success: 0
    };

    const templateRef = await addDoc(collection(db, 'templates'), template);
    
    return {
      id: templateRef.id,
      ...template
    };
  } catch (error) {
    console.error('Error creating template:', error);
    throw error;
  }
};

// Get templates for the current user
export const getUserTemplates = async () => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const templatesQuery = query(
      collection(db, 'templates'),
      where('user_id', '==', user.uid)
    );

    const querySnapshot = await getDocs(templatesQuery);
    const templates = [];

    querySnapshot.forEach((doc) => {
      templates.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return templates;
  } catch (error) {
    console.error('Error getting templates:', error);
    throw error;
  }
};

// Update a template
export const updateTemplate = async (templateId, updates) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const templateRef = doc(db, 'templates', templateId);
    
    await updateDoc(templateRef, {
      ...updates,
      updated_at: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating template:', error);
    throw error;
  }
};

// Delete a template
export const deleteTemplate = async (templateId) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    await deleteDoc(doc(db, 'templates', templateId));
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting template:', error);
    throw error;
  }
}; 