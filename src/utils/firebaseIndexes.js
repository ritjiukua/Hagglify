import { db } from '../firebase/config';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';

export const createMessagesIndex = async () => {
  const q = query(collection(db, 'messages'), orderBy('created_at'));
  await getDocs(q);
};

export const createNegotiationChatsIndex = async () => {
  const q = query(collection(db, 'negotiation_chats'), orderBy('updated_at'));
  await getDocs(q);
}; 