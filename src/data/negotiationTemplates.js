// Organized by mode (buying/selling) and message type/stage

const negotiationTemplates = {
  buying: {
    // Initial responses when the seller first states a price
    initialPriceResponse: [
      "Thanks for letting me know. Would you consider $COUNTER_PRICE? That's closer to what I was looking to spend.",
      "I appreciate the offer. My budget is around $COUNTER_PRICE. Would that work for you?",
      "Thank you for the quick response. I've seen similar items for $COUNTER_PRICE. Would you be open to that?",
      "I understand your asking price, but I was hoping to pay around $COUNTER_PRICE. Is there any flexibility?"
    ],
    
    // When seller counters with a price still higher than target
    counterOffer: [
      "I appreciate you working with me. How about we meet in the middle at $COUNTER_PRICE?",
      "Thanks for considering. $COUNTER_PRICE is really the most I can spend. Would that work?",
      "I understand you want to get good value. Would $COUNTER_PRICE be acceptable? That's my best offer.",
      "Thank you for negotiating. I can go up to $COUNTER_PRICE, which is my maximum budget for this."
    ],
    
    // When price is close to target
    closeToTarget: [
      "That's very close to what I was thinking. Could we make it an even $COUNTER_PRICE?",
      "We're almost there! Would you consider $COUNTER_PRICE to close the deal today?",
      "That's a fair offer. I can do $COUNTER_PRICE and I'm ready to proceed immediately.",
      "You've been very reasonable. I can do $COUNTER_PRICE and would be happy to finalize the transaction."
    ],
    
    // Accepting the seller's price
    accepting: [
      "That works for me. I'll take it for $PRICE.",
      "Deal! I'm happy to purchase at $PRICE.",
      "That's a fair price. I accept and am ready to move forward with the purchase at $PRICE.",
      "Agreed. I'll proceed with the purchase at $PRICE."
    ],
    
    // Other general responses
    general: [
      "Could you tell me more about the condition of the item?",
      "Is there any flexibility on the price?",
      "Does that price include shipping/delivery?",
      "How soon would the item be available?",
      "Are there any known issues I should be aware of?"
    ]
  },
  
  selling: {
    // Initial responses when buyer asks about price or makes an offer
    initialResponse: [
      "Thank you for your interest. I'm asking $PRICE for this item.",
      "Thanks for reaching out. My asking price is $PRICE.",
      "I appreciate your interest. I'm looking to get $PRICE for this.",
      "Hi there, I have it priced at $PRICE, which is fair given its condition and market value."
    ],
    
    // When buyer offers less than target
    counterOffer: [
      "Thank you for your offer. The lowest I could go is $COUNTER_PRICE.",
      "I appreciate your interest. While I can't go that low, I could do $COUNTER_PRICE.",
      "Thanks for the offer. I'm pretty firm on price, but I could come down to $COUNTER_PRICE.",
      "I understand you're looking for a good deal. The best I can do is $COUNTER_PRICE."
    ],
    
    // When buyer's offer is close to target
    closeToTarget: [
      "You're very close to my bottom line. I can do $COUNTER_PRICE if we can finalize soon.",
      "That's nearly what I'm looking for. Would you be able to do $COUNTER_PRICE?",
      "We're almost there. I can agree to $COUNTER_PRICE to complete the sale today.",
      "You've made a reasonable offer. I can accept $COUNTER_PRICE and we have a deal."
    ],
    
    // Accepting the buyer's offer
    accepting: [
      "That works for me. It's a deal at $PRICE.",
      "I can accept that offer. $PRICE it is.",
      "You've got a deal at $PRICE.",
      "I'm happy to accept $PRICE. Let's move forward."
    ],
    
    // Other general responses
    general: [
      "Are you able to pick up the item or do you need delivery?",
      "How soon are you looking to complete the purchase?",
      "Do you have any questions about the item's condition?",
      "Let me know if you need more photos or details.",
      "Are you interested in any other items I have for sale?"
    ]
  }
};

// Helper function to process templates by replacing placeholders
export const processTemplate = (template, initialPrice, targetPrice, counterPrice) => {
  return template
    .replace(/\$PRICE/g, initialPrice)
    .replace(/\$TARGET_PRICE/g, targetPrice)
    .replace(/\$COUNTER_PRICE/g, counterPrice || calculateCounterPrice(initialPrice, targetPrice));
};

// Helper to calculate a reasonable counter offer if none provided
const calculateCounterPrice = (initialPrice, targetPrice) => {
  // Default to halfway between initial and target if buying, or halfway from target to initial if selling
  const initial = parseFloat(initialPrice);
  const target = parseFloat(targetPrice);
  
  // If buying, target is lower than initial; if selling, target is higher than initial
  const isBuying = target < initial;
  
  if (isBuying) {
    // When buying, counter with price halfway between initial and target
    return ((initial + target) / 2).toFixed(2);
  } else {
    // When selling, counter with price halfway between target and initial
    return ((initial + target) / 2).toFixed(2);
  }
};

// Function to get suggestions based on other party's message and negotiation context
export const getSuggestions = (message, negotiationData) => {
  const { mode, initialPrice, targetPrice } = negotiationData;
  const isBuying = mode === 'BUYING';
  
  // Extract potential price mentions from the message
  const pricePattern = /\$?(\d+(?:\.\d{1,2})?)/g;
  let priceMatches = [];
  let match;
  
  while ((match = pricePattern.exec(message)) !== null) {
    priceMatches.push(parseFloat(match[1]));
  }
  
  // Determine the category of templates to use
  let category = 'general';
  let counterPrice = null;
  
  // Check message content for context clues
  const messageLower = message.toLowerCase();
  
  // Price analysis 
  if (priceMatches.length > 0) {
    // Use the last mentioned price
    const mentionedPrice = priceMatches[priceMatches.length - 1];
    const initial = parseFloat(initialPrice);
    const target = parseFloat(targetPrice);
    
    // Calculate how close the mentioned price is to our target
    const priceRange = Math.abs(initial - target);
    const distanceToTarget = Math.abs(mentionedPrice - target);
    const percentageOfRange = priceRange > 0 ? (distanceToTarget / priceRange) * 100 : 0;
    
    if (isBuying) {
      // BUYING MODE LOGIC
      if (mentionedPrice <= target) {
        // If price is at or below our target, accept!
        category = 'accepting';
        counterPrice = mentionedPrice;
      } else if (percentageOfRange <= 15) {
        // If we're within 15% of target, we're close
        category = 'closeToTarget';
        counterPrice = target;
      } else if (messageLower.includes('offer') || messageLower.includes('can do')) {
        // Responding to a specific offer
        category = 'counterOffer';
        // Aim for halfway between mentioned and target
        counterPrice = target + (mentionedPrice - target) * 0.5;
      } else if (messageLower.includes('listed') || messageLower.includes('asking')) {
        // Initial price discussion
        category = 'initialPriceResponse';
        // Start with a more aggressive counter (closer to target)
        counterPrice = target + (mentionedPrice - target) * 0.3;
      } else {
        // Default counter offer
        category = 'counterOffer';
        counterPrice = target + (mentionedPrice - target) * 0.6;
      }
    } else {
      // SELLING MODE LOGIC
      if (mentionedPrice >= target) {
        // If price meets or exceeds our target, accept!
        category = 'accepting';
        counterPrice = mentionedPrice;
      } else if (percentageOfRange <= 15) {
        // If we're within 15% of target, we're close
        category = 'closeToTarget';
        counterPrice = target;
      } else if (messageLower.includes('offer') || messageLower.includes('willing to pay')) {
        // Responding to a specific offer
        category = 'counterOffer';
        // Counter with a price halfway between their offer and our target
        counterPrice = target - (target - mentionedPrice) * 0.5;
      } else {
        // Default counter
        category = 'counterOffer';
        counterPrice = Math.max(initial, target - (target - mentionedPrice) * 0.3);
      }
    }
  } else {
    // No price mentioned - analyze message content for context
    if (messageLower.includes('condition') || messageLower.includes('details')) {
      category = 'general';
    } else if (messageLower.includes('negotiate') || messageLower.includes('flexibility')) {
      category = isBuying ? 'initialPriceResponse' : 'initialResponse';
      counterPrice = isBuying ? (parseFloat(target) + parseFloat(initialPrice)) / 2 : initialPrice;
    } else if (messageLower.includes('best price') || messageLower.includes('lowest')) {
      category = isBuying ? 'closeToTarget' : 'counterOffer';
      counterPrice = target;
    }
  }
  
  // Get the appropriate templates
  const templates = negotiationTemplates[isBuying ? 'buying' : 'selling'][category];
  
  // Process and return the templates
  return templates.map(template => 
    processTemplate(template, initialPrice, targetPrice, counterPrice ? counterPrice.toFixed(2) : null)
  );
};

export default negotiationTemplates; 