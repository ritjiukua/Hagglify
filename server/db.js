const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test the connection more thoroughly
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err.stack);
    console.error('Connection parameters:', {
      connectionString: process.env.DATABASE_URL.replace(/:[^:]*@/, ':****@'), // Hide password in logs
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
  } else {
    console.log('Database connected successfully at:', res.rows[0].now);
    
    // Check if tables exist
    pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'messages'
      )
    `, (tableErr, tableRes) => {
      if (tableErr) {
        console.error('Error checking tables:', tableErr);
      } else {
        if (tableRes.rows[0].exists) {
          console.log('Messages table exists in database');
        } else {
          console.error('WARNING: Messages table does not exist in database!');
        }
      }
    });
  }
});

// Add better error handling for unexpected pool errors
pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
  
  // Try to recover connection
  console.log('Attempting to reconnect to database...');
});

// Add this function to verify and validate database tables
const validateDatabase = async () => {
  const client = await pool.connect();
  try {
    console.log('Validating database schema...');
    
    // Check if messages table exists and has the right structure
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'messages'
      )
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.error('CRITICAL ERROR: messages table does not exist!');
      
      // Create messages table if missing
      console.log('Creating messages table...');
      await client.query(`
        CREATE TABLE messages (
          id SERIAL PRIMARY KEY,
          chat_id INTEGER REFERENCES negotiation_chats(id) ON DELETE CASCADE,
          sender VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('Messages table created successfully');
    } else {
      // Check columns in messages table
      const columnCheck = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'messages'
      `);
      
      const columns = columnCheck.rows.map(col => col.column_name);
      console.log('Messages table columns:', columns.join(', '));
      
      // Test direct insert to messages table
      try {
        // First get a valid chat id
        const chatCheck = await client.query(
          'SELECT id FROM negotiation_chats LIMIT 1'
        );
        
        if (chatCheck.rows.length > 0) {
          const testInsert = await client.query(
            `INSERT INTO messages (chat_id, sender, message, timestamp)
             VALUES ($1, $2, $3, NOW())
             RETURNING id`,
            [chatCheck.rows[0].id, 'system', 'Schema validation test message']
          );
          
          console.log('Test message inserted with ID:', testInsert.rows[0].id);
          
          // Clean up test message
          await client.query(
            'DELETE FROM messages WHERE id = $1',
            [testInsert.rows[0].id]
          );
          
          console.log('Database schema validation successful!');
          return true;
        }
      } catch (error) {
        console.error('Failed test insert to messages table:', error);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Database validation error:', error);
    return false;
  } finally {
    client.release();
  }
};

// Export the validateDatabase function
module.exports = { 
  pool,
  validateDatabase 
};