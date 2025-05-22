const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { pool } = require('../db');  // Correct import with destructuring

// Debug route - no auth required
router.get('/debug', (req, res) => {
  console.log('Debug endpoint hit');
  res.json({ message: 'Chat debug endpoint is working' });
});

// Get all chats for the current user
router.get('/', auth, async (req, res) => {
  try {
    console.log('Getting chats for user:', req.user.id);
    
    // Get chat history for current user
    const chatResults = await pool.query(
      'SELECT * FROM negotiation_chats WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    
    const chats = chatResults.rows;
    console.log(`Found ${chats.length} chats for user ${req.user.id}`);
    
    // For each chat, get its messages
    const chatsWithMessages = await Promise.all(
      chats.map(async (chat) => {
        const messagesResult = await pool.query(
          'SELECT * FROM messages WHERE chat_id = $1 ORDER BY timestamp ASC',
          [chat.id]
        );
        
        return {
          ...chat,
          messages: messagesResult.rows
        };
      })
    );
    
    res.json(chatsWithMessages);
  } catch (error) {
    console.error('Error getting chat history:', error);
    res.status(500).json({ error: 'Failed to retrieve chat history' });
  }
});

// Create a new chat
router.post('/', auth, async (req, res) => {
  try {
    let { item_name, mode, initial_price, target_price } = req.body;
    const userId = req.user.id; // Get user ID from the authenticated token
    
    console.log(`Creating new chat for user ${userId}`);
    console.log('Request body:', req.body);
    
    // FORCE DEFAULT VALUES for any missing fields
    item_name = item_name || 'Default Item';
    mode = mode || 'BUYING';
    initial_price = initial_price === undefined ? 0 : initial_price;
    target_price = target_price === undefined ? 0 : target_price;
    
    console.log('GUARANTEED VALUES:', { item_name, mode, initial_price, target_price });
    
    // Insert the new chat with guaranteed values
    const result = await pool.query(
      `INSERT INTO negotiation_chats 
       (user_id, item_name, mode, initial_price, target_price, created_at, status) 
       VALUES ($1, $2, $3, $4, $5, NOW(), 'ongoing') 
       RETURNING *`,
      [userId, item_name, mode, initial_price, target_price]
    );
    
    const newChat = result.rows[0];
    console.log('Chat created:', newChat);
    
    res.status(201).json(newChat);
  } catch (error) {
    console.error('Error creating chat:', error);
    console.error('SQL error details:', error.detail);
    res.status(500).json({ error: 'Failed to create chat', details: error.message });
  }
});

// Get a specific chat by ID
router.get('/:chatId', auth, async (req, res) => {
  try {
    const { chatId } = req.params;
    console.log(`Getting chat ${chatId} for user ${req.user.id}`);
    
    // Get chat
    const chatResult = await pool.query(
      'SELECT * FROM negotiation_chats WHERE id = $1 AND user_id = $2',
      [chatId, req.user.id]
    );
    
    if (chatResult.rows.length === 0) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    
    // Get messages for this chat
    const messagesResult = await pool.query(
      'SELECT * FROM messages WHERE chat_id = $1 ORDER BY timestamp ASC',
      [chatId]
    );
    
    // Return chat with messages
    const chatWithMessages = {
      ...chatResult.rows[0],
      messages: messagesResult.rows
    };
    
    res.json(chatWithMessages);
  } catch (error) {
    console.error('Error getting chat:', error);
    res.status(500).json({ error: 'Failed to retrieve chat' });
  }
});

router.get('/test', (req, res) => {
    res.json({ message: 'API is working' });
  });
// Add a message to a chat
router.post('/:chatId/messages', auth, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { sender, content, message, text } = req.body;
    
    console.log('💬 Message save request received:');
    console.log('- Chat ID:', chatId);
    console.log('- User ID:', req.user.id);
    console.log('- Request body:', JSON.stringify(req.body));
    
    // Try all possible message content fields
    // This handles different formats from the frontend
    const messageContent = message || content || text || "";
    
    if (!messageContent) {
      console.error('❌ Message content missing from request');
      return res.status(400).json({ error: 'Message content is required' });
    }
    
    if (!sender) {
      console.error('❌ Sender missing from request');
      return res.status(400).json({ error: 'Sender is required' });
    }
    
    // Check if the chat exists and belongs to the user
    const chatResult = await pool.query(
      'SELECT * FROM negotiation_chats WHERE id = $1 AND user_id = $2',
      [chatId, req.user.id]
    );
    
    if (chatResult.rows.length === 0) {
      console.error(`❌ Chat ${chatId} not found or not owned by user ${req.user.id}`);
      return res.status(404).json({ error: 'Chat not found or not owned by user' });
    }
    
    console.log(`✓ Chat ${chatId} verified - belongs to user ${req.user.id}`);
    console.log(`➡️ Saving message: "${messageContent}" from sender: ${sender}`);
    
    // Use a transaction for atomicity
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Insert message with explicit column names
      const insertQuery = `
        INSERT INTO messages (chat_id, sender, message, timestamp)
        VALUES ($1, $2, $3, NOW())
        RETURNING *
      `;
      
      const messageResult = await client.query(insertQuery, [chatId, sender, messageContent]);
      
      // Update chat timestamp - using both fields to be safe
      await client.query(
        'UPDATE negotiation_chats SET completed_at = NOW(), updated_at = NOW() WHERE id = $1',
        [chatId]
      );
      
      await client.query('COMMIT');
      
      console.log('✅ Message saved successfully:', messageResult.rows[0]);
      res.status(201).json(messageResult.rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Error saving message:', error);
    
    if (error.code) {
      console.error('SQL error code:', error.code);
      console.error('SQL error detail:', error.detail);
    }
    
    res.status(500).json({
      error: 'Failed to save message',
      details: error.message,
      code: error.code
    });
  }
});

// Generate suggestions using DeepSeek Chat API
router.post('/suggestions', async (req, res) => {
  try {
    const suggestions = await generateSuggestions(req.body);
    res.json(suggestions);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to generate suggestions' });
  }
});

// Add this debug endpoint to test direct database operations
router.post('/debug/test-insert', auth, async (req, res) => {
  try {
    console.log('🔍 Running manual database insertion test');
    
    // First, get or create a chat to use
    let chatId;
    const chatCheck = await pool.query(
      'SELECT id FROM negotiation_chats WHERE user_id = $1 LIMIT 1',
      [req.user.id]
    );
    
    if (chatCheck.rows.length === 0) {
      // Create a test chat
      const newChat = await pool.query(
        `INSERT INTO negotiation_chats 
        (user_id, item_name, initial_price, target_price, mode, status, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW()) 
        RETURNING id`,
        [req.user.id, 'Test Item', 100, 80, 'BUYING', 'ongoing']
      );
      chatId = newChat.rows[0].id;
      console.log('Created test chat:', chatId);
    } else {
      chatId = chatCheck.rows[0].id;
      console.log('Using existing chat:', chatId);
    }
    
    // Try a direct database insertion
    const result = await pool.query(
      `INSERT INTO messages (chat_id, sender, message, timestamp)
       VALUES ($1, $2, $3, NOW())
       RETURNING *`,
      [chatId, 'debug-test', 'This is a test message from debug endpoint']
    );
    
    console.log('Test message inserted successfully!');
    console.log('Message data:', result.rows[0]);
    
    // Verify it was saved by selecting it back
    const verification = await pool.query(
      'SELECT * FROM messages WHERE id = $1',
      [result.rows[0].id]
    );
    
    res.json({
      success: true,
      message: 'Test message insertion successful',
      inserted: result.rows[0],
      verified: verification.rows[0],
      chatId: chatId
    });
  } catch (error) {
    console.error('Error in debug test:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code,
      detail: error.detail
    });
  }
});

module.exports = router;