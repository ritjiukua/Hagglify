import axios from 'axios';


const API_KEY = process.env.REACT_APP_GPT_API_KEY;

// Base configuration for API calls
const gptApi = axios.create({
  baseURL: 'https://api.openai.com/v1',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`
 
export const generateNegotiationResponse = async (messages, negotiationData) => {
  try {
    console.log('Generating AI response with data:', { negotiationData });
    
    // Extract relevant information from negotiation data
    const { 
      mode, // 'BUYING' or 'SELLING'
      itemName,
      initialPrice,
      targetPrice,
      itemDescription = ''
    } = negotiationData;
    
  
    let aiPreviousPrices = [];
    let lastMentionedPrice = null;

 
    messages.forEach(msg => {
      if (msg.sender === 'assistant' || msg.role === 'assistant') {
        const text = msg.text || msg.content;
        // Match prices like $100, $99.95, etc.
        const priceMatches = text.match(/\$(\d+(?:\.\d+)?)/g);
        if (priceMatches) {
          priceMatches.forEach(match => {
            const price = parseFloat(match.replace('$', ''));
            if (!isNaN(price)) {
              aiPreviousPrices.push(price);
              lastMentionedPrice = price; // Store the most recent price
            }
          });
        }
      }
    });
    
    // Determine price bounds based on previous messages
    let priceBound = '';
    if (lastMentionedPrice !== null) {
      if (mode === 'BUYING') {
        // When buying, AI is seller, so they shouldn't go lower than their last offer
        priceBound = `You previously offered the item at $${lastMentionedPrice.toFixed(2)}. To maintain credibility, DO NOT offer a lower price than this unless the user makes a compelling case. Your price should only decrease if the user negotiates effectively.`;
      } else {
        // When selling, AI is buyer, so they shouldn't go higher than their last offer
        priceBound = `You previously offered to pay $${lastMentionedPrice.toFixed(2)}. To maintain credibility, DO NOT offer a higher price than this unless you're closing the deal. Your price should only increase if absolutely necessary to close the sale.`;
      }
    }
    

    const messageHistory = messages.slice(-5).map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text || msg.content
    }));
    
    // Calculate current negotiation phase based on message count
    const messageCount = messages.filter(m => !m.isSystem).length;
    const negotiationPhase = messageCount < 3 ? 'early' : messageCount < 6 ? 'middle' : 'late';
    
    // Construct the system prompt with negotiation context
    const systemMessage = {
      role: 'system',
      content: `You are an expert negotiation assistant helping someone ${mode?.toLowerCase() || 'buying'} ${itemName}. 
      
Current price: $${initialPrice}
Target price: $${targetPrice}
Current negotiation phase: ${negotiationPhase}
Item description: ${itemDescription || itemName}

${priceBound}

${mode === 'BUYING' ? 
  `The user is trying to buy this item at a lower price. Help them negotiate effectively to get the price as close as possible to $${targetPrice} or lower.` : 
  `The user is trying to sell this item at a higher price. As a strategic seller:
  - DON'T reveal your minimum acceptable price of $${targetPrice} under any circumstances
  - Present the item as valuable and worth more than the buyer is offering
  - Make very small, incremental concessions from your initial price
  - Try to keep the final price as far above your minimum acceptable price as possible
  - When the buyer makes an offer, if it's below your target, counter significantly higher
  - Only approach your minimum price after extensive haggling (8+ messages)
  - Justify your price based on value, scarcity, quality, or market conditions
  - Create urgency by mentioning other interested buyers if appropriate
  - If the buyer seems hesitant, offer small add-ons rather than big price cuts`}

IMPORTANT: Be consistent with any prices you mention. Never contradict yourself by offering a worse price than you previously stated. ${mode === 'BUYING' ? 'Your price should only decrease as the negotiation progresses.' : 'Your offered price should only increase as the negotiation progresses.'}

${mode === 'SELLING' && negotiationPhase === 'early' ? 
  'In this early phase, focus on building interest and establishing value. Avoid any price concessions yet. Emphasize quality and benefits.' : 
  mode === 'SELLING' && negotiationPhase === 'middle' ? 
  'In this middle phase, make very modest concessions but maintain a position well above your minimum price. Show flexibility but protect your margin.' :
  mode === 'SELLING' && negotiationPhase === 'late' ?
  'In this late phase, work toward closing but still aim to stay as far above your minimum price as possible. Only approach your minimum if necessary to close the deal.' :
  ''}

${mode === 'SELLING' ? 'Provide persuasive, realistic responses that emphasize value and create buying urgency.' : 'Provide persuasive, realistic responses to help get the best possible deal.'}
Keep responses concise (2-3 sentences) and natural-sounding. Don't be robotic or overly formal.`
    };
    
    // Combine system message with chat history
    const apiMessages = [systemMessage, ...messageHistory];
    
    console.log('Sending messages to OpenAI API:', apiMessages);
    
    // Call the OpenAI API with gpt-4o-mini model
    const response = await gptApi.post('/chat/completions', {
      model: 'gpt-4o-mini',
      messages: apiMessages,
      temperature: 0.7,
      max_tokens: 150,
    });
    
    console.log('Received response from OpenAI:', response.data);
    
    // Return the generated text
    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error generating AI response:', error);
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    // Calculate a counter-offer as fallback
    const counterOffer = calculateCounterOffer(
      negotiationData.initialPrice,
      negotiationData.targetPrice,
      negotiationData.mode,
      messages.length // Pass message count to adjust counter offer aggression
    );
    
    // Return a basic fallback message
    return negotiationData.mode === 'BUYING'
      ? `I'm interested in the ${negotiationData.itemName}, but my budget is $${counterOffer}. Would that work for you?`
      : `Thanks for your interest. Given the condition of the ${negotiationData.itemName}, I was hoping for closer to $${counterOffer}. Could you meet me there?`;
  }
};

/**
 * Generate negotiation suggestions based on the latest message
 * @param {string} latestMessage - The most recent message from other party
 * @param {Object} negotiationData - Contains information about the negotiation
 * @returns {Promise<Array<string>>} - Array of suggested responses
 */
export const generateSuggestions = async (latestMessage, negotiationData) => {
  try {
    console.log('Generating AI suggestions with data:', { latestMessage, negotiationData });
    
    if (!latestMessage || !negotiationData) {
      console.error('Missing parameters for generateSuggestions');
      return Promise.resolve(getDefaultSuggestions(negotiationData));
    }
    
    // Extract relevant information from negotiation data
    const { 
      mode = 'BUYING', // Default to BUYING if not specified
      itemName = 'item',
      initialPrice = 0,
      targetPrice = 0
    } = negotiationData;

    // Create a system message with detailed instructions
    const systemPrompt = {
      role: 'system',
      content: `You are an expert negotiation assistant. Generate 3 different persuasive responses to the message below.
The user is ${mode.toLowerCase()} an item (${itemName}) with:
- Current price: $${initialPrice}
- Target price: $${targetPrice} (${mode === 'BUYING' ? 'lower' : 'higher'} is better)

Generate 3 distinct negotiation responses:
1. A friendly, relationship-building response
2. A value-focused response
3. A more assertive, direct response

Each response should be designed to move the price closer to the target. 
Format your output with exactly 3 numbered responses, each on its own line.
Responses should be complete messages ready to send, about 1-2 sentences each.`
    };

    const userPrompt = {
      role: 'user',
      content: `Their message: "${latestMessage}"`
    };

    // Call the OpenAI API with gpt-4o-mini model
    const response = await gptApi.post('/chat/completions', {
      model: 'gpt-4o-mini', // Updated to gpt-4o-mini
      messages: [systemPrompt, userPrompt],
      temperature: 0.7,
      max_tokens: 250
    });
    
    const content = response.data.choices[0].message.content.trim();
    console.log('API returned suggestion content:', content);
    
    // Parse the response - split by numbered items
    let suggestions = [];
    
    // Try to extract numbered suggestions (1., 2., 3.)
    const regex = /\d+\.\s+(.*?)(?=\d+\.|$)/gs;
    const matches = [...content.matchAll(regex)];
    
    if (matches && matches.length > 0) {
      suggestions = matches.map(match => match[1].trim());
    } else {
      // Split by new lines as fallback
      suggestions = content.split('\n').filter(line => line.trim().length > 0);
    }
    
    console.log('Extracted suggestions:', suggestions);
    
    // Return maximum 3 suggestions
    return suggestions.slice(0, 3);
    
  } catch (error) {
    console.error('Error generating suggestions:', error);
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    
    // Always return a Promise with default suggestions
    return Promise.resolve(getDefaultSuggestions(negotiationData));
  }
};

// Helper function for default suggestions
const getDefaultSuggestions = (negotiationData = {}) => {
  const { mode = 'BUYING', itemName = 'item', initialPrice = 0, targetPrice = 0 } = negotiationData;
  
  // Calculate a suggested counter-offer for fallback suggestions
  const counterOffer = calculateCounterOffer(
    initialPrice, 
    targetPrice, 
    mode
  ).toFixed(2);
  
  // Return fallback suggestions with the calculated counter-offer
  if (mode === 'BUYING') {
    return [
      `I'm interested in this ${itemName}, but my budget is $${counterOffer}. Would you consider this offer?`,
      `The ${itemName} looks good, but I've seen similar ones for less. Could we agree on $${counterOffer}?`,
      `I'd like to buy this, but I can only go up to $${counterOffer}. Does that work for you?`
    ];
  } else {
    return [
      `Thanks for your interest. Given the condition of the ${itemName}, I was hoping for closer to $${counterOffer}.`,
      `I appreciate your offer, but I've had other potential buyers willing to pay more. Would $${counterOffer} work for you?`,
      `I need to get at least $${counterOffer} for this ${itemName} to make it worth selling.`
    ];
  }
};

/**
 * Calculates a suggested counter-offer price for selling only
 * This doesn't change the buying logic, just enhances the selling calculation
 */
export const calculateCounterOffer = (initialPrice, targetPrice, mode, messageCount = 0) => {
  // Convert to numbers to be safe
  initialPrice = parseFloat(initialPrice) || 0;
  targetPrice = parseFloat(targetPrice) || 0;
  
  // If buying, use existing logic (don't change)
  if (mode === 'BUYING') {
    // Move concessionRate% of the way toward the target
    const concessionRate = messageCount < 3 ? 0.4 : // Early phase
                          messageCount < 6 ? 0.5 : // Middle phase
                          0.6; // Late phase
                          
    const difference = initialPrice - targetPrice;
    return Math.round((initialPrice - (difference * concessionRate)) * 100) / 100;
  } 
  // If selling, use enhanced logic that protects minimum price
  else {
    // Strategic concession rates for selling - very small concessions early on
    const concessionRate = messageCount < 3 ? 0.15 : // Early phase - tiny concessions
                          messageCount < 6 ? 0.25 : // Middle phase - small concessions
                          messageCount < 9 ? 0.35 : // Late phase - modest concessions 
                          0.5; // Very late phase - more willing to approach target
    
    // If first or second counter-offer in selling mode, stay high above target
    if (messageCount <= 2) {
      // Target price plus a premium to anchor high
      const premium = Math.abs(targetPrice - initialPrice) * 0.3;
      return Math.round((targetPrice + premium) * 100) / 100;
    }
    
    // Calculate the range between current price and target
    const currentPrice = messageCount > 0 ? initialPrice * (1 - (0.05 * Math.min(messageCount, 8))) : initialPrice;
    const difference = targetPrice - currentPrice;
    
    // Move concessionRate% of the way toward the target
    const counterOffer = Math.round((currentPrice + (difference * concessionRate)) * 100) / 100;
    
    // Calculate a minimum threshold that decreases very slowly with message count
    // For first 8 messages, stay at least 10-20% above target price
    const thresholdPercentage = Math.max(1.2 - (messageCount * 0.025), 1.02);
    const minimumThreshold = targetPrice * thresholdPercentage;
    
    // Ensure we don't go below our calculated threshold unless very late in negotiation
    if (counterOffer < minimumThreshold && messageCount < 10) {
      return Math.round(minimumThreshold * 100) / 100;
    }
    
    return counterOffer;
  }
};

/**
 * Generate a welcome message for a new negotiation
 * @param {Object} negotiationData - Contains information about the negotiation
 * @returns {Promise<string>} - AI generated welcome message
 */
export const generateWelcomeMessage = async (negotiationData) => {
  try {
    console.log('Generating welcome message with data:', negotiationData);
    
    // Extract relevant information
    const { 
      mode = 'BUYING',
      itemName = 'item',
      initialPrice = 0,
      targetPrice = 0,
      itemDescription = ''
    } = negotiationData;
    
    // Create system message with instructions
    const systemPrompt = {
      role: 'system',
      content: `You are an AI negotiation assistant playing the role of ${mode === 'BUYING' ? 'a seller' : 'a buyer'} 
      in a negotiation about a ${itemName}. Generate a welcoming first message to start the negotiation.
      
      ${mode === 'BUYING' 
        ? `The user is trying to buy the ${itemName} at a target price of $${targetPrice}, lower than the initial price of $${initialPrice}.` 
        : `The user is trying to sell the ${itemName} at a target price of $${targetPrice}, higher than the initial price of $${initialPrice}.`}
      
      Item description: ${itemDescription || itemName}
      
      Generate a welcoming, brief (1-2 sentences) introduction to start the negotiation. 
      Be conversational and natural in your response.`
    };
    
    // Call the OpenAI API with gpt-4o-mini model
    const response = await gptApi.post('/chat/completions', {
      model: 'gpt-4o-mini', // Updated to gpt-4o-mini
      messages: [systemPrompt],
      temperature: 0.7,
      max_tokens: 150
    });
    
    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error generating welcome message:', error);
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    
    // Fallback welcome message
    return negotiationData.mode === 'BUYING'
      ? `Hello there! I'm selling this ${negotiationData.itemName} for $${negotiationData.initialPrice}. What's your offer?`
      : `Hi! I'm interested in your ${negotiationData.itemName}. You're asking $${negotiationData.initialPrice}, right?`;
  }
};

export default {
  generateNegotiationResponse,
  generateSuggestions,
  generateWelcomeMessage,
  calculateCounterOffer
}; 
