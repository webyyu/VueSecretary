<template>
  <div class="login-container">
    <div class="login-content">
      <!-- Logo and Header -->
      <div class="login-header">
        <font-awesome-icon :icon="['fas', 'robot']" class="logo-icon" />
        <h1 class="main-title">AI秘书</h1>
        <div class="subtitle-container">
          <svg class="underline" viewBox="0 0 200 10">
            <path d="M0,5 C50,0 150,10 200,5" stroke="#3366FF" fill="transparent" />
          </svg>
          <p class="subtitle" ref="typingText"></p>
        </div>
      </div>
      
      <!-- Form Container -->
      <div class="form-container">
        <div class="form-tabs">
          <button 
            :class="['tab-button', { active: activeTab === 'login' }]" 
            @click="activeTab = 'login'"
          >
            <font-awesome-icon :icon="['fas', 'sign-in-alt']" class="tab-icon" />
            登录
          </button>
          <button 
            :class="['tab-button', { active: activeTab === 'register' }]" 
            @click="activeTab = 'register'"
          >
            <font-awesome-icon :icon="['fas', 'user-plus']" class="tab-icon" />
            注册
          </button>
          <div class="tab-indicator" :class="activeTab"></div>
        </div>
        
        <div class="form-body">
          <transition name="fade-slide" mode="out-in">
            <LoginForm 
              v-if="activeTab === 'login'"
              @switch-to-register="activeTab = 'register'"
              @login-success="handleLoginSuccess"
            />
            <RegisterForm 
              v-else
              @switch-to-login="activeTab = 'login'"
              @register-success="handleRegisterSuccess"
            />
          </transition>
        </div>
        
        <div class="form-footer">
          <p v-if="activeTab === 'login'">
            还没有账号? 
            <button @click="activeTab = 'register'" class="text-button">
              立即注册
            </button>
          </p>
          <p v-else>
            已有账号? 
            <button @click="activeTab = 'login'" class="text-button">
              去登录
            </button>
          </p>
        </div>
      </div>
      
      <!-- Decorative Elements -->
      <div class="decorative-shape top-left"></div>
      <div class="decorative-shape bottom-right"></div>
      
      <!-- Debug Panel (visible only in development) -->
      <div v-if="showDebugPanel" class="debug-panel">
        <h3>调试信息</h3>
        <p>当前模式: {{ activeTab }}</p>
        <p>认证状态: {{ isAuthenticated ? '已登录' : '未登录' }}</p>
        <p>API 连接: <span class="connection-status" :class="apiConnected ? 'connected' : 'disconnected'">
          {{ apiConnected ? '已连接' : '未连接' }}
        </span></p>
        <button @click="checkApiConnection" class="debug-button">检查连接</button>
        <button @click="clearStorage" class="debug-button">清除存储</button>
        <button @click="toggleDebugPanel" class="debug-button">关闭</button>
      </div>
      <button v-if="!showDebugPanel" @click="toggleDebugPanel" class="debug-toggle">
        调试
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { authApi } from '@/api';
import LoginForm from '@/components/login/LoginForm.vue';
import RegisterForm from '@/components/login/RegisterForm.vue';

const router = useRouter();
const activeTab = ref('login');
const typingText = ref(null);
const showDebugPanel = ref(false);
const isAuthenticated = ref(false);
const apiConnected = ref(false);

// Toggle debug panel
const toggleDebugPanel = () => {
  showDebugPanel.value = !showDebugPanel.value;
};

// Clear localStorage for debugging
const clearStorage = () => {
  localStorage.clear();
  isAuthenticated.value = false;
  console.log('Storage cleared!');
};

// Check API connection status
const checkApiConnection = async () => {
  console.log('Checking API connection...');
  apiConnected.value = await authApi.checkConnection();
};

// Handle successful login
const handleLoginSuccess = (userData) => {
  console.log('Login successful in parent component:', userData);
  console.log('Token in localStorage:', localStorage.getItem('token'));
  console.log('User in localStorage:', localStorage.getItem('user'));
  router.push('/tasks');
};

// Handle successful registration
const handleRegisterSuccess = (userData) => {
  console.log('Registration successful in parent component:', userData);
  console.log('Token in localStorage:', localStorage.getItem('token'));
  console.log('User in localStorage:', localStorage.getItem('user'));
  router.push('/tasks');
};

// Typing animation for subtitle
const startTypingAnimation = () => {
  if (!typingText.value) return;
  
  const fullText = '365×24 全时在线 · 智能规划 · 护航每一刻';
  let idx = 0;
  
  function type() {
    if (idx <= fullText.length) {
      typingText.value.innerText = fullText.slice(0, idx++);
      setTimeout(type, 80);
    }
  }
  
  type();
};

// Check if user is already authenticated and redirect if so
onMounted(async () => {
  console.log('Login page mounted');
  
  // Check authentication status
  isAuthenticated.value = authApi.isAuthenticated();
  console.log('Authentication status:', isAuthenticated.value);
  
  // Check API connection
  await checkApiConnection();
  
  if (isAuthenticated.value) {
    console.log('User already authenticated, redirecting to tasks');
    router.push('/tasks');
  } else {
    // Start animations when component is mounted
    startTypingAnimation();
  }
});
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #F5F7FA;
  padding: 1rem;
  position: relative;
  overflow: hidden;
}

.login-content {
  width: 100%;
  max-width: 480px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2.5rem;
  z-index: 10;
}

.login-header {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.logo-icon {
  font-size: 3rem;
  color: #3366FF;
  margin-bottom: 0.5rem;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.main-title {
  font-size: 2rem;
  font-weight: 700;
  color: #333333;
  margin: 0;
  line-height: 1.2;
}

.subtitle-container {
  position: relative;
  padding-top: 0.5rem;
  margin-top: 0.5rem;
  width: 100%;
  max-width: 300px;
}

.underline {
  width: 100%;
  height: 10px;
  position: absolute;
  top: 0;
  left: 0;
}

.underline path {
  stroke-width: 1.5px;
  stroke-dasharray: 220;
  stroke-dashoffset: 220;
  animation: draw 1.5s forwards ease-out;
}

@keyframes draw {
  to { stroke-dashoffset: 0; }
}

.subtitle {
  font-size: 1rem;
  font-weight: 400;
  color: #545454;
  line-height: 1.5;
  min-height: 3rem;
}

.form-container {
  width: 100%;
  background-color: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.form-container:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.09);
}

.form-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  border-bottom: 1px solid var(--app-border);
}

.tab-button {
  padding: 1.25rem 1rem;
  font-size: 1rem;
  font-weight: 600;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--app-gray);
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  z-index: 1;
}

.tab-button:hover {
  color: #3366FF;
  transform: translateY(-2px);
}

.tab-button.active {
  color: #3366FF;
}

.tab-icon {
  font-size: 0.9rem;
}

.form-body {
  padding: 2rem;
  min-height: 300px;
}

.form-footer {
  padding: 1rem 2rem 2rem;
  text-align: center;
  color: var(--app-gray);
  font-size: 0.9rem;
}

.text-button {
  background: none;
  border: none;
  color: #3366FF;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.text-button:hover {
  color: #254EDB;
  text-decoration: underline;
  transform: translateY(-1px);
}

.text-button:active {
  transform: translateY(1px);
}

/* Decorative Shapes */
.decorative-shape {
  position: absolute;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--app-primary), var(--app-secondary));
  opacity: 0.1;
  z-index: 1;
}

.top-left {
  width: 400px;
  height: 400px;
  top: -200px;
  left: -200px;
}

.bottom-right {
  width: 600px;
  height: 600px;
  bottom: -300px;
  right: -300px;
}

/* Enhanced Animation classes */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* Debug Panel */
.debug-panel {
  position: fixed;
  top: 20px;
  right: 20px;
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 15px;
  border-radius: 8px;
  z-index: 1000;
  width: 250px;
}

.debug-button {
  background-color: #3366FF;
  color: white;
  border: none;
  padding: 5px 10px;
  margin: 5px 5px 0 0;
  border-radius: 4px;
  cursor: pointer;
}

.debug-toggle {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  z-index: 1000;
}

/* Media Queries */
@media (max-width: 480px) {
  .login-content {
    gap: 1.5rem;
  }
  
  .logo-icon {
    font-size: 2.5rem;
  }
  
  .main-title {
    font-size: 2rem;
  }
  
  .subtitle {
    font-size: 0.9rem;
  }
  
  .form-body {
    padding: 1.5rem;
  }
  
  .debug-panel,
  .debug-toggle {
    display: none;
  }
}

@media (prefers-color-scheme: dark) {
  .login-container {
    background-color: #1A1A1A;
  }
  
  .form-container {
    background-color: #2C2C2E;
  }
  
  .main-title {
    color: #FFFFFF;
  }
  
  .subtitle {
    color: #AAAAAA;
  }
  
  .tab-button {
    color: #AAAAAA;
  }
  
  .form-tabs {
    border-bottom-color: rgba(255, 255, 255, 0.1);
  }
  
  .decorative-shape {
    opacity: 0.05;
  }
}

.tab-indicator {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 50%;
  height: 2px;
  background-color: #3366FF;
  transition: transform 0.3s ease-in-out;
}

.tab-indicator.register {
  transform: translateX(100%);
}

.connection-status {
  font-weight: bold;
  border-radius: 4px;
  padding: 2px 6px;
}

.connected {
  color: white;
  background-color: #4CAF50;
}

.disconnected {
  color: white;
  background-color: #F44336;
}
</style>
