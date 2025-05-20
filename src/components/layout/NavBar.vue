<template>
  <div :class="['nav-container', isMobileView ? 'mobile-nav' : 'desktop-nav']">
    <router-link 
      v-for="item in navItems" 
      :key="item.path" 
      :to="item.path"
      class="nav-item"
      :class="{ active: currentRoute === item.path }"
    >
      <div class="nav-icon">
        <font-awesome-icon :icon="item.icon" />
      </div>
      <div class="nav-text">{{ item.label }}</div>
    </router-link>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const currentRoute = computed(() => route.path);
const isMobileView = ref(window.innerWidth < 768);

const navItems = [
  { path: '/tasks', label: '任务', icon: 'tasks' },
  { path: '/habits', label: '习惯', icon: 'calendar-check' },
  { path: '/ai-assistant', label: '智能助手', icon: 'robot' },
  { path: '/calendar', label: '日历', icon: 'calendar' },
  { path: '/stats', label: '统计', icon: 'chart-pie' }
];

const handleResize = () => {
  isMobileView.value = window.innerWidth < 768;
};

onMounted(() => {
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
.nav-container {
  display: flex;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  z-index: 10;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.mobile-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 83px;
  justify-content: space-around;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  padding-bottom: env(safe-area-inset-bottom, 20px);
}

.desktop-nav {
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 80px;
  border-right: 1px solid rgba(0, 0, 0, 0.1);
  padding: 20px 0;
  justify-content: flex-start;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--app-gray, #8E8E93);
  font-size: 10px;
  text-decoration: none;
  transition: color 0.2s ease;
  cursor: pointer;
  position: relative;
}

.mobile-nav .nav-item {
  flex: 1;
  height: 100%;
}

.desktop-nav .nav-item {
  width: 100%;
  padding: 15px 0;
  margin-bottom: 10px;
}

.nav-icon {
  font-size: 24px;
  margin-bottom: 4px;
}

.nav-item.active {
  color: var(--app-primary, #007AFF);
}

.desktop-nav .nav-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  height: 60%;
  width: 3px;
  background-color: var(--app-primary, #007AFF);
  border-radius: 0 4px 4px 0;
}

/* Dark mode styles */
@media (prefers-color-scheme: dark) {
  .nav-container {
    background-color: rgba(28, 28, 30, 0.8);
  }
  
  .nav-item {
    color: #8E8E93;
  }
  
  .nav-item.active {
    color: #0A84FF;
  }
  
  .mobile-nav {
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .desktop-nav {
    border-right: 1px solid rgba(255, 255, 255, 0.1);
  }
}
</style> 