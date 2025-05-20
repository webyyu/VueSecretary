<template>
  <div class="floating-button-container">
    <button 
      class="floating-button"
      @click="$emit('click')"
      :aria-label="label"
    >
      <font-awesome-icon :icon="icon" class="icon" />
    </button>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

defineProps({
  icon: {
    type: String,
    default: 'plus'
  },
  label: {
    type: String,
    default: 'Add new habit'
  }
});

defineEmits(['click']);
</script>

<style scoped>
.floating-button-container {
  position: fixed;
  bottom: 80px;
  right: 24px;
  z-index: 40;
}

.floating-button {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #34D399, #10B981);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.25, 1.25, 0.5, 1);
}

.floating-button:hover {
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.floating-button:active {
  transform: scale(0.95);
}

.icon {
  color: white;
  font-size: 20px;
}
</style> 