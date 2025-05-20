<template>
  <form @submit.prevent="handleSubmit" class="login-form">
    <div class="form-group">
      <label for="email">
        <font-awesome-icon :icon="['fas', 'envelope']" class="input-icon" />
        邮箱
      </label>
      <input 
        type="email" 
        id="email" 
        v-model="email" 
        placeholder="请输入邮箱"
        required
        :class="{ 'input-error': errors.email }"
      />
      <span v-if="errors.email" class="error-message">{{ errors.email }}</span>
    </div>
    
    <div class="form-group">
      <label for="password">
        <font-awesome-icon :icon="['fas', 'lock']" class="input-icon" />
        密码
      </label>
      <div class="password-input-container">
        <input 
          :type="showPassword ? 'text' : 'password'" 
          id="password" 
          v-model="password" 
          placeholder="请输入密码"
          required
          :class="{ 'input-error': errors.password }"
        />
        <button 
          type="button" 
          class="toggle-password" 
          @click="togglePasswordVisibility"
        >
          <font-awesome-icon :icon="['fas', showPassword ? 'eye-slash' : 'eye']" />
        </button>
      </div>
      <span v-if="errors.password" class="error-message">{{ errors.password }}</span>
    </div>

    <!-- API error message -->
    <div v-if="apiError" class="api-error">
      {{ apiError }}
    </div>

    <div class="form-actions">
      <button 
        type="submit" 
        class="submit-button"
        :disabled="isSubmitting"
      >
        <span v-if="isSubmitting">
          <font-awesome-icon :icon="['fas', 'spinner']" spin />
          登录中...
        </span>
        <span v-else>
          <font-awesome-icon :icon="['fas', 'sign-in-alt']" class="button-icon" />
          登录
        </span>
      </button>
    </div>
  </form>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { authApi } from '@/api';

const router = useRouter();
const email = ref('');
const password = ref('');
const showPassword = ref(false);
const isSubmitting = ref(false);
const apiError = ref('');
const errors = reactive({
  email: '',
  password: ''
});

// Define emits
const emit = defineEmits(['switch-to-register', 'login-success']);

// Toggle password visibility
const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};

// Reset form errors
const resetErrors = () => {
  errors.email = '';
  errors.password = '';
  apiError.value = '';
};

// Validate form fields
const validateForm = () => {
  resetErrors();
  let isValid = true;

  if (!email.value.trim()) {
    errors.email = '请输入邮箱';
    isValid = false;
  } else if (!/\S+@\S+\.\S+/.test(email.value)) {
    errors.email = '请输入有效的邮箱';
    isValid = false;
  }

  if (!password.value) {
    errors.password = '请输入密码';
    isValid = false;
  } else if (password.value.length < 6) {
    errors.password = '密码长度不能少于6个字符';
    isValid = false;
  }

  return isValid;
};

// Handle form submission
const handleSubmit = async () => {
  if (!validateForm()) return;
  
  isSubmitting.value = true;
  apiError.value = '';
  
  try {
    console.log('Login form submitted with email:', email.value);
    
    // Call the login API
    const credentials = {
      email: email.value,
      password: password.value
    };
    
    console.log('Calling authApi.login with credentials');
    const response = await authApi.login(credentials);
    
    console.log('Login API response received:', response);
    
    // Handle successful login
    if (response.success) {
      console.log('Login successful, emitting login-success event');
      // Emit success event
      emit('login-success', response.data?.user);
    } else {
      console.error('Login responded with success:false', response);
      apiError.value = response.message || '登录失败，请稍后再试';
    }
  } catch (error) {
    console.error('Login form submission error:', error);
    
    // Handle API-specific errors
    if (error.status === 401) {
      apiError.value = '邮箱或密码不正确';
    } else if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
      apiError.value = '无法连接到服务器，请检查网络连接';
    } else {
      apiError.value = error.message || '登录失败，请稍后再试';
    }
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  width: 100%;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

label {
  font-weight: 500;
  color: var(--app-dark);
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.input-icon {
  color: var(--app-primary);
  font-size: 0.9rem;
}

input {
  padding: 1rem;
  border-radius: 12px;
  border: 1px solid var(--app-border);
  background-color: var(--app-light);
  color: var(--app-dark);
  font-size: 1rem;
  outline: none;
  transition: all 0.2s ease;
}

input:focus {
  border-color: var(--app-primary);
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}

.input-error {
  border-color: var(--app-danger);
}

.error-message {
  color: var(--app-danger);
  font-size: 0.8rem;
  margin-top: 0.25rem;
}

.api-error {
  background-color: rgba(255, 59, 48, 0.1);
  color: var(--app-danger);
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.9rem;
  text-align: center;
}

.password-input-container {
  position: relative;
  display: flex;
  align-items: center;
}

.password-input-container input {
  width: 100%;
  padding-right: 2.5rem;
}

.toggle-password {
  position: absolute;
  right: 1rem;
  background: none;
  border: none;
  color: var(--app-gray);
  cursor: pointer;
  transition: color 0.2s ease;
}

.toggle-password:hover {
  color: var(--app-primary);
}

.form-actions {
  margin-top: 0.5rem;
}

.submit-button {
  width: 100%;
  padding: 1rem;
  border-radius: 12px;
  border: none;
  background-color: var(--app-primary);
  color: white;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
}

.submit-button:hover {
  background-color: #0062cc;
  transform: translateY(-1px);
}

.submit-button:active {
  transform: translateY(1px);
}

.submit-button:disabled {
  background-color: var(--app-gray);
  cursor: not-allowed;
}

.button-icon {
  font-size: 0.9rem;
}
</style> 