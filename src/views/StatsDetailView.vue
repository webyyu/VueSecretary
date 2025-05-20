<template>
  <BaseLayout title="统计详情" showBackButton @back="goBack">
    <!-- 日期选择器 -->
    <div class="date-selector">
      <font-awesome-icon 
        icon="chevron-left" 
        class="date-nav-icon" 
        @click="changeDate(-1)" 
      />
      <div class="current-date">
        {{ formatDate(date) }}
      </div>
      <font-awesome-icon 
        icon="chevron-right" 
        class="date-nav-icon" 
        @click="changeDate(1)" 
        :class="{ 'disabled': isFutureDate }"
      />
    </div>

    <!-- 今日概览 -->
    <div class="stat-card" v-if="!isLoading">
      <div class="stat-header">
        <div class="stat-title">概览</div>
      </div>
      
      <div class="metric-cards">
        <div class="metric-card" style="--index: 0.5;">
          <div class="metric-icon text-primary">
            <font-awesome-icon icon="tasks" />
          </div>
          <div class="metric-value">{{ todaySummary.completedTasks }}</div>
          <div class="metric-label">完成任务</div>
        </div>
        
        <div class="metric-card" style="--index: 0.7;">
          <div class="metric-icon text-purple">
            <font-awesome-icon icon="calendar-check" />
          </div>
          <div class="metric-value">{{ todaySummary.habitCheckins }}</div>
          <div class="metric-label">习惯打卡</div>
        </div>
        
        <div class="metric-card" style="--index: 0.9;">
          <div class="metric-icon text-orange">
            <font-awesome-icon icon="clock" />
          </div>
          <div class="metric-value">{{ todaySummary.focusTime }}h</div>
          <div class="metric-label">专注时间</div>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-container">
      <font-awesome-icon icon="spinner" spin class="loading-icon" />
      <div>加载中...</div>
    </div>

    <!-- 已完成任务 -->
    <div class="stat-card" v-if="!isLoading">
      <div class="stat-header">
        <div class="stat-title">已完成任务</div>
        <div class="stat-count">共 {{ completedTasks.length }} 项</div>
      </div>
      
      <div class="empty-state" v-if="completedTasks.length === 0">
        <font-awesome-icon icon="clipboard-check" class="empty-icon" />
        <div>该日期没有已完成的任务</div>
      </div>
      
      <div class="task-list" v-else>
        <div 
          v-for="task in completedTasks" 
          :key="task.id"
          class="task-item"
        >
          <div class="task-item-header">
            <div class="task-title">{{ task.title }}</div>
            <div class="task-group" v-if="task.group">{{ task.group }}</div>
          </div>
          <div class="task-time">完成时间：{{ formatTime(task.completedAt) }}</div>
        </div>
      </div>
    </div>

    <!-- 习惯打卡 -->
    <div class="stat-card" v-if="!isLoading">
      <div class="stat-header">
        <div class="stat-title">习惯打卡</div>
        <div class="stat-count">共 {{ habitCheckins.length }} 项</div>
      </div>
      
      <div class="empty-state" v-if="habitCheckins.length === 0">
        <font-awesome-icon icon="calendar-check" class="empty-icon" />
        <div>该日期没有习惯打卡记录</div>
      </div>
      
      <div class="habit-list" v-else>
        <div 
          v-for="habit in habitCheckins" 
          :key="habit.id"
          class="habit-item"
        >
          <div class="habit-item-header">
            <div class="habit-title">{{ habit.name }}</div>
            <div class="habit-streak">
              <font-awesome-icon icon="fire" class="streak-icon" />
              <span>{{ habit.streakDays }}天</span>
            </div>
          </div>
          <div class="habit-time">打卡时间：{{ formatTime(habit.checkinTime) }}</div>
        </div>
      </div>
    </div>

    <!-- 专注时间会话 -->
    <div class="stat-card" v-if="!isLoading">
      <div class="stat-header">
        <div class="stat-title">专注时间会话</div>
        <div class="stat-count">共 {{ focusSessions.length }} 项</div>
      </div>
      
      <div class="empty-state" v-if="focusSessions.length === 0">
        <font-awesome-icon icon="clock" class="empty-icon" />
        <div>该日期没有专注时间记录</div>
      </div>
      
      <div class="focus-list" v-else>
        <div 
          v-for="session in focusSessions" 
          :key="session.id"
          class="focus-item"
        >
          <div class="focus-item-header">
            <div class="focus-task-name">{{ session.taskName || '未关联任务' }}</div>
            <div class="focus-duration">{{ formatDuration(session.duration) }}</div>
          </div>
          <div class="focus-time">
            {{ formatTime(session.startTime) }} - {{ formatTime(session.endTime) }}
          </div>
        </div>
      </div>
    </div>
  </BaseLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import BaseLayout from '../components/layout/BaseLayout.vue';
import { statsApi } from '../api';

// 初始化路由
const router = useRouter();
const route = useRoute();

// 日期相关
const date = ref(new Date());
const isFutureDate = computed(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentDate = new Date(date.value);
  currentDate.setHours(0, 0, 0, 0);
  return currentDate > today;
});

// 数据加载状态
const isLoading = ref(true);

// 数据存储
const todaySummary = ref({
  completedTasks: 0,
  habitCheckins: 0,
  focusTime: 0
});
const completedTasks = ref([]);
const habitCheckins = ref([]);
const focusSessions = ref([]);

// 格式化日期为可读文本
const formatDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const weekday = weekdays[d.getDay()];
  
  // 检查是否为今天
  const today = new Date();
  const isToday = d.getDate() === today.getDate() && 
                 d.getMonth() === today.getMonth() && 
                 d.getFullYear() === today.getFullYear();
                 
  return `${year}年${month}月${day}日 ${weekday}${isToday ? ' (今天)' : ''}`;
};

// 格式化时间为HH:MM格式
const formatTime = (timestamp) => {
  if (!timestamp) return '未知时间';
  
  const d = new Date(timestamp);
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  
  return `${hours}:${minutes}`;
};

// 格式化持续时间（分钟）为可读文本
const formatDuration = (durationMinutes) => {
  if (!durationMinutes) return '0分钟';
  
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  
  if (hours > 0) {
    return `${hours}小时${minutes > 0 ? ` ${minutes}分钟` : ''}`;
  }
  return `${minutes}分钟`;
};

// 格式化日期为API查询参数
const formatDateForQuery = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

// 更改日期
const changeDate = (days) => {
  if (days > 0 && isFutureDate.value) return;
  
  const newDate = new Date(date.value);
  newDate.setDate(newDate.getDate() + days);
  date.value = newDate;
  
  // 更新URL
  router.replace({
    query: { ...route.query, date: formatDateForQuery(newDate) }
  });
};

// 返回统计页面
const goBack = () => {
  router.push('/stats');
};

// 加载数据
const loadData = async () => {
  isLoading.value = true;
  
  try {
    const formattedDate = formatDateForQuery(date.value);
    
    // 并行加载所有数据
    const [summaryData, tasksData, habitsData, focusData] = await Promise.all([
      statsApi.getTodaySummary(formattedDate),
      statsApi.getCompletedTasks(formattedDate),
      statsApi.getHabitCheckins(formattedDate),
      statsApi.getFocusSessions(formattedDate)
    ]);
    
    // 更新数据
    todaySummary.value = summaryData;
    completedTasks.value = tasksData || [];
    habitCheckins.value = habitsData || [];
    focusSessions.value = focusData || [];
    
    console.log('统计详情数据加载完成', {
      summary: summaryData,
      tasks: tasksData,
      habits: habitsData,
      focus: focusData
    });
    
    // 添加详细调试信息
    console.log('===== 统计详情调试信息 =====');
    console.log('当前日期:', formattedDate);
    console.log('概览数据:', JSON.stringify(summaryData, null, 2));
    console.log('已完成任务:', tasksData ? tasksData.length : 0, '项');
    if (tasksData && tasksData.length > 0) {
      console.log('任务示例:', JSON.stringify(tasksData[0], null, 2));
    }
    console.log('习惯打卡:', habitsData ? habitsData.length : 0, '项');
    if (habitsData && habitsData.length > 0) {
      console.log('习惯示例:', JSON.stringify(habitsData[0], null, 2));
    }
    console.log('专注会话:', focusData ? focusData.length : 0, '项');
    console.log('============================');
  } catch (error) {
    console.error('加载统计详情数据失败:', error);
  } finally {
    isLoading.value = false;
  }
};

// 组件挂载时加载数据
onMounted(() => {
  // 从URL查询参数获取日期
  if (route.query.date) {
    try {
      date.value = new Date(route.query.date);
      if (isNaN(date.value.getTime())) {
        date.value = new Date();
      }
    } catch (e) {
      date.value = new Date();
    }
  }
  
  // 加载数据
  loadData();
});

// 监听日期变化
watch(date, () => {
  loadData();
});
</script>

<style scoped>
.date-selector {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: var(--app-shadow);
}

.date-nav-icon {
  font-size: 18px;
  color: var(--app-primary);
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.date-nav-icon:hover {
  background-color: var(--app-light);
}

.date-nav-icon.disabled {
  color: var(--app-gray);
  cursor: not-allowed;
}

.current-date {
  font-size: 18px;
  font-weight: 600;
}

.stat-card {
  background-color: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: var(--app-shadow);
  animation: fadeIn 0.6s ease forwards;
  animation-delay: calc(var(--index) * 0.1s);
  opacity: 0;
  --index: 0;
}

.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.stat-title {
  font-weight: 600;
  font-size: 18px;
}

.stat-count {
  font-size: 14px;
  color: var(--app-gray);
}

.metric-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}

.metric-card {
  background-color: white;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  animation: fadeIn 0.6s ease forwards;
  animation-delay: calc(var(--index) * 0.1s);
  opacity: 0;
}

.metric-icon {
  margin-bottom: 8px;
  font-size: 24px;
}

.text-primary {
  color: var(--app-primary);
}

.text-purple {
  color: #AF52DE;
}

.text-orange {
  color: var(--app-warning);
}

.metric-value {
  font-size: 24px;
  font-weight: 700;
  margin: 8px 0;
}

.metric-label {
  font-size: 12px;
  color: var(--app-gray);
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: var(--app-gray);
}

.loading-icon {
  font-size: 32px;
  margin-bottom: 16px;
  color: var(--app-primary);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  color: var(--app-gray);
}

.empty-icon {
  font-size: 32px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.task-list, .habit-list, .focus-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-item, .habit-item, .focus-item {
  background-color: var(--app-light);
  border-radius: 12px;
  padding: 16px;
  animation: fadeIn 0.5s ease forwards;
  animation-delay: calc(var(--index) * 0.05s);
  opacity: 0;
  --index: 1;
}

.task-item:nth-child(1), .habit-item:nth-child(1), .focus-item:nth-child(1) {
  --index: 1;
}

.task-item:nth-child(2), .habit-item:nth-child(2), .focus-item:nth-child(2) {
  --index: 2;
}

.task-item:nth-child(3), .habit-item:nth-child(3), .focus-item:nth-child(3) {
  --index: 3;
}

.task-item-header, .habit-item-header, .focus-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.task-title, .habit-title, .focus-task-name {
  font-weight: 600;
}

.task-group {
  font-size: 12px;
  background-color: var(--app-primary-light);
  color: var(--app-primary);
  padding: 4px 8px;
  border-radius: 4px;
}

.task-time, .habit-time, .focus-time {
  font-size: 12px;
  color: var(--app-gray);
}

.habit-streak {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: var(--app-warning);
}

.streak-icon {
  margin-right: 4px;
}

.focus-duration {
  font-size: 14px;
  font-weight: 500;
  color: var(--app-primary);
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .date-selector, .stat-card {
    background-color: #2C2C2E;
  }
  
  .metric-card {
    background-color: #3A3A3C;
  }
  
  .task-item, .habit-item, .focus-item {
    background-color: #3A3A3C;
  }
}

/* 响应式调整 */
@media (max-width: 480px) {
  .metric-cards {
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style> 