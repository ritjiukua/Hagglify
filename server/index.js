const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const axios = require('axios');
const { pool, validateDatabase } = require('./db'); // Use the pool from db.js instead of creating a new one
const authRoutes = require('./routes/auth');
const auth = require('./middleware/auth');
const chatsRouter = require('./routes/chats');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

// Add this middleware before your routes
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Create tables on startup
const initDb = async () => {
  try {
    // Create users table with auth fields
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        reset_token VARCHAR(255),
        reset_token_expires TIMESTAMP,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create user settings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_settings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        theme VARCHAR(20) DEFAULT 'light',
        share_statistics BOOLEAN DEFAULT true,
        email_notifications BOOLEAN DEFAULT true,
        allow_data_analytics BOOLEAN DEFAULT true,
        public_profile BOOLEAN DEFAULT false,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create user analytics table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_analytics (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        negotiations_count INTEGER DEFAULT 0,
        successful_negotiations INTEGER DEFAULT 0,
        money_saved DECIMAL(10, 2) DEFAULT 0.00,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create subscription plans table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS subscription_plans (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        features JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create user subscriptions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        plan_id INTEGER NOT NULL REFERENCES subscription_plans(id),
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        start_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        end_date TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create negotiation_chats table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS negotiation_chats (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        item_name VARCHAR(255) NOT NULL,
        initial_price DECIMAL(10, 2) NOT NULL,
        target_price DECIMAL(10, 2) NOT NULL,
        mode VARCHAR(10) NOT NULL,
        status VARCHAR(20) DEFAULT 'in_progress',
        final_price DECIMAL(10, 2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP
      )
    `);
    
    // Create messages table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        chat_id INTEGER REFERENCES negotiation_chats(id) ON DELETE CASCADE,
        sender VARCHAR(10) NOT NULL,
        message TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert default subscription plan if none exists
    const plansResult = await pool.query('SELECT * FROM subscription_plans LIMIT 1');
    if (plansResult.rows.length === 0) {
      await pool.query(`
        INSERT INTO subscription_plans (name, price, features) VALUES 
        ('Free', 0.00, '{"max_negotiations": 5, "advanced_suggestions": false, "templates": false}'),
        ('Pro', 24.99, '{"max_negotiations": 999999, "advanced_suggestions": true, "templates": true, "analytics": true}')
      `);
    }
    
    console.log('Database initialized');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

// Generate suggestions using DeepSeek Chat API
async function generateSuggestions(params) {
  try {
    const { mode, itemName, initialPrice, targetPrice, messages } = params;
    
    const lastMessage = messages[messages.length - 1];
    
    // Format the prompt for DeepSeek
    const prompt = `
      You are an expert negotiator helping a user ${mode === 'BUYING' ? 'buy' : 'sell'} a ${itemName}.
      
      Current details:
      - Item: ${itemName}
      - ${mode === 'BUYING' ? 'Current asking price' : 'Current offered price'}: $${initialPrice}
      - ${mode === 'BUYING' ? 'Target price (want to pay less)' : 'Target price (want to get more)'}: $${targetPrice}
      
      Recent conversation:
      ${messages.map(msg => `${msg.sender}: ${msg.text}`).join('\n')}
      
      Last message from other party: "${lastMessage.text}"
      
      Generate 3 possible responses that are polite but firm, using negotiation psychology to ${mode === 'BUYING' ? 'lower the price' : 'increase the price'}. Make them sound natural and persuasive.
    `;
    
    // In a real implementation, you would call the actual DeepSeek API here
    // For this example, we'll simulate it
    
    // Simulated API call (replace with actual DeepSeek API in production)
    const suggestions = generateSimulatedSuggestions(params);
    
    return { suggestions };
  } catch (error) {
    console.error('Error generating suggestions:', error);
    throw error;
  }
}

// Simulated suggestion generator (replace with actual API call in production)
function generateSimulatedSuggestions(params) {
  const { mode, itemName, initialPrice, targetPrice } = params;
  
  if (mode === 'BUYING') {
    return [
      `I've been researching similar ${itemName}s and noticed they typically sell for around $${(parseFloat(targetPrice) * 1.1).toFixed(2)}. Would you be willing to consider that price point given the current market conditions?`,
      
      `I'm really interested in this ${itemName} and would like to make it work. My budget is somewhat limited, though. Could we meet in the middle at $${((parseFloat(initialPrice) + parseFloat(targetPrice)) / 2).toFixed(2)}?`,
      
      `I appreciate the quality of this ${itemName}, but I've received other offers at $${(parseFloat(targetPrice) * 1.05).toFixed(2)}. If you can match that price, I'd be happy to finalize the purchase with you today.`
    ];
  } else {
    // SELLING mode
    return [
      `I understand you're looking for value, but I've invested significantly in this ${itemName}. The features and condition justify the $${(parseFloat(targetPrice) * 0.95).toFixed(2)} price point, which is still competitive for what you're getting.`,
      
      `I've had several inquiries about this ${itemName}, with offers close to my asking price. I could come down slightly to $${(parseFloat(targetPrice) * 0.98).toFixed(2)}, but that would be my best offer given the current demand.`,
      
      `The quality of this ${itemName} is exceptional compared to others on the market. While I understand your budget constraints, I believe $${((parseFloat(initialPrice) + parseFloat(targetPrice)) / 2).toFixed(2)} represents a fair compromise that acknowledges both the value and your needs.`
    ];
  }
}

// API Routes
app.post('/api/suggestions', async (req, res) => {
  try {
    const suggestions = await generateSuggestions(req.body);
    res.json(suggestions);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to generate suggestions' });
  }
});

app.post('/api/chats', auth, async (req, res) => {
  try {
    // Extract with default values to prevent NULL
    const userId = req.user.id;
    let { item_name, mode, initial_price, target_price } = req.body;
    
    console.log('DIRECT ROUTE: Creating chat with data:', req.body);
    
    // FORCE VALUES to avoid database errors
    item_name = item_name || 'Default Item';
    mode = mode || 'BUYING';
    initial_price = initial_price === undefined ? 0 : parseFloat(initial_price);
    target_price = target_price === undefined ? 0 : parseFloat(target_price);
    
    console.log('Using guaranteed values:', { item_name, mode, initial_price, target_price });
    
    // Insert data with guaranteed non-null values
    const result = await pool.query(
      `INSERT INTO negotiation_chats 
       (user_id, item_name, mode, initial_price, target_price, created_at, status) 
       VALUES ($1, $2, $3, $4, $5, NOW(), 'ongoing') 
       RETURNING *`,
      [userId, item_name, mode, initial_price, target_price]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating chat:', error);
    res.status(500).json({ error: `Failed to create chat: ${error.message}` });
  }
});

// Get user chats (with auth middleware protection)
app.get('/api/chats/:userId', auth, async (req, res) => {
  if (req.user.id !== parseInt(req.params.userId)) {
    return res.status(403).json({ error: 'Not authorized to access this data' });
  }
  
  try {
    const { userId } = req.params;
    
    // Get chats for user
    const chatsResult = await pool.query(
      'SELECT * FROM negotiation_chats WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    
    const chats = [];
    
    // Get messages for each chat
    for (const chat of chatsResult.rows) {
      const messagesResult = await pool.query(
        'SELECT * FROM messages WHERE chat_id = $1 ORDER BY timestamp ASC',
        [chat.id]
      );
      
      chats.push({
        ...chat,
        messages: messagesResult.rows
      });
    }
    
    res.json(chats);
  } catch (error) {
    console.error('Error getting chats:', error);
    res.status(500).json({ error: 'Failed to retrieve chat history' });
  }
});

// Get a specific chat by ID
app.get('/api/chats/:chatId', auth, async (req, res) => {
  try {
    const { chatId } = req.params;
    
    // Get chat
    const chatResult = await pool.query(
      'SELECT * FROM negotiation_chats WHERE id = $1',
      [chatId]
    );
    
    if (chatResult.rows.length === 0) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    
    const chat = chatResult.rows[0];
    
    // Check authorization - user can only access their own chats
    if (chat.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to access this data' });
    }
    
    // Get messages for the chat
    const messagesResult = await pool.query(
      'SELECT * FROM messages WHERE chat_id = $1 ORDER BY timestamp ASC',
      [chatId]
    );
    
    // Return complete chat with messages
    res.json({
      ...chat,
      messages: messagesResult.rows
    });
  } catch (error) {
    console.error('Error getting chat:', error);
    res.status(500).json({ error: 'Failed to retrieve chat' });
  }
});

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/chats', chatsRouter);

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client', 'build', 'index.html'));
  });
}

// Initialize database and start server - with better error handling
initDb().then(async () => {
  console.log('Database tables initialized');
  
  // Validate database schema
  const isValid = await validateDatabase();
  if (!isValid) {
    console.error('⚠️ Database validation failed - message saving might not work!');
  }
  
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Database connection: ${process.env.DATABASE_URL.replace(/:[^:]*@/, ':****@')}`);
    console.log('Server ready for requests');
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  
  // Start server anyway for debugging
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} (WARNING: Database initialization failed)`);
  });
}); 