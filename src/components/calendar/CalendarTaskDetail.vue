<template>
  <div class="task-detail-modal" v-if="task">
    <div class="modal-header">
      <h3>任务详情</h3>
      <button class="close-btn" @click="$emit('close')">
        <font-awesome-icon icon="times" />
      </button>
    </div>
    
    <div class="modal-body">
      <div v-if="!isEditing" class="task-view">
        <div class="task-info">
          <div class="task-name">{{ task.name }}</div>
          <div class="task-group">{{ task.groupId?.name || '未分组' }}</div>
          <div class="task-date">截止日期: {{ formatDate(task.dueDate) }}</div>
          
          <div class="task-attributes">
            <div class="attribute">
              <span class="attribute-label">优先级:</span>
              <span class="priority-badge" :class="priorityClass">
                {{ priorityText }}
              </span>
            </div>
            
            <div class="attribute">
              <span class="attribute-label">重要性:</span>
              <span :class="{ 'attribute-active': task.isImportant }">
                {{ task.isImportant ? '重要' : '不重要' }}
              </span>
            </div>
            
            <div class="attribute">
              <span class="attribute-label">紧急性:</span>
              <span :class="{ 'attribute-active': task.isUrgent }">
                {{ task.isUrgent ? '紧急' : '不紧急' }}
              </span>
            </div>
            
            <div class="attribute">
              <span class="attribute-label">状态:</span>
              <span :class="{ 'attribute-active': task.completed }">
                {{ task.completed ? '已完成' : '未完成' }}
              </span>
            </div>
          </div>
        </div>
        
        <div class="task-actions">
          <button class="btn btn-primary" @click="startEdit">
            <font-awesome-icon icon="edit" /> 编辑
          </button>
          
          <button 
            class="btn" 
            :class="task.completed ? 'btn-warning' : 'btn-success'"
            @click="toggleTaskStatus"
          >
            <font-awesome-icon :icon="task.completed ? 'undo' : 'check'" />
            {{ task.completed ? '标记为未完成' : '标记为已完成' }}
          </button>
          
          <button class="btn btn-danger" @click="confirmDelete">
            <font-awesome-icon icon="trash" /> 删除
          </button>
        </div>
      </div>
      
      <div v-else class="task-edit">
        <div class="form-group">
          <label for="task-name">任务名称</label>
          <input 
            type="text" 
            id="task-name" 
            v-model="editedTask.name" 
            class="form-control"
            required
          />
        </div>
        
        <div class="form-group">
          <label for="task-priority">优先级</label>
          <select id="task-priority" v-model="editedTask.priority" class="form-control">
            <option value="high">高</option>
            <option value="medium">中</option>
            <option value="low">低</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="task-due-date">截止日期</label>
          <input 
            type="date" 
            id="task-due-date" 
            v-model="formattedDueDate" 
            class="form-control"
          />
        </div>
        
        <div class="form-group checkbox-group">
          <div class="checkbox-item">
            <input type="checkbox" id="task-important" v-model="editedTask.isImportant" />
            <label for="task-important">重要</label>
          </div>
          
          <div class="checkbox-item">
            <input type="checkbox" id="task-urgent" v-model="editedTask.isUrgent" />
            <label for="task-urgent">紧急</label>
          </div>
          
          <div class="checkbox-item">
            <input type="checkbox" id="task-completed" v-model="editedTask.completed" />
            <label for="task-completed">已完成</label>
          </div>
        </div>
        
        <div class="edit-actions">
          <button class="btn btn-primary" @click="saveTask">
            <font-awesome-icon icon="save" /> 保存
          </button>
          
          <button class="btn btn-secondary" @click="cancelEdit">
            <font-awesome-icon icon="times" /> 取消
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { updateCalendarTask, deleteCalendarTask } from '../../api/calendar';

const props = defineProps({
  task: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['close', 'update:task', 'delete:task']);

// State
const isEditing = ref(false);
const editedTask = ref({});

// 优先级显示
const priorityClass = computed(() => {
  const priority = props.task.priority;
  return {
    'priority-high': priority === 'high',
    'priority-medium': priority === 'medium',
    'priority-low': priority === 'low'
  };
});

const priorityText = computed(() => {
  const priority = props.task.priority;
  switch(priority) {
    case 'high': return '高';
    case 'medium': return '中';
    case 'low': return '低';
    default: return '中';
  }
});

// 编辑表单相关
const formattedDueDate = computed({
  get() {
    if (!editedTask.value.dueDate) return '';
    return new Date(editedTask.value.dueDate).toISOString().split('T')[0];
  },
  set(newValue) {
    // 保持时间部分不变，只更新日期部分
    const currentDate = editedTask.value.dueDate 
      ? new Date(editedTask.value.dueDate) 
      : new Date();
    
    const [year, month, day] = newValue.split('-').map(Number);
    currentDate.setFullYear(year, month - 1, day);
    
    editedTask.value.dueDate = currentDate.toISOString();
  }
});

// 格式化日期显示
const formatDate = (dateString) => {
  if (!dateString) return '无';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 开始编辑
const startEdit = () => {
  editedTask.value = JSON.parse(JSON.stringify(props.task));
  isEditing.value = true;
};

// 取消编辑
const cancelEdit = () => {
  isEditing.value = false;
};

// 保存任务
const saveTask = async () => {
  try {
    const taskId = props.task._id || props.task.id;
    const updatedTask = await updateCalendarTask(taskId, editedTask.value);
    
    emit('update:task', updatedTask);
    isEditing.value = false;
  } catch (error) {
    console.error('保存任务失败:', error);
    // 这里可以添加错误处理逻辑，例如显示错误提示
  }
};

// 切换任务状态（完成/未完成）
const toggleTaskStatus = async () => {
  try {
    const taskId = props.task._id || props.task.id;
    const updateData = {
      completed: !props.task.completed
    };
    
    const updatedTask = await updateCalendarTask(taskId, updateData);
    emit('update:task', updatedTask);
  } catch (error) {
    console.error('更新任务状态失败:', error);
  }
};

// 确认删除
const confirmDelete = async () => {
  if (confirm('确定要删除这个任务吗？此操作不可恢复。')) {
    try {
      const taskId = props.task._id || props.task.id;
      await deleteCalendarTask(taskId);
      emit('delete:task', taskId);
      emit('close');
    } catch (error) {
      console.error('删除任务失败:', error);
    }
  }
};
</script>

<style scoped>
.task-detail-modal {
  background-color: white;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
  padding: 24px;
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.modal-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: var(--app-gray);
}

.task-info {
  margin-bottom: 24px;
}

.task-name {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 8px;
}

.task-group {
  font-size: 16px;
  color: var(--app-primary);
  margin-bottom: 16px;
}

.task-date {
  font-size: 14px;
  color: var(--app-gray);
  margin-bottom: 16px;
}

.task-attributes {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.attribute {
  display: flex;
  align-items: center;
  gap: 8px;
}

.attribute-label {
  font-weight: 500;
  color: var(--app-gray);
}

.priority-badge {
  padding: 4px 8px;
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

.attribute-active {
  color: var(--app-primary);
  font-weight: 600;
}

.task-actions {
  display: flex;
  gap: 8px;
  margin-top: 24px;
  justify-content: flex-end;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
}

.form-control {
  width: 100%;
  padding: 10px;
  border: 1px solid var(--app-border);
  border-radius: 8px;
  font-size: 16px;
}

.checkbox-group {
  display: flex;
  gap: 16px;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
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

.btn-secondary {
  background-color: #F2F2F7;
  color: var(--app-text);
}

.btn-success {
  background-color: #30B650;
  color: white;
}

.btn-warning {
  background-color: #FF9500;
  color: white;
}

.btn-danger {
  background-color: #FF2D55;
  color: white;
}

/* 深色模式 */
@media (prefers-color-scheme: dark) {
  .task-detail-modal {
    background-color: #2C2C2E;
    color: white;
  }
  
  .btn-secondary {
    background-color: #3A3A3C;
    color: white;
  }
  
  .form-control {
    background-color: #1C1C1E;
    border-color: #3A3A3C;
    color: white;
  }
}
</style> 