<template>
  <div class="create-task-modal">
    <div class="modal-header">
      <h3>创建新任务</h3>
      <button class="close-btn" @click="$emit('close')">
        <font-awesome-icon icon="times" />
      </button>
    </div>
    
    <div class="modal-body">
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="task-name">任务名称</label>
          <input 
            type="text" 
            id="task-name" 
            v-model="taskForm.name" 
            class="form-control"
            required
            placeholder="请输入任务名称"
          />
        </div>
        
        <div class="form-group">
          <label for="task-group">所属分组</label>
          <select 
            id="task-group" 
            v-model="taskForm.groupId" 
            class="form-control"
            required
          >
            <option value="" disabled>请选择分组</option>
            <option 
              v-for="group in taskGroups" 
              :key="group._id" 
              :value="group._id"
            >
              {{ group.name }}
            </option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="task-priority">优先级</label>
          <select id="task-priority" v-model="taskForm.priority" class="form-control">
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
            required
          />
        </div>
        
        <div class="form-group checkbox-group">
          <div class="checkbox-item">
            <input type="checkbox" id="task-important" v-model="taskForm.isImportant" />
            <label for="task-important">重要</label>
          </div>
          
          <div class="checkbox-item">
            <input type="checkbox" id="task-urgent" v-model="taskForm.isUrgent" />
            <label for="task-urgent">紧急</label>
          </div>
        </div>
        
        <div class="form-actions">
          <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
            <font-awesome-icon icon="plus" v-if="!isSubmitting" />
            <font-awesome-icon icon="spinner" spin v-else />
            {{ isSubmitting ? '创建中...' : '创建任务' }}
          </button>
          
          <button type="button" class="btn btn-secondary" @click="$emit('close')">
            取消
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { createCalendarTask } from '../../api/calendar';
import { getTaskGroups } from '../../api/tasks';

const emit = defineEmits(['close', 'task-created']);

const props = defineProps({
  selectedDate: {
    type: Date,
    default: () => new Date()
  }
});

// 表单状态
const taskForm = ref({
  name: '',
  groupId: '',
  priority: 'medium',
  dueDate: props.selectedDate.toISOString(),
  isImportant: false,
  isUrgent: false
});

const isSubmitting = ref(false);
const taskGroups = ref([]);

// 格式化日期
const formattedDueDate = computed({
  get() {
    if (!taskForm.value.dueDate) return '';
    return new Date(taskForm.value.dueDate).toISOString().split('T')[0];
  },
  set(newValue) {
    if (!newValue) return;
    
    const [year, month, day] = newValue.split('-').map(Number);
    const date = new Date(props.selectedDate);
    date.setFullYear(year, month - 1, day);
    
    taskForm.value.dueDate = date.toISOString();
  }
});

// 加载任务分组
const loadTaskGroups = async () => {
  try {
    const response = await getTaskGroups();
    taskGroups.value = response.data || [];
    
    // 如果有分组，默认选择第一个
    if (taskGroups.value.length > 0 && !taskForm.value.groupId) {
      taskForm.value.groupId = taskGroups.value[0]._id;
    }
  } catch (error) {
    console.error('获取任务分组失败:', error);
  }
};

// 提交表单
const handleSubmit = async () => {
  if (!taskForm.value.name || !taskForm.value.groupId) {
    alert('请填写任务名称和选择分组');
    return;
  }
  
  try {
    isSubmitting.value = true;
    
    const newTask = await createCalendarTask(taskForm.value);
    
    emit('task-created', newTask);
    emit('close');
  } catch (error) {
    console.error('创建任务失败:', error);
    alert('创建任务失败，请重试');
  } finally {
    isSubmitting.value = false;
  }
};

onMounted(() => {
  loadTaskGroups();
});
</script>

<style scoped>
.create-task-modal {
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

.form-actions {
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

.btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-primary {
  background-color: var(--app-primary);
  color: white;
}

.btn-secondary {
  background-color: #F2F2F7;
  color: var(--app-text);
}

/* 深色模式 */
@media (prefers-color-scheme: dark) {
  .create-task-modal {
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