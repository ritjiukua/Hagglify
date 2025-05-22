const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { pool } = require('../db');
const auth = require('../middleware/auth');

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, fullName } = req.body;
    
    // Check if user already exists
    const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Insert user into database
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, full_name, created_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP) RETURNING id, email, full_name, created_at',
      [email, hashedPassword, fullName]
    );
    
    // Create default user settings
    await pool.query(
      'INSERT INTO user_settings (user_id, theme, share_statistics, email_notifications, allow_data_analytics, public_profile) VALUES ($1, $2, $3, $4, $5, $6)',
      [result.rows[0].id, 'light', true, true, true, false]
    );
    
    // Create initial user analytics record
    await pool.query(
      'INSERT INTO user_analytics (user_id) VALUES ($1)',
      [result.rows[0].id]
    );
    
    // Create JWT
    const payload = {
      user: {
        id: result.rows[0].id
      }
    };
    
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.status(201).json({ 
          token,
          user: {
            id: result.rows[0].id,
            email: result.rows[0].email,
            fullName: result.rows[0].full_name,
            createdAt: result.rows[0].created_at
          }
        });
      }
    );
  } catch (error) {
    console.error('Error in register:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check if user exists
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    const user = userResult.rows[0];
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    // Update last login
    await pool.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);
    
    // Create JWT
    const payload = {
      user: {
        id: user.id
      }
    };
    
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({ 
          token,
          user: {
            id: user.id,
            email: user.email,
            fullName: user.full_name,
            createdAt: user.created_at
          }
        });
      }
    );
  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const userResult = await pool.query(
      'SELECT id, email, full_name, created_at, last_login FROM users WHERE id = $1',
      [req.user.id]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get user settings
    const settingsResult = await pool.query(
      'SELECT * FROM user_settings WHERE user_id = $1',
      [req.user.id]
    );
    
    // Get subscription info
    const subscriptionResult = await pool.query(
      `SELECT us.*, sp.name as plan_name, sp.price, sp.features
       FROM user_subscriptions us
       JOIN subscription_plans sp ON us.plan_id = sp.id
       WHERE us.user_id = $1 AND us.status = 'active'
       ORDER BY us.end_date DESC
       LIMIT 1`,
      [req.user.id]
    );
    
    res.json({
      user: userResult.rows[0],
      settings: settingsResult.rows[0] || {},
      subscription: subscriptionResult.rows[0] || { plan_name: 'Free' }
    });
  } catch (error) {
    console.error('Error in get user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { fullName, bio } = req.body;
    
    // Update user
    const result = await pool.query(
      'UPDATE users SET full_name = $1, bio = $2 WHERE id = $3 RETURNING id, email, full_name, bio, created_at',
      [fullName, bio || null, req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ 
      message: 'Profile updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user settings
router.put('/settings', auth, async (req, res) => {
  try {
    const { theme, shareStatistics, emailNotifications, allowDataAnalytics, publicProfile } = req.body;
    
    // Update settings
    const result = await pool.query(
      `UPDATE user_settings 
       SET theme = $1, 
           share_statistics = $2, 
           email_notifications = $3, 
           allow_data_analytics = $4, 
           public_profile = $5,
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $6
       RETURNING *`,
      [theme, shareStatistics, emailNotifications, allowDataAnalytics, publicProfile, req.user.id]
    );
    
    if (result.rows.length === 0) {
      // Create settings if they don't exist
      const newSettings = await pool.query(
        `INSERT INTO user_settings
         (user_id, theme, share_statistics, email_notifications, allow_data_analytics, public_profile)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [req.user.id, theme, shareStatistics, emailNotifications, allowDataAnalytics, publicProfile]
      );
      
      return res.json({ 
        message: 'Settings created successfully',
        settings: newSettings.rows[0]
      });
    }
    
    res.json({ 
      message: 'Settings updated successfully',
      settings: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Request password reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Check if user exists
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      // Don't reveal that the email doesn't exist for security
      return res.status(200).json({ message: 'If your email exists in our system, you will receive a password reset link shortly' });
    }
    
    const user = userResult.rows[0];
    
    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour
    
    // Save reset token to database
    await pool.query(
      'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
      [resetToken, resetExpires, user.id]
    );
    
    // Send email with reset link (implementation depends on your email service)
    // For now, just log the token - you would replace this with your email sending code
    console.log(`Reset password link: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`);
    
    res.status(200).json({ message: 'If your email exists in our system, you will receive a password reset link shortly' });
  } catch (error) {
    console.error('Error in forgot password:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reset password with token
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    
    // Find user with valid token
    const userResult = await pool.query(
      'SELECT * FROM users WHERE reset_token = $1 AND reset_token_expires > CURRENT_TIMESTAMP',
      [token]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }
    
    const user = userResult.rows[0];
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Update password and clear reset token
    await pool.query(
      'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
      [hashedPassword, user.id]
    );
    
    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Error in reset password:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Change password (authenticated)
router.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Get user
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update password
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [hashedPassword, req.user.id]
    );
    
    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error in change password:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 