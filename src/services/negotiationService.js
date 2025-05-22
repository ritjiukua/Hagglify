import axios from 'axios';
import { setAuthToken } from './authService';
import { 
  collection, addDoc, updateDoc, doc, 
  getDoc, getDocs, query, where, 
  orderBy, serverTimestamp, setDoc, deleteDoc,
  arrayUnion
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { logFirebaseOperation, logError } from './debugService';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Helper function to get auth headers consistently
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'x-auth-token': token
  };
};

export const getNegotiationSuggestions = async (chatHistory) => {
  try {
    // For now, return some basic suggestions
    // In a real implementation, this would call an AI service
    const basicSuggestions = [
      "Consider mentioning that you've found similar items at a lower price",
      "Ask if they can include any additional value at the current price",
      "Suggest a specific price that's between their asking price and your target"
    ];
    
    // In the future, this could call a serverless function or direct API
    // that analyzes the chat history and generates personalized suggestions
    
    return basicSuggestions;
  } catch (error) {
    console.error('Error getting negotiation suggestions:', error);
    throw error;
  }
};

export const saveChatHistory = async (chatData) => {
  try {
    const token = localStorage.getItem('token');
    
    // Check if chat already exists
    let url = `${API_URL}/api/chats`;
    let method = 'post';
    
    if (chatData.chatId) {
      // Update existing chat
      url = `${API_URL}/api/chats/${chatData.chatId}`;
      method = 'put';
    }
    
    // Make sure all required fields are included
    const payload = {
      item_name: chatData.itemName || '',  // Add default empty string to avoid NULL
      mode: chatData.mode || 'BUYING',     // Add default value
      initial_price: parseFloat(chatData.initialPrice || 0),  // Default to 0
      target_price: parseFloat(chatData.targetPrice || 0),    // Default to 0
      status: chatData.status || 'ongoing', // Add default status
      messages: chatData.messages || []     // Ensure messages array exists
    };
    
    console.log(`Saving chat history with method ${method} to URL ${url}`);
    console.log('Payload:', payload);
    
    // Make request with appropriate method
    const response = await axios({
      method,
      url,
      data: payload,
      headers: getAuthHeaders()
    });
    
    return {
      success: true,
      chatId: response.data.id
    };
  } catch (error) {
    console.error('Error saving chat:', error);
    
    // Log detailed error information
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    
    throw error;
  }
};

export const getChatHistory = async () => {
  try {
    // Get current user - wait for auth state to initialize if needed
    const user = auth.currentUser;
    
    // Check if user is authenticated
    if (!user) {
      logFirebaseOperation('query', 'negotiations', null, { userId: 'not_authenticated' });
      
      // Wait a moment for auth to initialize (optional)
      if (!auth.currentUser) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Check again after waiting
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
    }

    const userId = user.uid;
    logFirebaseOperation('query', 'negotiations', null, { userId });
    
    const negotiationsRef = collection(db, 'negotiations');
    const q = query(
      negotiationsRef,
      where('user_id', '==', userId),
      orderBy('updated_at', 'desc')
    );

    const querySnapshot = await getDocs(q);
    
    const negotiations = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Ensure timestamps are properly handled
      created_at: doc.data().created_at?.toDate?.() || doc.data().created_at,
      updated_at: doc.data().updated_at?.toDate?.() || doc.data().updated_at,
      // Add messages count if available
      messages_count: doc.data().messages?.length || 0
    }));
    
    logFirebaseOperation('query:success', 'negotiations', null, { count: negotiations.length });
    return negotiations;
  } catch (error) {
    logError(error, 'Error fetching chat history');
    throw error;
  }
};

export const getChatById = async (chatId) => {
  try {
    logFirebaseOperation('getDoc', 'negotiations', chatId);
    
    const user = auth.currentUser;
    if (!user) {
      const error = new Error('User not authenticated');
      logError(error, 'getChatById');
      throw error;
    }

    const chatDoc = await getDoc(doc(db, 'negotiations', chatId));
    
    if (!chatDoc.exists()) {
      const error = new Error('Chat not found');
      logError(error, 'getChatById');
      throw error;
    }

    // Security check
    const chatData = chatDoc.data();
    if (chatData.userId !== user.uid) {
      const error = new Error('Unauthorized access to chat');
      logError(error, 'getChatById');
      throw error;
    }

    logFirebaseOperation('getDoc:success', 'negotiations', chatId, null, chatData);
    return { id: chatDoc.id, ...chatData };
  } catch (error) {
    logError(error, 'getChatById');
    throw error;
  }
};

export const createChat = async (negotiationData) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    // Create the chat document in 'negotiation_chats' collection
    const chatData = {
      item_name: negotiationData.itemName,
      initial_price: parseFloat(negotiationData.initialPrice),
      target_price: parseFloat(negotiationData.targetPrice),
      mode: negotiationData.mode,
      user_id: user.uid,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
      status: 'active',
      messages_count: 0,
      last_message_time: null
    };

    const chatRef = await addDoc(collection(db, 'negotiation_chats'), chatData);
    console.log('Chat created with ID:', chatRef.id);
    
    return {
      id: chatRef.id,
      ...chatData
    };
  } catch (error) {
    console.error('Error creating chat:', error);
    throw error;
  }
};

export const saveMessage = async (chatId, messageData) => {
  try {
    logFirebaseOperation('updateDoc', 'negotiations', chatId, { message: messageData });
    
    const user = auth.currentUser;
    if (!user) {
      const error = new Error('User not authenticated');
      logError(error, 'saveMessage');
      throw error;
    }

    const chatRef = doc(db, 'negotiations', chatId);
    const chatDoc = await getDoc(chatRef);

    if (!chatDoc.exists()) {
      const error = new Error('Chat not found');
      logError(error, 'saveMessage');
      throw error;
    }

    // Security check
    const chatData = chatDoc.data();
    if (chatData.userId !== user.uid) {
      const error = new Error('Unauthorized access to chat');
      logError(error, 'saveMessage');
      throw error;
    }

    // Create a clean message object without circular references
    const cleanMessageData = {
      sender: messageData.sender,
      content: messageData.content || messageData.message,
      timestamp: messageData.timestamp || new Date().toISOString()
    };

    // First update with arrayUnion (without serverTimestamp)
    await updateDoc(chatRef, {
      messages: arrayUnion(cleanMessageData)
    });
    
    logFirebaseOperation('updateDoc:messages:success', 'negotiations', chatId, cleanMessageData);
    
    // Then separately update the updatedAt field
    await updateDoc(chatRef, {
      updatedAt: serverTimestamp()
    });
    
    logFirebaseOperation('updateDoc:updatedAt:success', 'negotiations', chatId);
    return true;
  } catch (error) {
    logError(error, 'saveMessage', { chatId, messageData });
    throw error;
  }
};

export const addMessage = async (chatId, sender, message) => {
  try {
    // Get current user
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Check if chat exists and belongs to user
    const chatDoc = await getDoc(doc(db, 'negotiation_chats', chatId));
    if (!chatDoc.exists() || chatDoc.data().user_id !== user.uid) {
      throw new Error('Chat not found or unauthorized');
    }
    
    // Add message to Firestore
    const messageRef = await addDoc(collection(db, 'messages'), {
      chat_id: chatId,
      sender: sender,
      message: message,
      timestamp: serverTimestamp()
    });
    
    // Update chat's updated_at timestamp
    await updateDoc(doc(db, 'negotiation_chats', chatId), {
      updated_at: serverTimestamp()
    });
    
    return {
      id: messageRef.id,
      chat_id: chatId,
      sender,
      message,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('Error adding message:', error);
    throw error;
  }
};

export const completeNegotiation = async (chatId, finalPrice) => {
  return updateNegotiationMetrics(chatId, finalPrice);
};

export const updateChatStatus = async (chatId, status) => {
  try {
    // Get current user
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Check if chat exists and belongs to user
    const chatDoc = await getDoc(doc(db, 'negotiation_chats', chatId));
    if (!chatDoc.exists() || chatDoc.data().user_id !== user.uid) {
      throw new Error('Chat not found or unauthorized');
    }
    
    // Update chat status
    await updateDoc(doc(db, 'negotiation_chats', chatId), {
      status: status,
      updated_at: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating chat status:', error);
    throw error;
  }
};

export const deleteChat = async (chatId) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const chatRef = doc(db, 'negotiations', chatId);
    const chatDoc = await getDoc(chatRef);

    if (!chatDoc.exists()) {
      throw new Error('Chat not found');
    }

    // Security check
    const chatData = chatDoc.data();
    if (chatData.userId !== user.uid) {
      throw new Error('Unauthorized access to chat');
    }

    await updateDoc(chatRef, {
      deleted: true,
      deletedAt: serverTimestamp()
    });

    return true;
  } catch (error) {
    console.error('Error deleting chat:', error);
    throw error;
  }
};

export const getChatMessages = async (chatId) => {
  try {
    const messagesQuery = query(
      collection(db, 'messages'),
      where('chat_id', '==', chatId),
      orderBy('timestamp', 'asc')
    );

    const querySnapshot = await getDocs(messagesQuery);
    const messages = [];

    querySnapshot.forEach((doc) => {
      messages.push({
        id: doc.id,
        ...doc.data(),
        // Format for the component
        text: doc.data().message,
        time: doc.data().timestamp ? new Date(doc.data().timestamp.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '',
        saved: true
      });
    });

    return messages;
  } catch (error) {
    console.error('Error getting chat messages:', error);
    throw error;
  }
};

// End a negotiation and update metrics
export const endNegotiation = async (chatId, outcome) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');
    
    // 1. Update the chat status
    const chatRef = doc(db, 'negotiation_chats', chatId);
    await updateDoc(chatRef, {
      status: 'completed',
      final_price: outcome.finalPrice,
      successful: outcome.successful,
      target_met: outcome.targetMet,
      savings_amount: outcome.savings,
      savings_percentage: outcome.savingsPercentage,
      completed_at: serverTimestamp(),
      updated_at: serverTimestamp()
    });
    
    // 2. Update user analytics
    await updateUserAnalytics(user.uid, outcome);
    
    return { success: true };
  } catch (error) {
    console.error('Error ending negotiation:', error);
    throw error;
  }
};

// Update user analytics with new negotiation data
const updateUserAnalytics = async (userId, outcome) => {
  try {
    const analyticsRef = doc(db, 'user_analytics', userId);
    const analyticsSnap = await getDoc(analyticsRef);
    
    if (analyticsSnap.exists()) {
      const currentData = analyticsSnap.data();
      
      // Calculate new values
      const negotiationsCount = (currentData.negotiations_count || 0) + 1;
      const successfulNegotiations = outcome.successful 
        ? (currentData.successful_negotiations || 0) + 1 
        : (currentData.successful_negotiations || 0);
      
      // Money saved is cumulative positive savings only
      const moneySaved = outcome.savings > 0 
        ? (currentData.money_saved || 0) + outcome.savings
        : (currentData.money_saved || 0);
      
      // Calculate new average discount including this negotiation
      const totalDiscountPercentage = 
        (currentData.average_discount || 0) * (negotiationsCount - 1) + 
        (outcome.savingsPercentage > 0 ? outcome.savingsPercentage : 0);
      
      const averageDiscount = negotiationsCount > 0 
        ? totalDiscountPercentage / negotiationsCount
        : 0;
      
      // Update the analytics document
      await updateDoc(analyticsRef, {
        negotiations_count: negotiationsCount,
        successful_negotiations: successfulNegotiations,
        money_saved: moneySaved,
        average_discount: averageDiscount,
        last_updated: serverTimestamp()
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error updating user analytics:', error);
    throw error;
  }
};

export const createNewChat = async (chatData) => {
  try {
    logFirebaseOperation('addDoc', 'negotiations', null, chatData);
    
    const user = auth.currentUser;
    if (!user) {
      const error = new Error('User not authenticated');
      logError(error, 'createNewChat');
      throw error;
    }

    // Create chat with client-side timestamp
    const newChatData = {
      ...chatData,
      userId: user.uid,
      messages: [],
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const chatRef = await addDoc(collection(db, 'negotiations'), newChatData);
    
    logFirebaseOperation('addDoc:success', 'negotiations', chatRef.id, newChatData);
    return chatRef.id;
  } catch (error) {
    logError(error, 'createNewChat', { chatData });
    throw error;
  }
};

export const getUserChats = async () => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const chatsQuery = query(
      collection(db, 'negotiations'),
      where('userId', '==', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const querySnapshot = await getDocs(chatsQuery);
    const chats = [];

    querySnapshot.forEach((doc) => {
      chats.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return chats;
  } catch (error) {
    console.error('Error getting user chats:', error);
    throw error;
  }
};

export const updateNegotiationFinalPrice = async (negotiationId, finalPrice) => {
  try {
    const negotiationRef = doc(db, 'negotiations', negotiationId);
    await updateDoc(negotiationRef, {
      final_price: finalPrice,
      updated_at: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error updating final price:', error);
    throw error;
  }
};

// Add this function to calculate and update negotiation metrics
export const updateNegotiationMetrics = async (chatId, finalPrice = null) => {
  try {
    const chatRef = doc(db, 'negotiations', chatId);
    const chatDoc = await getDoc(chatRef);
    
    if (!chatDoc.exists()) {
      console.error('Negotiation not found');
      return null;
    }
    
    const chatData = chatDoc.data();
    const initialPrice = chatData.initial_price || 0;
    const targetPrice = chatData.target_price || 0;
    const mode = chatData.mode || 'BUYING';
    
    // Use provided finalPrice or current price
    const actualFinalPrice = finalPrice || chatData.final_price || initialPrice;
    
    // Calculate savings or profit based on negotiation mode
    let savingsAmount = 0;
    let savingsPercentage = 0;
    let targetMet = false;
    
    if (mode === 'BUYING') {
      // For buying: savings = initial price - final price
      savingsAmount = initialPrice - actualFinalPrice;
      savingsPercentage = initialPrice > 0 ? (savingsAmount / initialPrice) * 100 : 0;
      targetMet = actualFinalPrice <= targetPrice;
    } else {
      // For selling: profit = final price - target price
      savingsAmount = actualFinalPrice - targetPrice;
      savingsPercentage = targetPrice > 0 ? (savingsAmount / targetPrice) * 100 : 0;
      targetMet = actualFinalPrice >= targetPrice;
    }
    
    // Count messages
    const messagesQuery = query(
      collection(db, 'messages'),
      where('chat_id', '==', chatId)
    );
    const messagesSnapshot = await getDocs(messagesQuery);
    const messagesCount = messagesSnapshot.size;
    
    // Prepare update data
    const updateData = {
      final_price: actualFinalPrice,
      savings_amount: savingsAmount,
      savings_percentage: savingsPercentage,
      target_met: targetMet,
      successful: targetMet, // Consider negotiation successful if target was met
      messages_count: messagesCount,
      updated_at: serverTimestamp()
    };
    
    // If completing the negotiation, add completion data
    if (finalPrice !== null) {
      updateData.status = 'completed';
      updateData.completed_at = serverTimestamp();
      updateData.completed = true;
    }
    
    // Update the document
    await updateDoc(chatRef, updateData);
    
    return {
      ...chatData,
      ...updateData
    };
  } catch (error) {
    console.error('Error updating negotiation metrics:', error);
    throw error;
  }
};

export default {
  getChatById,
  createNewChat,
  saveMessage,
  getUserChats,
  completeNegotiation,
  deleteChat
}; 