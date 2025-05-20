<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="modelValue" class="modal-overlay" @click="closeOnClickOutside && $emit('update:modelValue', false)">
        <Transition name="slide-up">
          <div v-if="modelValue" class="modal-container" @click.stop>
            <div class="modal-header">
              <div class="modal-title">{{ title }}</div>
              <button class="close-button" @click="$emit('update:modelValue', false)">
                <font-awesome-icon icon="times" />
              </button>
            </div>
            <div class="modal-content">
              <slot></slot>
            </div>
            <div v-if="$slots.footer" class="modal-footer">
              <slot name="footer"></slot>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  closeOnClickOutside: {
    type: Boolean,
    default: true
  }
});

defineEmits(['update:modelValue']);
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: flex-end;
  z-index: 100;
  backdrop-filter: blur(5px);
}

.modal-container {
  background-color: white;
  border-radius: 16px 16px 0 0;
  width: 100%;
  max-width: 430px;
  max-height: 85vh;
  overflow-y: auto;
  padding: 20px;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
}

.close-button {
  color: var(--app-gray);
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s ease;
}

.close-button:hover {
  background-color: var(--app-light);
}

.modal-content {
  margin-bottom: 20px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

@media (min-width: 768px) {
  .modal-overlay {
    align-items: center;
  }
  
  .modal-container {
    border-radius: 16px;
    max-width: 500px;
    max-height: 80vh;
  }
}

/* Dark mode styles */
@media (prefers-color-scheme: dark) {
  .modal-container {
    background-color: #2C2C2E;
    color: white;
  }
  
  .close-button:hover {
    background-color: #3A3A3C;
  }
}
</style> 