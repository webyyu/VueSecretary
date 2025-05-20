<template>
  <div class="message-container" :class="message.type">
    <div class="message-avatar">
      <div class="avatar-icon">
        <font-awesome-icon :icon="message.type === 'user' ? 'user' : 'robot'" />
      </div>
    </div>
    <div class="message-content">
      <!-- Display typing indicator for analyzing state -->
      <div v-if="message.isAnalyzing" class="typing-indicator">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <!-- Display message text if not analyzing -->
      <div v-else class="message-text">
        <p>{{ message.content }}</p>
      </div>
      
      <!-- Display ResultCards if the message has cards data -->
      <result-cards
        v-if="message.cards"
        :events="message.cards.events || []"
        :tasks="message.cards.tasks || []"
        :habits="message.cards.habits || []"
        @update:event="$emit('update:event', $event)"
        @update:task="$emit('update:task', $event)"
        @update:habit="$emit('update:habit', $event)"
      />
      
      <!-- Display suggestions if available -->
      <div v-if="message.suggestions && message.suggestions.length > 0" class="suggestions-container">
        <div class="suggestions-header">
          <font-awesome-icon icon="lightbulb" class="suggestions-icon" />
          <span>建议</span>
        </div>
        <ul class="suggestions-list">
          <li v-for="(suggestion, index) in message.suggestions" :key="index">
            {{ suggestion }}
          </li>
        </ul>
      </div>
      
      <div class="message-timestamp" v-if="message.timestamp">
        {{ formatTime(message.timestamp) }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';
import ResultCards from './ResultCards.vue';

const props = defineProps({
  message: {
    type: Object,
    required: true,
    validator: (value) => {
      return value.type && (value.content || value.isAnalyzing) && value.timestamp;
    }
  }
});

const emits = defineEmits(['update:event', 'update:task', 'update:habit']);

// Format timestamp to a readable time
const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  
  // For messages from today, only show time
  const today = new Date();
  const isToday = date.getDate() === today.getDate() &&
                  date.getMonth() === today.getMonth() &&
                  date.getFullYear() === today.getFullYear();
  
  // Format options
  const timeOptions = { hour: '2-digit', minute: '2-digit' };
  const dateTimeOptions = { 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit', 
    minute: '2-digit'
  };
  
  return date.toLocaleString('zh-CN', isToday ? timeOptions : dateTimeOptions);
};
</script>

<style scoped>
.message-container {
  display: flex;
  margin-bottom: 16px;
  animation: fade-in 0.3s ease-in-out;
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-container.user {
  flex-direction: row-reverse;
}

.message-avatar {
  margin: 0 12px;
  align-self: flex-start;
}

.avatar-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.message-container.user .avatar-icon {
  background-color: var(--app-secondary, #6c757d);
}

.message-container.ai .avatar-icon {
  background-color: var(--app-primary, #007bff);
}

.message-content {
  max-width: 80%;
  display: flex;
  flex-direction: column;
}

.message-text {
  padding: 12px 16px;
  border-radius: 18px;
  margin-bottom: 4px;
  position: relative;
}

.message-container.user .message-text {
  background-color: var(--app-primary, #007bff);
  color: white;
  border-top-right-radius: 4px;
  text-align: right;
}

.message-container.ai .message-text {
  background-color: white;
  color: var(--app-dark, #343a40);
  border-top-left-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.message-text p {
  margin: 0;
  line-height: 1.5;
  white-space: pre-wrap;
}

.message-timestamp {
  font-size: 12px;
  color: var(--app-gray, #6c757d);
  margin-top: 4px;
  opacity: 0.8;
}

.message-container.user .message-timestamp {
  text-align: right;
}

/* Typing indicator */
.typing-indicator {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background-color: white;
  border-radius: 18px 18px 18px 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--app-gray, #6c757d);
  margin: 0 2px;
  animation: bounce 1s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes bounce {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-5px);
  }
}

/* Suggestions styling */
.suggestions-container {
  background-color: rgba(0, 123, 255, 0.05);
  border-radius: 12px;
  padding: 12px;
  margin-top: 8px;
  border: 1px solid rgba(0, 123, 255, 0.1);
}

.suggestions-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--app-primary, #007bff);
}

.suggestions-icon {
  margin-right: 8px;
  color: #ffc107;
}

.suggestions-list {
  margin: 0;
  padding-left: 24px;
}

.suggestions-list li {
  margin-bottom: 6px;
  line-height: 1.4;
}

.suggestions-list li:last-child {
  margin-bottom: 0;
}
</style> 