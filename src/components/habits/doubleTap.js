/**
 * Double tap directive for Vue 3
 * Usage: v-double-tap="myFunction"
 */

export const vDoubleTap = {
  mounted(el, binding) {
    // Configuration
    const delay = 300; // Max delay between taps in ms
    
    let lastTap = 0;
    let timeout = null;
    
    // Handle touch events
    const onTap = (event) => {
      // Get current time
      const currentTime = new Date().getTime();
      const tapLength = currentTime - lastTap;
      
      // Clear any pending single taps
      clearTimeout(timeout);
      
      // If tap interval is within the allowed range, execute the handler
      if (tapLength < delay && tapLength > 0) {
        // Execute the function passed to the directive
        binding.value(event);
      } else {
        // Set a timeout for single tap detection
        timeout = setTimeout(() => {
          // Do nothing on single tap
          clearTimeout(timeout);
        }, delay);
      }
      
      // Update last tap time
      lastTap = currentTime;
    };
    
    // Add event listener
    el.addEventListener('touchend', onTap);
    el.addEventListener('mouseup', onTap);
    
    // Store event removal function
    el._doubleTapRemove = () => {
      el.removeEventListener('touchend', onTap);
      el.removeEventListener('mouseup', onTap);
    };
  },
  
  // Clean up event listeners when element is unmounted
  unmounted(el) {
    if (el._doubleTapRemove) {
      el._doubleTapRemove();
    }
  }
}; 