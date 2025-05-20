<template>
  <BaseLayout title="日历">
    <!-- Calendar Header -->
    <div class="calendar-header">
      <div class="calendar-nav prev-month" @click="previousMonth">
        <font-awesome-icon icon="chevron-left" />
      </div>
      <div class="current-month">{{ currentMonthDisplay }}</div>
      <div class="calendar-nav next-month" @click="nextMonth">
        <font-awesome-icon icon="chevron-right" />
      </div>
    </div>
    
    <!-- Calendar Weekdays -->
    <div class="calendar-weekdays">
      <div v-for="day in weekDays" :key="day">{{ day }}</div>
    </div>
    
    <!-- Calendar Days -->
    <div class="calendar-days">
      <div 
        v-for="dayInfo in calendarDays" 
        :key="`${dayInfo.month}-${dayInfo.day}`"
        class="calendar-day"
        :class="{
          'today': dayInfo.isToday,
          'other-month': !dayInfo.isCurrentMonth,
          'has-tasks': dayInfo.hasTasks,
          'selected': selectedDate && isSameDay(selectedDate, dayInfo.date)
        }"
        @click="selectDay(dayInfo.date)"
      >
        {{ dayInfo.day }}
        <div v-if="dayInfo.hasTasks" class="task-dot"></div>
      </div>
    </div>
    
    <!-- Task Panel -->
    <div class="task-panel">
      <div class="task-panel-header">
        <div class="task-panel-title">{{ selectedDateDisplay }}</div>
        <button class="add-task-btn" @click="showCreateTaskModal = true">
          <font-awesome-icon icon="plus" />
          添加任务
        </button>
      </div>
      
      <div v-if="isLoading" class="loading-container">
        <font-awesome-icon icon="spinner" spin class="loading-icon" />
        <div>加载中...</div>
      </div>
      
      <div v-else-if="tasksForSelectedDate.length > 0" class="task-list">
        <div 
          v-for="(task, index) in tasksForSelectedDate" 
          :key="task._id || task.id"
          class="task-list-item"
          :style="{ '--index': index }"
          @click="openTaskDetail(task)"
        >
          <div class="task-status">
            <input 
              type="checkbox" 
              :checked="task.completed"
              @click.stop="toggleTaskStatus(task)"
            />
          </div>
          
          <div class="task-content">
            <div class="task-name" :class="{ 'completed': task.completed }">
              {{ task.name }}
            </div>
            
            <div class="task-meta">
              <span class="task-group" v-if="task.groupId && task.groupId.name">
                {{ task.groupId.name }}
              </span>
              
              <span class="priority-badge" :class="getPriorityClass(task.priority)">
                {{ getPriorityText(task.priority) }}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div v-else class="no-tasks">
        <font-awesome-icon icon="calendar-day" class="no-tasks-icon" />
        <div>{{ selectedDate && isSameDay(selectedDate, new Date()) ? '今天' : '这天' }}没有任务</div>
        <button class="btn btn-primary add-task-empty" @click="showCreateTaskModal = true">
          <font-awesome-icon icon="plus" />
          添加任务
        </button>
      </div>
    </div>
    
    <!-- Task Create Modal -->
    <Teleport to="body">
      <div v-if="showCreateTaskModal" class="modal-overlay" @click="closeCreateModal">
        <div class="modal-container" @click.stop>
          <CalendarCreateTask 
            :selectedDate="selectedDate"
            @close="closeCreateModal"
            @task-created="handleTaskCreated"
          />
        </div>
      </div>
    </Teleport>
    
    <!-- Task Detail Modal -->
    <Teleport to="body">
      <div v-if="selectedTask" class="modal-overlay" @click="closeTaskDetail">
        <div class="modal-container" @click.stop>
          <CalendarTaskDetail 
            :task="selectedTask"
            @close="closeTaskDetail"
            @update:task="handleTaskUpdated"
            @delete:task="handleTaskDeleted"
          />
        </div>
      </div>
    </Teleport>
  </BaseLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import BaseLayout from '../components/layout/BaseLayout.vue';
import CalendarCreateTask from '../components/calendar/CalendarCreateTask.vue';
import CalendarTaskDetail from '../components/calendar/CalendarTaskDetail.vue';
import { getCalendarTasks, updateCalendarTask } from '../api/calendar';

// Calendar data
const currentDate = ref(new Date());
const selectedDate = ref(new Date());

// Tasks state
const tasks = ref([]);
const isLoading = ref(false);
const selectedTask = ref(null);
const showCreateTaskModal = ref(false);

// Weekdays
const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

// Helper functions
const isSameDay = (date1, date2) => {
  return date1.getDate() === date2.getDate() && 
         date1.getMonth() === date2.getMonth() && 
         date1.getFullYear() === date2.getFullYear();
};

const formatDate = (date) => {
  return date.toISOString().split('T')[0];
};

// 给定日期是否有任务
const hasTasksOnDate = (date) => {
  return tasks.value.some(task => {
    const taskDate = new Date(task.dueDate);
    return isSameDay(taskDate, date);
  });
};

// Display formatted strings
const currentMonthDisplay = computed(() => {
  return `${currentDate.value.getFullYear()}年${currentDate.value.getMonth() + 1}月`;
});

const selectedDateDisplay = computed(() => {
  return `${selectedDate.value.getFullYear()}年${selectedDate.value.getMonth() + 1}月${selectedDate.value.getDate()}日`;
});

// Calendar days calculation
const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth();
  
  // 月份的第一天是星期几 (0 = 星期日, 1 = 星期一, etc.)
  const firstDay = new Date(year, month, 1).getDay();
  
  // 这个月有多少天
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  // 上个月的天数
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  
  const days = [];
  
  // 添加上个月的日期
  for (let i = 0; i < firstDay; i++) {
    const day = daysInPrevMonth - firstDay + i + 1;
    const date = new Date(year, month - 1, day);
    days.push({
      day,
      month: month - 1,
      isCurrentMonth: false,
      isToday: isSameDay(date, new Date()),
      hasTasks: hasTasksOnDate(date),
      date
    });
  }
  
  // 添加当前月的日期
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month, i);
    days.push({
      day: i,
      month,
      isCurrentMonth: true,
      isToday: isSameDay(date, new Date()),
      hasTasks: hasTasksOnDate(date),
      date
    });
  }
  
  // 计算剩余的单元格 (最多 6 行 x 7 天 = 42 格)
  const remainingCells = 42 - days.length;
  
  // 添加下个月的日期
  for (let i = 1; i <= remainingCells; i++) {
    const date = new Date(year, month + 1, i);
    days.push({
      day: i,
      month: month + 1,
      isCurrentMonth: false,
      isToday: isSameDay(date, new Date()),
      hasTasks: hasTasksOnDate(date),
      date
    });
  }
  
  return days;
});

// 当前选择日期的任务
const tasksForSelectedDate = computed(() => {
  if (!selectedDate.value) return [];
  
  return tasks.value.filter(task => {
    const taskDate = new Date(task.dueDate);
    return isSameDay(taskDate, selectedDate.value);
  });
});

// 加载月份任务数据
const loadMonthTasks = async () => {
  try {
    isLoading.value = true;
    
    // 获取当前月的第一天和最后一天
    const year = currentDate.value.getFullYear();
    const month = currentDate.value.getMonth();
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);
    
    const params = {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate)
    };
    
    console.log(`加载 ${startDate.toLocaleDateString()} 到 ${endDate.toLocaleDateString()} 的任务`);
    
    tasks.value = await getCalendarTasks(params);
  } catch (error) {
    console.error('加载任务失败:', error);
  } finally {
    isLoading.value = false;
  }
};

// 日历导航
const previousMonth = () => {
  currentDate.value = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() - 1,
    1
  );
};

const nextMonth = () => {
  currentDate.value = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() + 1,
    1
  );
};

// 选择日期
const selectDay = (date) => {
  selectedDate.value = date;
};

// 打开任务详情
const openTaskDetail = (task) => {
  selectedTask.value = task;
};

// 关闭任务详情
const closeTaskDetail = () => {
  selectedTask.value = null;
};

// 关闭创建任务模态框
const closeCreateModal = () => {
  showCreateTaskModal.value = false;
};

// 优先级样式
const getPriorityClass = (priority) => {
  switch (priority) {
    case 'high': return 'priority-high';
    case 'medium': return 'priority-medium';
    case 'low': return 'priority-low';
    default: return 'priority-medium';
  }
};

// 优先级文本
const getPriorityText = (priority) => {
  switch (priority) {
    case 'high': return '高';
    case 'medium': return '中';
    case 'low': return '低';
    default: return '中';
  }
};

// 切换任务状态
const toggleTaskStatus = async (task) => {
  try {
    const taskId = task._id || task.id;
    const updateData = {
      completed: !task.completed
    };
    
    const updatedTask = await updateCalendarTask(taskId, updateData);
    
    // 更新本地任务列表
    const index = tasks.value.findIndex(t => (t._id || t.id) === taskId);
    if (index !== -1) {
      tasks.value[index] = updatedTask;
    }
  } catch (error) {
    console.error('更新任务状态失败:', error);
  }
};

// 处理任务创建事件
const handleTaskCreated = (newTask) => {
  tasks.value.push(newTask);
};

// 处理任务更新事件
const handleTaskUpdated = (updatedTask) => {
  const taskId = updatedTask._id || updatedTask.id;
  const index = tasks.value.findIndex(task => (task._id || task.id) === taskId);
  
  if (index !== -1) {
    tasks.value[index] = updatedTask;
  }
};

// 处理任务删除事件
const handleTaskDeleted = (taskId) => {
  tasks.value = tasks.value.filter(task => (task._id || task.id) !== taskId);
};

// 当月份改变时重新加载任务
watch(() => currentDate.value, (newDate) => {
  loadMonthTasks();
});

// 页面加载时初始化
onMounted(() => {
  // 选择今天
  selectDay(new Date());
  
  // 加载当前月份的任务
  loadMonthTasks();
});
</script>

<style scoped>
/* Calendar header */
.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  font-weight: 600;
  font-size: 20px;
}

.calendar-nav {
  color: var(--app-primary);
  cursor: pointer;
  padding: 8px;
  transition: all 0.2s ease;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.calendar-nav:active {
  transform: scale(0.9);
  background-color: rgba(0, 122, 255, 0.1);
}

/* Calendar weekdays */
.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  font-size: 12px;
  color: var(--app-gray);
  font-weight: 600;
  padding: 8px 16px;
}

/* Calendar days */
.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  padding: 0 16px 16px;
  gap: 8px;
}

.calendar-day {
  aspect-ratio: 1/1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  font-size: 17px;
  border-radius: 50%;
  position: relative;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  animation: fadeIn 0.3s ease forwards;
}

.calendar-day:active {
  transform: scale(0.9);
}

.calendar-day.today {
  background-color: var(--app-primary);
  color: white;
}

.task-dot {
  position: absolute;
  bottom: 6px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--app-primary);
}

.calendar-day.today .task-dot {
  background-color: white;
}

.calendar-day.selected {
  background-color: rgba(0, 122, 255, 0.1);
  border: 1px solid var(--app-primary);
}

.calendar-day.other-month {
  color: var(--app-gray);
  opacity: 0.5;
}

/* Task panel */
.task-panel {
  background-color: white;
  border-radius: 16px 16px 0 0;
  margin-top: 16px;
  padding: 20px 16px;
  flex: 1;
  overflow-y: auto;
  box-shadow: var(--app-shadow);
}

.task-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.task-panel-title {
  font-weight: 600;
  font-size: 18px;
}

.add-task-btn {
  background-color: var(--app-primary);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
}

.task-list-item {
  display: flex;
  padding: 16px 0;
  border-bottom: 1px solid var(--app-border);
  animation: fadeIn 0.3s ease forwards;
  animation-delay: calc(var(--index) * 0.1s);
  opacity: 0;
  cursor: pointer;
}

.task-list-item:last-child {
  border-bottom: none;
}

.task-status {
  margin-right: 12px;
}

.task-content {
  flex: 1;
}

.task-name {
  font-weight: 600;
  margin-bottom: 6px;
}

.task-name.completed {
  text-decoration: line-through;
  color: var(--app-gray);
}

.task-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.task-group {
  color: var(--app-primary);
  font-weight: 500;
}

.priority-badge {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.priority-high {
  background-color: #FF2D55;
  color: white;
}

.priority-medium {
  background-color: #FF9500;
  color: white;
}

.priority-low {
  background-color: #30B650;
  color: white;
}

.no-tasks {
  text-align: center;
  padding: 32px 0;
  color: var(--app-gray);
  font-size: 16px;
  animation: fadeIn 0.5s ease forwards;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.no-tasks-icon {
  font-size: 32px;
  opacity: 0.5;
}

.add-task-empty {
  margin-top: 16px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: var(--app-gray);
}

.loading-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-container {
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  border-radius: 16px;
}

.btn {
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  border: none;
}

.btn-primary {
  background-color: var(--app-primary);
  color: white;
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .task-panel {
    background-color: #2C2C2E;
  }
  
  .calendar-day.selected {
    background-color: rgba(10, 132, 255, 0.2);
  }
  
  .task-list-item {
    border-color: var(--app-border);
  }
  
  .modal-overlay {
    background-color: rgba(0, 0, 0, 0.7);
  }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style> 