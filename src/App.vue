<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import NavBar from './components/layout/NavBar.vue';

const route = useRoute();
const isAuthenticated = ref(false);

// Check if user is authenticated
const checkAuth = () => {
  isAuthenticated.value = localStorage.getItem('user') !== null;
};

// Check if navbar should be shown (auth routes except login)
const showNavBar = computed(() => {
  return isAuthenticated.value && route.name !== 'login';
});

// Check auth status on mount and when localStorage changes
onMounted(() => {
  checkAuth();
  
  // Listen for storage events in case user logs in/out in another tab
  window.addEventListener('storage', checkAuth);
});
</script>

<template>
  <div id="app">
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
    <NavBar v-if="showNavBar" />
  </div>
</template>

<style>
/* App container style ensuring proper flexbox layout */
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  max-width: 430px;
  margin: 0 auto;
  position: relative;
}

@media (min-width: 768px) {
  #app {
    max-width: 768px;
    padding-left: 80px; /* Space for sidebar */
  }
}

@media (min-width: 1024px) {
  #app {
    max-width: 1024px;
  }
}
</style>
