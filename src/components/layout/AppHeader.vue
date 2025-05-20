<template>
  <div class="header-container">
    <!-- Status Bar -->
    <div class="status-bar">
      <div>{{ currentTime }}</div>
      <div class="status-icons">
        <font-awesome-icon icon="signal" />
        <font-awesome-icon icon="wifi" />
        <font-awesome-icon icon="battery-full" />
      </div>
    </div>
    
    <!-- iOS style header -->
    <div class="ios-header">
      <div class="ios-header-title">{{ title }}</div>
      <div v-if="rightAction" @click="$emit('right-action')" class="ios-header-action ios-header-right">
        <font-awesome-icon :icon="rightActionIcon" />
      </div>
      <div v-if="leftAction" @click="$emit('left-action')" class="ios-header-action ios-header-left" :class="getTooltipClass(leftActionIcon)">
        <font-awesome-icon :icon="leftActionIcon" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  rightAction: {
    type: Boolean,
    default: false
  },
  rightActionIcon: {
    type: String,
    default: 'plus'
  },
  leftAction: {
    type: Boolean,
    default: false
  },
  leftActionIcon: {
    type: String,
    default: 'chevron-left'
  }
});

defineEmits(['right-action', 'left-action']);

const currentTime = ref(getCurrentTime());

function getCurrentTime() {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

// Helper function to set tooltip classes based on icon
const getTooltipClass = (icon) => {
  if (icon === 'cog') return 'settings-tooltip';
  return '';
};

let timeInterval;

onMounted(() => {
  timeInterval = setInterval(() => {
    currentTime.value = getCurrentTime();
  }, 60000); // Update every minute
});

onUnmounted(() => {
  clearInterval(timeInterval);
});
</script>

<style scoped>
.header-container {
  position: sticky;
  top: 0;
  z-index: 50;
  width: 100%;
}

/* Status Bar */
.status-bar {
  height: 44px;
  background-color: var(--app-light, #F2F2F7);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  font-size: 14px;
  font-weight: 600;
}

.status-icons {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* iOS style header */
.ios-header {
  height: 44px;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  font-weight: 600;
  font-size: 17px;
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.ios-header-action {
  position: absolute;
  font-size: 17px;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.ios-header-action:active {
  transform: scale(0.9);
}

.ios-header-left {

  position: inherit;
  left: 0px;
  font-size: 24px;
  color: #3483FA;
  opacity: 0.8;
  transition: opacity 0.2s ease;
}

.ios-header-left:hover {
  opacity: 1;
}

.ios-header-action.ios-header-left.settings-tooltip {
  left: 5%;
  position: absolute; /* 如果父容器需要定位，确保父级有position:relative */
}


.ios-header-right {
  right: 16px;
  color: var(--app-primary, #007AFF);
}

/* Settings tooltip */
.settings-tooltip {
  position: relative;
}

.settings-tooltip:hover::after {
  content: "设置";
  position: absolute;
  bottom: -30px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(255, 255, 255, 0.9);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 14px;
  white-space: nowrap;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  animation: fade-in 0.2s ease-in-out;
  font-weight: normal;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Dark mode styles */
@media (prefers-color-scheme: dark) {
  .status-bar {
    background-color: #1C1C1E;
    color: white;
  }
  
  .ios-header {
    background-color: rgba(28, 28, 30, 0.8);
    color: white;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .ios-header-right {
    color: #0A84FF;
  }
  
  .settings-tooltip:hover::after {
    background-color: rgba(44, 44, 46, 0.9);
    color: white;
  }
}

/* Desktop view adjustment */
@media (min-width: 768px) {
  .header-container {
    padding-left: 80px; /* Space for desktop sidebar */
  }
}
</style> 