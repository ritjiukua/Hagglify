export const validateStep = (step, formData) => {
  switch (step) {
    case 1:
      return !!formData.mode;
    case 2:
      return !!formData.itemName && formData.itemName.trim().length > 0;
    case 3:
      return !!formData.initialPrice && formData.initialPrice > 0;
    case 4:
      return !!formData.targetPrice && formData.targetPrice > 0 && 
        (formData.mode === 'BUYING' ? 
          formData.targetPrice < formData.initialPrice :
          formData.targetPrice > formData.initialPrice);
    default:
      return false;
  }
};

export const validateNegotiation = (formData) => {
  const errors = [];

  if (!formData.itemName || !formData.initialPrice || !formData.targetPrice) {
    errors.push('Please complete all required fields');
  }

  const initialPrice = parseFloat(formData.initialPrice);
  const targetPrice = parseFloat(formData.targetPrice);

  if (isNaN(initialPrice) || isNaN(targetPrice)) {
    errors.push('Prices must be valid numbers');
  }

  if (!formData.mode || (formData.mode !== 'BUYING' && formData.mode !== 'SELLING')) {
    errors.push('Invalid negotiation mode');
  }

  if (formData.mode === 'BUYING' && targetPrice > initialPrice) {
    errors.push('Target price must be lower than initial price when buying');
  }

  if (formData.mode === 'SELLING' && targetPrice < initialPrice) {
    errors.push('Target price must be higher than initial price when selling');
  }

  return errors;
}; 