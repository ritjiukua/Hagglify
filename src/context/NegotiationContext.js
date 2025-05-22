import React, { createContext, useContext, useReducer } from 'react';

const NegotiationContext = createContext();

const initialState = {
  formData: {
    itemName: '',
    initialPrice: '',
    targetPrice: '',
    mode: 'BUYING',
    notes: ''
  },
  currentStep: 1,
  loading: false,
  error: null
};

function negotiationReducer(state, action) {
  switch (action.type) {
    case 'SET_FORM_DATA':
      return {
        ...state,
        formData: { ...state.formData, ...action.payload }
      };
    case 'SET_STEP':
      return {
        ...state,
        currentStep: action.payload
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload
      };
    default:
      return state;
  }
}

export function NegotiationProvider({ children }) {
  const [state, dispatch] = useReducer(negotiationReducer, initialState);

  const value = {
    ...state,
    updateFormData: (data) => dispatch({ type: 'SET_FORM_DATA', payload: data }),
    setStep: (step) => dispatch({ type: 'SET_STEP', payload: step }),
    setLoading: (loading) => dispatch({ type: 'SET_LOADING', payload: loading }),
    setError: (error) => dispatch({ type: 'SET_ERROR', payload: error })
  };

  return (
    <NegotiationContext.Provider value={value}>
      {children}
    </NegotiationContext.Provider>
  );
}

export const useNegotiation = () => {
  const context = useContext(NegotiationContext);
  if (!context) {
    throw new Error('useNegotiation must be used within a NegotiationProvider');
  }
  return context;
}; 