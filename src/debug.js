// Debug script to intercept fetch requests
const originalFetch = window.fetch;

window.fetch = function(url, options) {
  console.log('Fetch request made to:', url);
  console.log('Fetch options:', options);
  
  return originalFetch.apply(this, arguments)
    .then(response => {
      console.log('Fetch response:', response);
      return response;
    })
    .catch(error => {
      console.error('Fetch error:', error);
      throw error;
    });
};

console.log('Debug script loaded and fetch intercepted'); 