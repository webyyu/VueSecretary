<template>
  <BaseLayout title="统计 API 测试">
    <div class="test-container">
      <h1>统计 API 测试页面</h1>
      <button @click="runTests" :disabled="isRunning" class="test-button">
        <font-awesome-icon v-if="isRunning" icon="spinner" class="btn-icon fa-spin" />
        <font-awesome-icon v-else icon="vial" class="btn-icon" />
        {{ buttonText }}
      </button>
      <div v-if="testResults.length > 0" class="results-container">
        <h2>测试结果</h2>
        <div class="log-entry" v-for="(log, index) in testResults" :key="index">
          <pre :class="{ 'error': log.type === 'error' }">{{ log.message }}</pre>
        </div>
      </div>
    </div>
  </BaseLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { runStatsTests } from '../test-stats-api';
import BaseLayout from '../components/layout/BaseLayout.vue';

const isRunning = ref(false);
const buttonText = ref('运行统计 API 测试');
const testResults = ref([]);

// 重定向控制台输出到界面
const setupConsoleRedirection = () => {
  // 保存原始的控制台方法
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;

  // 重写控制台方法
  console.log = (...args) => {
    // 调用原始方法，以便在浏览器控制台仍能看到输出
    originalLog(...args);
    // 将输出添加到测试结果
    testResults.value.push({
      type: 'log',
      message: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg).join(' ')
    });
  };

  console.error = (...args) => {
    originalError(...args);
    testResults.value.push({
      type: 'error',
      message: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg).join(' ')
    });
  };

  console.warn = (...args) => {
    originalWarn(...args);
    testResults.value.push({
      type: 'warn',
      message: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg).join(' ')
    });
  };

  return () => {
    // 返回一个清理函数，恢复原始控制台方法
    console.log = originalLog;
    console.error = originalError;
    console.warn = originalWarn;
  };
};

const runTests = async () => {
  buttonText.value = '测试运行中...';
  isRunning.value = true;
  testResults.value = [];

  // 设置控制台重定向
  const restoreConsole = setupConsoleRedirection();

  try {
    await runStatsTests();
    buttonText.value = '运行成功 - 再次运行';
  } catch (error) {
    console.error('测试执行出错:', error);
    buttonText.value = '测试失败 - 重试';
  } finally {
    isRunning.value = false;
    // 恢复原始控制台方法
    restoreConsole();
  }
};

onMounted(() => {
  // 可以自动运行测试，或由用户点击按钮运行
  // runTests();
});
</script>

<style scoped>
.test-container {
  background-color: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: var(--app-shadow);
  margin-bottom: 20px;
}

h1 {
  font-size: 24px;
  margin-bottom: 20px;
  color: var(--app-primary);
}

h2 {
  font-size: 18px;
  margin: 16px 0;
}

.test-button {
  background-color: var(--app-primary);
  color: white;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  transition: all 0.2s;
}

.test-button:active:not(:disabled) {
  transform: scale(0.98);
}

.test-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-icon {
  margin-right: 8px;
}

.results-container {
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 16px;
  font-family: monospace;
  max-height: 600px;
  overflow-y: auto;
}

.log-entry {
  margin-bottom: 8px;
}

pre {
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
  padding: 4px 0;
}

.error {
  color: #ff3b30;
}

@media (prefers-color-scheme: dark) {
  .test-container {
    background-color: #2C2C2E;
  }
  
  .results-container {
    background-color: #1C1C1E;
    color: #E5E5EA;
  }
}
</style> 