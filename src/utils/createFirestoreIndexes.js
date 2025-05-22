import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { createNegotiationChatsIndex, createMessagesIndex } from './firebaseIndexes';

// This function is used to trigger the creation of necessary indexes
// Run this function once from any component to get the index creation links
export const createRequiredIndexes = async () => {
  try {
    // This will trigger the index creation for negotiation_chats
    try {
      const q1 = query(
        collection(db, 'negotiation_chats'),
        where('user_id', '==', 'dummy-user'),
        orderBy('updated_at', 'desc')
      );
      await getDocs(q1);
    } catch (error) {
      console.log('Index creation link for negotiation_chats:', error.message);
    }
    
    // This will trigger the index creation for messages
    try {
      const q2 = query(
        collection(db, 'messages'),
        where('chat_id', '==', 'dummy-chat'),
        orderBy('timestamp', 'asc')
      );
      await getDocs(q2);
    } catch (error) {
      console.log('Index creation link for messages:', error.message);
    }
    
    console.log('Please create the indexes using the links above');
  } catch (error) {
    console.error('Error creating indexes:', error);
  }
};

export const triggerIndexCreation = () => {
  createNegotiationChatsIndex();
  createMessagesIndex();
}; 