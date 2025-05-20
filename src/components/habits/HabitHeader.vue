<template>
  <header class="habit-header">
    <!-- Decorative icon -->
    <div class="decoration-icon">
      <font-awesome-icon 
        :icon="getHeaderIcon()" 
        :style="{color: getHeaderColor()}" 
      />
    </div>
    
    <!-- Header content -->
    <div class="header-content">
      <!-- Title and tags -->
      <div class="title-section">
        <h1>{{ title }}</h1>
        <div class="tag-container">
          <span 
            v-for="(tag, index) in tags" 
            :key="index"
            :class="['tag', `tag-${tag.type}`]"
          >
            <font-awesome-icon 
              v-if="getTagIcon(tag.value)" 
              :icon="getTagIcon(tag.value)" 
              class="tag-icon" 
            />
            {{ tag.label }}
          </span>
          <span v-if="tags.length === 0" class="tag tag-small tag-orange">今日 +1</span>
        </div>
      </div>
      
      <!-- Count card -->
      <div class="count-card">
        <div class="count-section">
          <span class="count-number">{{ count }}</span>
          <div v-if="streak > 0" class="streak-badge">
            <font-awesome-icon icon="fire" class="streak-icon" />
            <span>{{ streak }}</span>
          </div>
        </div>
        <div class="count-buttons">
          <button 
            class="btn-circle btn-minus"
            @click="$emit('decrease')"
            :disabled="count <= 0"
          >
            <font-awesome-icon icon="minus" class="btn-icon btn-icon-gray" />
          </button>
          <button 
            class="btn-circle btn-plus" 
            @click="$emit('increase')"
            :disabled="isReadingMaxed"
            :class="{'btn-disabled': isReadingMaxed}"
            :title="isReadingMaxed ? '阅读习惯每天最多完成1次' : ''"
          >
            <font-awesome-icon icon="plus" class="btn-icon btn-icon-white" />
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { defineProps, defineEmits, computed } from 'vue';
import { useHabitsStore } from '@/stores/habitsStore';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

const habitsStore = useHabitsStore();

const props = defineProps({
  title: {
    type: String,
    default: '健康习惯'
  },
  count: {
    type: Number,
    default: 0
  },
  tags: {
    type: Array,
    default: () => []
  },
  streak: {
    type: Number,
    default: 0
  }
});

const emit = defineEmits(['increase', 'decrease']);

// 检查是否包含阅读标签
const hasReadingTag = computed(() => {
  return props.tags.some(tag => tag.value === '阅读');
});

// 是否已达到阅读上限
const isReadingMaxed = computed(() => {
  return hasReadingTag.value && props.count >= 1;
});

// 根据标签获取头部图标
const getHeaderIcon = () => {
  if (hasReadingTag.value) return 'book';
  
  const tagValues = props.tags.map(tag => tag.value);
  
  if (tagValues.includes('health')) return 'heart';
  if (tagValues.includes('study')) return 'graduation-cap';
  if (tagValues.includes('work')) return 'briefcase';
  if (tagValues.includes('entertainment')) return 'gamepad';
  if (tagValues.includes('bad')) return 'exclamation';
  
  // 默认图标
  return 'leaf';
};

// 根据标签获取头部颜色
const getHeaderColor = () => {
  if (hasReadingTag.value) return '#3b82f6';
  
  const tagValues = props.tags.map(tag => tag.value);
  
  if (tagValues.includes('health')) return '#10b981';
  if (tagValues.includes('study')) return '#8b5cf6';
  if (tagValues.includes('work')) return '#4b5563';
  if (tagValues.includes('entertainment')) return '#f59e0b';
  if (tagValues.includes('bad')) return '#ef4444';
  
  // 默认颜色
  return '#F56565';
};

// 根据标签获取图标
const getTagIcon = (tagValue) => {
  switch(tagValue) {
    case '阅读': return 'book';
    case 'health': return 'heart';
    case 'study': return 'graduation-cap';
    case 'work': return 'briefcase';
    case 'entertainment': return 'gamepad';
    case 'bad': return 'exclamation';
    case 'personal': return 'user';
    default: return null;
  }
};

function increase() {
  if (!isReadingMaxed.value) {
    emit('increase');
  }
}

function decrease() {
  emit('decrease');
}
</script>

<style scoped>
.habit-header {
  position: relative;
  border-radius: 0 0 24px 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  background-image: linear-gradient(135deg, #fafafa, #f0f0f0);
  padding: 24px 20px 16px;
  margin-bottom: 16px;
  overflow: hidden;
}

.decoration-icon {
  position: absolute;
  top: 16px;
  right: 24px;
  font-size: 60px;
  pointer-events: none;
  user-select: none;
  opacity: 0.2;
  z-index: 2;
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
  z-index: 10;
}

.title-section {
  margin-bottom: 4px;
}

h1 {
  font-size: 24px;
  font-weight: 600;
  color: #F56565;
  margin: 0 0 8px 0;
}

.tag-container {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
}

.tag-icon {
  margin-right: 6px;
  font-size: 12px;
}

.tag-small {
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 600;
}

.tag-orange {
  background-color: #fff7ed;
  color: #fb923c;
}

.tag-green {
  background-color: #f0fdf4;
  color: #16a34a;
}

.tag-red {
  background-color: #fef2f2;
  color: #dc2626;
}

.tag-blue {
  background-color: #eff6ff;
  color: #2563eb;
}

.tag-purple {
  background-color: #f5f3ff;
  color: #7c3aed;
}

.count-card {
  background-color: white;
  border-radius: 16px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  backdrop-filter: blur(2px);
}

.count-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.count-number {
  font-size: 32px;
  font-weight: 700;
  color: #F56565;
  transition: all 0.2s cubic-bezier(0.25, 1.25, 0.5, 1);
}

.streak-badge {
  display: inline-flex;
  align-items: center;
  background-color: #fef3c7;
  color: #b45309;
  border-radius: 12px;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 500;
  width: fit-content;
}

.streak-icon {
  margin-right: 4px;
  font-size: 10px;
}

.count-buttons {
  display: flex;
  gap: 12px;
}

.btn-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.25, 1.25, 0.5, 1);
}

.btn-circle:active:not(:disabled) {
  transform: scale(0.95);
}

.btn-circle:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-minus {
  background-color: #f3f4f6;
}

.btn-plus {
  background-color: #48BB78;
}

.btn-disabled {
  background-color: #9ca3af;
}

.btn-icon {
  font-size: 16px;
}

.btn-icon-white {
  color: white;
}

.btn-icon-gray {
  color: #6b7280;
}
</style> 