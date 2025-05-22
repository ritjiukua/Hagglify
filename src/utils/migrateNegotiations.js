import { collection, getDocs, doc, updateDoc, query, where, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { serverTimestamp } from 'firebase/firestore';

// This function standardizes your negotiation data for better dashboard visualizations
export const migrateNegotiationData = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.error('User not authenticated');
      return;
    }

    // Get all negotiations for current user
    const negotiationsQuery = query(
      collection(db, 'negotiations'),
      where('userId', '==', user.uid)
    );
    
    const snapshot = await getDocs(negotiationsQuery);
    console.log(`Found ${snapshot.size} negotiations to update`);
    
    for (const docSnapshot of snapshot.docs) {
      const negotiation = docSnapshot.data();
      const chatId = docSnapshot.id;
      
      // Standardize field names and add missing fields
      const updates = {
        // Ensure these key fields exist
        status: negotiation.status || (negotiation.completed ? 'completed' : 'ongoing'),
        user_id: negotiation.userId || negotiation.user_id,
        userId: negotiation.userId || negotiation.user_id,
        initial_price: negotiation.initial_price || 0,
        target_price: negotiation.target_price || 0,
        created_at: negotiation.createdAt || negotiation.created_at || serverTimestamp(),
        createdAt: negotiation.createdAt || negotiation.created_at || serverTimestamp(),
        updated_at: negotiation.updatedAt || negotiation.updated_at || serverTimestamp(),
        updatedAt: negotiation.updatedAt || negotiation.updated_at || serverTimestamp(),
        mode: negotiation.mode || 'BUYING'
      };

      // Calculate savings if we have enough information
      if (negotiation.final_price || negotiation.completed) {
        const finalPrice = negotiation.final_price || negotiation.initial_price;
        const mode = updates.mode;
        
        if (mode === 'BUYING') {
          updates.savings_amount = updates.initial_price - finalPrice;
          updates.savings_percentage = updates.initial_price > 0 
            ? (updates.savings_amount / updates.initial_price) * 100 
            : 0;
          updates.target_met = finalPrice <= updates.target_price;
        } else {
          updates.savings_amount = finalPrice - updates.target_price;
          updates.savings_percentage = updates.target_price > 0 
            ? (updates.savings_amount / updates.target_price) * 100 
            : 0;
          updates.target_met = finalPrice >= updates.target_price;
        }
        
        updates.successful = updates.target_met;
      }
      
      // Update document with standardized fields
      await updateDoc(doc(db, 'negotiations', chatId), updates);
      console.log(`Updated negotiation: ${chatId}`);
    }
    
    console.log('Migration completed successfully!');
    return true;
  } catch (error) {
    console.error('Error migrating negotiation data:', error);
    return false;
  }
};

export const migrateNegotiations = async (userId, db) => {
  const negotiationsRef = db.collection('negotiations').where('user_id', '==', userId);
  const snapshot = await negotiationsRef.get();
  const batch = db.batch();
  snapshot.forEach(doc => {
    const data = doc.data();
    const standardized = {
      ...data,
      item_name: data.item_name || '',
      initial_price: data.initial_price || 0,
      target_price: data.target_price || 0,
      final_price: data.final_price || 0,
      status: data.status || 'ongoing',
      created_at: data.created_at || new Date(),
      updated_at: new Date(),
      savings: data.initial_price && data.final_price ? data.initial_price - data.final_price : 0,
    };
    batch.update(doc.ref, standardized);
  });
  await batch.commit();
}; 