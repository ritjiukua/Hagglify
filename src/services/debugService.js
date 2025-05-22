// Debug and error reporting service
const DEBUG_MODE = true; // Set to false in production

// Store logs in memory (for debugging session)
let debugLogs = [];
let errorLogs = [];

// Log types
export const LOG_TYPES = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  FIREBASE: 'firebase',
  API: 'api',
  AUTH: 'auth',
  COMPONENT: 'component'
};

// Log a message to the debug console
export const logDebug = (message, type = LOG_TYPES.INFO, data = null) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    message,
    type,
    data,
  };
  
  debugLogs.push(logEntry);
  
  // If in debug mode, also log to console with appropriate styling
  if (DEBUG_MODE) {
    const styles = {
      [LOG_TYPES.INFO]: 'color: #4361ee',
      [LOG_TYPES.WARNING]: 'color: #f59e0b; font-weight: bold',
      [LOG_TYPES.ERROR]: 'color: #ef4444; font-weight: bold',
      [LOG_TYPES.FIREBASE]: 'color: #10b981',
      [LOG_TYPES.API]: 'color: #8b5cf6',
      [LOG_TYPES.AUTH]: 'color: #3b82f6',
      [LOG_TYPES.COMPONENT]: 'color: #ec4899',
    };
    
    console.log(`%c[${type.toUpperCase()}] ${message}`, styles[type] || '');
    if (data) {
      console.log(data);
    }
  }
  
  // Trim logs if they get too long
  if (debugLogs.length > 1000) {
    debugLogs = debugLogs.slice(-500);
  }
  
  return logEntry;
};

// Log an error
export const logError = (error, context = '', data = null) => {
  let errorMessage = error;
  let errorStack = null;
  let errorCode = null;
  
  // Format error based on type
  if (error instanceof Error) {
    errorMessage = error.message;
    errorStack = error.stack;
  }
  
  // Handle Firebase errors
  if (error && error.code) {
    errorCode = error.code;
  }
  
  const errorEntry = {
    timestamp: new Date().toISOString(),
    message: errorMessage,
    context,
    stack: errorStack,
    code: errorCode,
    data
  };
  
  errorLogs.push(errorEntry);
  
  // Log to debug system
  logDebug(
    `Error in ${context}: ${errorMessage}`, 
    LOG_TYPES.ERROR, 
    { error, data }
  );
  
  // Trim logs if they get too long
  if (errorLogs.length > 100) {
    errorLogs = errorLogs.slice(-50);
  }
  
  return errorEntry;
};

// Log Firebase operation
export const logFirebaseOperation = (operation, collection, docId, data = null, result = null) => {
  return logDebug(
    `Firebase ${operation}: ${collection}/${docId || ''}`,
    LOG_TYPES.FIREBASE,
    { operation, collection, docId, data, result }
  );
};

// Get all debug logs
export const getDebugLogs = () => {
  return [...debugLogs];
};

// Get all error logs
export const getErrorLogs = () => {
  return [...errorLogs];
};

// Clear logs
export const clearLogs = () => {
  debugLogs = [];
  errorLogs = [];
};

export default {
  logDebug,
  logError,
  logFirebaseOperation,
  getDebugLogs,
  getErrorLogs,
  clearLogs,
  LOG_TYPES
}; 