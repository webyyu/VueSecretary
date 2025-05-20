<template>
  <div class="loading-spinner">
    <div class="spinner"></div>
  </div>
</template>

<script setup>
// Simple loading spinner component
</script>

<style scoped>
.loading-spinner {
  display: flex;
  justify-content: center;
  align-items: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: var(--primary-color);
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (prefers-color-scheme: dark) {
  .spinner {
    border-color: rgba(255, 255, 255, 0.1);
    border-top-color: var(--primary-color);
  }
}
</style> 