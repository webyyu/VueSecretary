<template>
  <div class="task-quadrant">
    <div class="quadrant-container">
      <!-- Important & Urgent -->
      <div class="quadrant q1">
        <div class="quadrant-header">
          <div class="quadrant-title">重要且紧急</div>
          <div class="quadrant-count">{{ filteredTasks.q1.length }}</div>
        </div>
        <div class="quadrant-tasks">
          <div 
            v-for="task in filteredTasks.q1"
            :key="task.id"
            class="quadrant-task-item"
            :class="{ 'completed': task.completed }"
            @click="$emit('task-clicked', task)"
          >
            <el-checkbox 
              v-model="task.completed" 
              @click.stop
              class="task-checkbox"
            />
            <div class="task-content">
              <div class="task-name">{{ task.name }}</div>
              <div class="task-group-label">{{ task.groupName }}</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Important & Not Urgent -->
      <div class="quadrant q2">
        <div class="quadrant-header">
          <div class="quadrant-title">重要不紧急</div>
          <div class="quadrant-count">{{ filteredTasks.q2.length }}</div>
        </div>
        <div class="quadrant-tasks">
          <div 
            v-for="task in filteredTasks.q2"
            :key="task.id"
            class="quadrant-task-item"
            :class="{ 'completed': task.completed }"
            @click="$emit('task-clicked', task)"
          >
            <el-checkbox 
              v-model="task.completed" 
              @click.stop
              class="task-checkbox"
            />
            <div class="task-content">
              <div class="task-name">{{ task.name }}</div>
              <div class="task-group-label">{{ task.groupName }}</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Not Important & Urgent -->
      <div class="quadrant q3">
        <div class="quadrant-header">
          <div class="quadrant-title">不重要但紧急</div>
          <div class="quadrant-count">{{ filteredTasks.q3.length }}</div>
        </div>
        <div class="quadrant-tasks">
          <div 
            v-for="task in filteredTasks.q3"
            :key="task.id"
            class="quadrant-task-item"
            :class="{ 'completed': task.completed }"
            @click="$emit('task-clicked', task)"
          >
            <el-checkbox 
              v-model="task.completed" 
              @click.stop
              class="task-checkbox"
            />
            <div class="task-content">
              <div class="task-name">{{ task.name }}</div>
              <div class="task-group-label">{{ task.groupName }}</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Not Important & Not Urgent -->
      <div class="quadrant q4">
        <div class="quadrant-header">
          <div class="quadrant-title">不重要不紧急</div>
          <div class="quadrant-count">{{ filteredTasks.q4.length }}</div>
        </div>
        <div class="quadrant-tasks">
          <div 
            v-for="task in filteredTasks.q4"
            :key="task.id"
            class="quadrant-task-item"
            :class="{ 'completed': task.completed }"
            @click="$emit('task-clicked', task)"
          >
            <el-checkbox 
              v-model="task.completed" 
              @click.stop
              class="task-checkbox"
            />
            <div class="task-content">
              <div class="task-name">{{ task.name }}</div>
              <div class="task-group-label">{{ task.groupName }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  tasks: {
    type: Array,
    required: true
  }
});

defineEmits(['task-clicked']);

// Helper function to determine task urgency based on due date
const isTaskUrgent = (task) => {
  if (!task.dueDate) return false;
  
  const now = new Date();
  const dueDate = new Date(task.dueDate);
  const diffTime = dueDate - now;
  const diffDays = diffTime / (1000 * 3600 * 24);
  
  return diffDays < 2; // Tasks due within 2 days are considered urgent
};

// Helper function to determine task importance based on priority
const isTaskImportant = (task) => {
  return task.priority === 'high';
};

// Filter tasks into quadrants
const filteredTasks = computed(() => {
  const result = {
    q1: [], // Important & Urgent
    q2: [], // Important & Not Urgent
    q3: [], // Not Important & Urgent
    q4: []  // Not Important & Not Urgent
  };
  
  props.tasks.forEach(task => {
    const important = isTaskImportant(task);
    const urgent = isTaskUrgent(task);
    
    if (important && urgent) {
      result.q1.push(task);
    } else if (important && !urgent) {
      result.q2.push(task);
    } else if (!important && urgent) {
      result.q3.push(task);
    } else {
      result.q4.push(task);
    }
  });
  
  return result;
});
</script>

<style scoped>
.task-quadrant {
  margin-bottom: 20px;
}

.quadrant-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(2, auto);
  gap: 16px;
}

.quadrant {
  background-color: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: var(--app-shadow);
  min-height: 150px;
  display: flex;
  flex-direction: column;
}

.quadrant-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.quadrant-title {
  font-weight: 600;
  font-size: 14px;
}

.quadrant-count {
  background-color: var(--app-light);
  border-radius: 12px;
  padding: 1px 8px;
  font-size: 12px;
  color: var(--app-gray);
}

.quadrant-tasks {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.quadrant-task-item {
  display: flex;
  align-items: center;
  padding: 8px;
  border-radius: 8px;
  transition: background-color 0.2s ease;
  cursor: pointer;
}

.quadrant-task-item:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

.quadrant-task-item.completed .task-name {
  text-decoration: line-through;
  color: var(--app-gray);
}

.task-checkbox {
  margin-right: 8px;
}

.task-content {
  flex: 1;
}

.task-name {
  font-size: 14px;
  margin-bottom: 2px;
}

.task-group-label {
  font-size: 12px;
  color: var(--app-gray);
}

/* Q1 - Important & Urgent */
.q1 {
  border-top: 3px solid var(--app-danger);
}

/* Q2 - Important & Not Urgent */
.q2 {
  border-top: 3px solid var(--app-warning);
}

/* Q3 - Not Important & Urgent */
.q3 {
  border-top: 3px solid var(--app-info);
}

/* Q4 - Not Important & Not Urgent */
.q4 {
  border-top: 3px solid var(--app-success);
}

/* Responsive design for small screens */
@media (max-width: 640px) {
  .quadrant-container {
    grid-template-columns: 1fr;
    grid-template-rows: repeat(4, auto);
  }
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .quadrant {
    background-color: #2C2C2E;
  }
  
  .quadrant-task-item:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }
}
</style> 