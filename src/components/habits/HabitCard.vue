<template>
  <div 
    :class="['habit-card', { 'dark': isDark, 'selected': isSelected }]"
    @click="$emit('select')"
    v-double-tap="() => $emit('toggle-style')"
  >
    <div class="card-actions">
      <button class="edit-button" @click.stop="$emit('edit')" title="编辑习惯">
        <font-awesome-icon icon="edit" />
      </button>
      <button class="delete-button" @click.stop="$emit('delete')" title="删除习惯">
        <font-awesome-icon icon="trash" />
      </button>
    </div>
    <div class="card-content">
      <div class="card-title" :class="{ 'text-white': isDark }">{{ title }}</div>
      
      <div class="card-info-row">
        <div :class="['card-count', isDark ? 'card-count-dark' : 'card-count-light']">{{ count }}</div>
        <div class="card-tags">
          <span 
            v-for="(tag, index) in displayTags" 
            :key="index"
            :class="['card-tag', getTagColorClass(tag)]"
          >
            {{ tag }}
          </span>
        </div>
      </div>
      
      <div v-if="streak > 0" class="streak-badge" :class="{'streak-badge-dark': isDark}">
        <font-awesome-icon icon="fire" class="streak-icon" />
        <span>{{ streak }}</span>
      </div>
    </div>
    <div class="card-icon">
      <font-awesome-icon 
        :icon="iconName" 
        :style="{color: iconColor}"
        class="habit-icon"
      />
      <div class="icon-badge-container" @click.stop="handleBadgeClick">
        <div :class="['icon-badge', getBadgeClass()]">
          <font-awesome-icon 
            :icon="getBadgeIcon()" 
            class="badge-icon" 
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, computed } from 'vue';
import { vDoubleTap } from './doubleTap';
import { useHabitsStore } from '@/stores/habitsStore';

const habitsStore = useHabitsStore();

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  count: {
    type: Number,
    default: 0
  },
  isDark: {
    type: Boolean,
    default: false
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  isSelected: {
    type: Boolean,
    default: false
  },
  streak: {
    type: Number,
    default: 0
  },
  tags: {
    type: Array,
    default: () => []
  },
  habit: {
    type: Object,
    default: () => ({})
  }
});

const emit = defineEmits(['select', 'toggle-complete', 'toggle-style', 'delete', 'edit']);

// 从props中提取habit对象中的标签，如果没有则使用空数组
const habitTags = computed(() => {
  if (props.habit && props.habit.tags) {
    return props.habit.tags;
  }
  return [];
});

// 检查是否包含阅读标签
const hasReadingTag = computed(() => {
  return habitTags.value.includes('阅读');
});

// 检查是否是阅读习惯且完成次数已达上限
const isReadingMaxed = computed(() => {
  return hasReadingTag.value && props.count >= 1;
});

// 显示的标签 (限制数量避免拥挤)
const displayTags = computed(() => {
  // 如果有习惯标签，取前两个显示
  if (habitTags.value && habitTags.value.length > 0) {
    return habitTags.value.slice(0, 2);
  }
  return [];
});

// 获取标签颜色类
const getTagColorClass = (tag) => {
  switch(tag) {
    case 'health': return 'tag-green';
    case 'study': return 'tag-purple';
    case 'work': return 'tag-blue';
    case 'entertainment': return 'tag-orange';
    case 'bad': return 'tag-red';
    case '阅读': return 'tag-purple';
    case 'personal': return 'tag-green';
    default: return 'tag-gray';
  }
};

// 根据习惯的icon属性或标签获取图标名称
const iconName = computed(() => {
  // 优先使用习惯对象中的icon字段，如果是有效的FontAwesome图标名称
  if (props.habit && props.habit.icon && typeof props.habit.icon === 'string' && !props.habit.icon.includes('/') && props.habit.icon !== 'default-habit-icon') {
    return props.habit.icon;
  }
  
  const tagValues = habitTags.value || [];
  
  // 根据标签返回适当的图标
  if (hasReadingTag.value) return 'book';
  if (tagValues.includes('健康') || tagValues.includes('health')) return 'heart';
  if (tagValues.includes('学习') || tagValues.includes('study')) return 'graduation-cap';
  if (tagValues.includes('工作') || tagValues.includes('work')) return 'briefcase';
  if (tagValues.includes('娱乐') || tagValues.includes('entertainment')) return 'gamepad';
  
  // 默认图标
  return 'star';
});

// 根据标签和暗色模式获取图标颜色
const iconColor = computed(() => {
  if (props.isDark) {
    return hasReadingTag.value ? '#4299e1' : '#6b7280';
  }
  if (hasReadingTag.value) return '#2563eb';
  if (habitTags.value.includes('健康') || habitTags.value.includes('health')) return '#10b981';
  if (habitTags.value.includes('学习') || habitTags.value.includes('study')) return '#8b5cf6';
  if (habitTags.value.includes('工作') || habitTags.value.includes('work')) return '#4b5563';
  if (habitTags.value.includes('娱乐') || habitTags.value.includes('entertainment')) return '#f59e0b';
  return '#4a5568';
});

// 从URL提取图标ID
const extractIconFromUrl = (url) => {
  if (!url) return 'default-habit-icon';
  
  const matches = url.match(/\/(\d+\/\d+)\.png$/);
  return matches ? matches[1] : 'default-habit-icon';
};

const getBadgeClass = () => {
  if (props.isCompleted) {
    return 'icon-badge-green';
  } else if (isReadingMaxed.value) {
    return 'icon-badge-disabled';
  } else if (props.isDark) {
    return 'icon-badge-white';
  } else {
    return 'icon-badge-light';
  }
};

// 为徽章获取正确的图标
const getBadgeIcon = () => {
  if (props.isCompleted) {
    return 'check';
  } else if (props.habit && props.habit.iconType === 'camera') {
    return 'camera';
  } else {
    return 'plus';
  }
};

// 处理徽标点击
const handleBadgeClick = () => {
  // 如果是阅读习惯且已经达到上限，则不允许增加
  if (!props.isCompleted && isReadingMaxed.value) {
    return; // 不执行任何操作
  }
  
  emit('toggle-complete');
};
</script>

<style scoped>
.habit-card {
  background-color: white;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  padding: 16px;
  position: relative;
  transition: all 0.2s cubic-bezier(0.25, 1.25, 0.5, 1);
  cursor: pointer;
  min-height: 120px;
  display: flex;
  flex-direction: column;
}

.habit-card:active {
  transform: scale(0.98);
}

.habit-card.dark {
  background-color: #1f2937;
}

.habit-card.selected {
  box-shadow: 0 0 0 2px #3b82f6, 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  opacity: 0;
  transition: opacity 0.2s ease;
  z-index: 5;
  display: flex;
  gap: 6px;
}

.habit-card:hover .card-actions {
  opacity: 1;
}

.delete-button, .edit-button {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
}

.delete-button {
  color: #ef4444;
}

.delete-button:hover {
  background-color: rgba(239, 68, 68, 0.1);
}

.edit-button {
  color: #3b82f6;
}

.edit-button:hover {
  background-color: rgba(59, 130, 246, 0.1);
}

.card-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  position: relative;
  z-index: 1;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
  line-height: 1.2;
}

.text-white {
  color: white;
}

.card-count {
  font-weight: 500;
  font-size: 16px;
  margin-top: 4px;
}

.card-count-light {
  color: #F56565;
}

.card-count-dark {
  color: #fb923c;
}

.streak-badge {
  display: inline-flex;
  align-items: center;
  margin-top: 10px;
  background-color: #fef3c7;
  color: #b45309;
  border-radius: 12px;
  padding: 3px 10px;
  font-size: 12px;
  font-weight: 500;
  width: fit-content;
}

.streak-badge-dark {
  background-color: #4b5563;
  color: #fbbf24;
}

.streak-icon {
  margin-right: 6px;
  font-size: 10px;
}

.card-info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 6px;
  margin-bottom: 4px;
}

.card-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.card-tag {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 20px;
  white-space: nowrap;
  font-weight: 500;
}

.tag-green {
  background-color: #f0fdf4;
  color: #16a34a;
}

.tag-red {
  background-color: #fef2f2;
  color: #dc2626;
}

.tag-orange {
  background-color: #fff7ed;
  color: #f97316;
}

.tag-blue {
  background-color: #eff6ff;
  color: #2563eb;
}

.tag-purple {
  background-color: #f5f3ff;
  color: #7c3aed;
}

.tag-gray {
  background-color: #f3f4f6;
  color: #4b5563;
}

.habit-card.dark .tag-green,
.habit-card.dark .tag-red,
.habit-card.dark .tag-orange,
.habit-card.dark .tag-blue,
.habit-card.dark .tag-purple,
.habit-card.dark .tag-gray {
  background-color: #374151;
  color: #e5e7eb;
}

.card-icon {
  position: absolute;
  bottom: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.habit-icon {
  font-size: 28px;
  opacity: 0.8;
}

.icon-badge-container {
  position: absolute;
  bottom: -5px;
  right: -5px;
}

.icon-badge {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.icon-badge-green {
  background-color: #48BB78;
  color: white;
}

.icon-badge-white {
  background-color: white;
  color: #1f2937;
}

.icon-badge-light {
  background-color: #dcfce7;
  color: #16a34a;
}

.icon-badge-disabled {
  background-color: #e5e7eb;
  color: #9ca3af;
  cursor: not-allowed;
}

.badge-icon {
  font-size: 11px;
}
</style> 