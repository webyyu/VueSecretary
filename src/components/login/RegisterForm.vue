<template>
  <form @submit.prevent="handleSubmit" class="register-form">
    <div v-if="apiError" class="api-error-message">
      {{ apiError }}
    </div>
    
    <div class="form-group">
      <label for="email">
        <font-awesome-icon :icon="['fas', 'envelope']" class="input-icon" />
        邮箱
      </label>
      <input 
        type="email" 
        id="email" 
        v-model="email" 
        placeholder="请输入邮箱地址"
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
          placeholder="请输入密码 (至少6位)"
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
    
    <div class="form-group">
      <label for="confirmPassword">
        <font-awesome-icon :icon="['fas', 'check-circle']" class="input-icon" />
        确认密码
      </label>
      <div class="password-input-container">
        <input 
          :type="showPassword ? 'text' : 'password'" 
          id="confirmPassword" 
          v-model="confirmPassword" 
          placeholder="请再次输入密码"
          required
          :class="{ 'input-error': errors.confirmPassword }"
        />
      </div>
      <span v-if="errors.confirmPassword" class="error-message">{{ errors.confirmPassword }}</span>
    </div>

    <div class="form-actions">
      <button 
        type="submit" 
        class="submit-button"
        :disabled="isSubmitting"
      >
        <span v-if="isSubmitting">
          <font-awesome-icon :icon="['fas', 'spinner']" spin />
          注册中...
        </span>
        <span v-else>
          <font-awesome-icon :icon="['fas', 'user-plus']" class="button-icon" />
          注册
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
const confirmPassword = ref('');
const showPassword = ref(false);
const isSubmitting = ref(false);
const apiError = ref('');
const errors = reactive({
  email: '',
  password: '',
  confirmPassword: ''
});

// Define emits
const emit = defineEmits(['switch-to-login', 'register-success']);

// Toggle password visibility
const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};

// Reset form errors
const resetErrors = () => {
  errors.email = '';
  errors.password = '';
  errors.confirmPassword = '';
  apiError.value = '';
};

// Validate form fields
const validateForm = () => {
  resetErrors();
  let isValid = true;

  // Email validation
  if (!email.value.trim()) {
    errors.email = '请输入邮箱地址';
    isValid = false;
  } else if (!/^\S+@\S+\.\S+$/.test(email.value)) {
    errors.email = '请输入有效的邮箱地址';
    isValid = false;
  }

  if (!password.value) {
    errors.password = '请输入密码';
    isValid = false;
  } else if (password.value.length < 6) {
    errors.password = '密码长度不能少于6个字符';
    isValid = false;
  }
  
  if (!confirmPassword.value) {
    errors.confirmPassword = '请确认密码';
    isValid = false;
  } else if (password.value !== confirmPassword.value) {
    errors.confirmPassword = '两次输入的密码不一致';
    isValid = false;
  }

  return isValid;
};

// Handle form submission
const handleSubmit = async () => {
  if (!validateForm()) return;
  
  isSubmitting.value = true;
  apiError.value = '';
  console.log('Registration form submitted with email:', email.value);
  
  try {
    console.log('Calling authApi.register...');
    const userData = {
      name: email.value.split('@')[0], // Use part of email as name if not provided
      email: email.value,
      password: password.value
    };
    
    const response = await authApi.register(userData);
    
    console.log('Registration response received:', response);
    
    if (response.success) {
      console.log('Registration successful, emitting success event');
      emit('register-success', response.data?.user);
    } else {
      console.error('Registration responded with success:false', response);
      apiError.value = response.message || '注册失败，请稍后再试';
    }
  } catch (error) {
    console.error('Registration form submission error:', error);
    apiError.value = error.message || '注册失败，请稍后再试';
    
    // Check if the error is related to the email already being in use
    if (error.status === 409 || 
        (error.message?.toLowerCase().includes('email') && 
         error.message?.toLowerCase().includes('already'))) {
      errors.email = '该邮箱已被注册';
    } else if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
      apiError.value = '无法连接到服务器，请检查网络连接';
    }
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
.register-form {
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

.api-error-message {
  background-color: #ffebee;
  border-left: 4px solid var(--app-danger);
  color: #d32f2f;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
  border-radius: 4px;
  font-size: 0.9rem;
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