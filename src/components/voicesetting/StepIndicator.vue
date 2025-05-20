<template>
  <div class="step-indicator">
    <div 
      v-for="step in steps" 
      :key="step.id" 
      class="step-item"
      :class="{ 
        'step-active': step.id === currentStep,
        'step-completed': step.id < currentStep 
      }"
    >
      <div class="step-number">
        <span v-if="step.id < currentStep">
          <font-awesome-icon icon="check" />
        </span>
        <span v-else>{{ step.id }}</span>
      </div>
      <div class="step-name">{{ step.name }}</div>
      <div class="step-line" v-if="step.id < steps.length"></div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  currentStep: {
    type: Number,
    required: true
  },
  steps: {
    type: Array,
    required: true
  }
});
</script>

<style scoped>
.step-indicator {
  display: flex;
  justify-content: space-between;
  padding: 24px 20px 10px;
  position: relative;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 1;
  flex: 1;
}

.step-number {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background-color: #e0e0e0;
  color: #757575;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  margin-bottom: 8px;
  transition: all 0.3s;
}

.step-active .step-number {
  background-color: var(--app-primary, #0A84FF);
  color: white;
  transform: scale(1.1);
}

.step-completed .step-number {
  background-color: var(--app-success, #4CAF50);
  color: white;
}

.step-name {
  font-size: 12px;
  color: #757575;
  text-align: center;
  transition: all 0.3s;
}

.step-active .step-name {
  color: var(--app-primary, #0A84FF);
  font-weight: 600;
}

.step-completed .step-name {
  color: var(--app-success, #4CAF50);
}

.step-line {
  position: absolute;
  height: 2px;
  background-color: #e0e0e0;
  top: 14px;
  left: 60%;
  right: -40%;
  z-index: -1;
  transition: background-color 0.3s;
}

.step-completed .step-line {
  background-color: var(--app-success, #4CAF50);
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .step-number {
    background-color: #3A3A3C;
    color: #CCCCCC;
  }
  
  .step-name {
    color: #CCCCCC;
  }
  
  .step-line {
    background-color: #3A3A3C;
  }
}
</style> 