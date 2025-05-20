/**
 * API Debug Utilities
 */

// Track all API calls for debugging
export const apiCalls = [];

/**
 * Debug wrapper for API functions
 * @param {Function} apiFn - The API function to wrap
 * @param {string} fnName - The name of the function
 * @returns {Function} - Wrapped function with debugging
 */
export function debugApiCall(apiFn, fnName) {
  return async function(...args) {
    console.log(`API Call - ${fnName}:`, args);
    
    const callInfo = {
      function: fnName,
      args: args.map(arg => {
        // Mask passwords
        if (arg && arg.password) {
          return { ...arg, password: '***' };
        }
        return arg;
      }),
      timestamp: new Date(),
      status: 'pending'
    };
    
    apiCalls.push(callInfo);
    
    try {
      const result = await apiFn(...args);
      callInfo.status = 'success';
      callInfo.result = result;
      console.log(`API Result - ${fnName}:`, result);
      return result;
    } catch (error) {
      callInfo.status = 'error';
      callInfo.error = error;
      console.error(`API Error - ${fnName}:`, error);
      throw error;
    }
  };
}

/**
 * Print all API calls to console
 */
export function printApiCalls() {
  console.table(apiCalls.map(call => ({
    function: call.function,
    status: call.status,
    timestamp: call.timestamp
  })));
}

// Export a global debug function
window.debugApi = {
  calls: apiCalls,
  print: printApiCalls
}; 