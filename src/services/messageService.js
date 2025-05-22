import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebase/config';

export const getMessages = async (chatId) => {
  try {
    const messagesQuery = query(
      collection(db, 'messages'),
      where('chat_id', '==', chatId),
      orderBy('timestamp', 'asc'),
      limit(100)
    );
    const snapshot = await getDocs(messagesQuery);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    const fallbackQuery = query(
      collection(db, 'messages'),
      where('chat_id', '==', chatId)
    );
    const snapshot = await getDocs(fallbackQuery);
    const sorted = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => {
        const timeA = a.timestamp?.toMillis?.() || 0;
        const timeB = b.timestamp?.toMillis?.() || 0;
        return timeA - timeB;
      });
    return sorted;
  }
}; 