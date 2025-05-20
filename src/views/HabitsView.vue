<template>
  <div class="habits-container">
    <!-- Loading indicator -->
    <div v-if="habitsStore.isLoading" class="habits-loading">
      <div class="loading-spinner"></div>
      <p>加载习惯中...</p>
    </div>
    
    <!-- Error message -->
    <div v-else-if="habitsStore.error" class="habits-error">
      <p>{{ habitsStore.error }}</p>
      <button @click="habitsStore.init">重试</button>
    </div>
    
    <!-- Content when loaded -->
    <template v-else>
      <!-- Header with title, tags, and count -->
      <HabitHeader
        :title="habitsStore.headerTitle"
        :count="habitsStore.headerCount"
        :tags="habitsStore.headerTags"
        :streak="habitsStore.headerStreak"
        @increase="habitsStore.increaseCount"
        @decrease="habitsStore.decreaseCount"
      />
      
      <!-- Main content with habit grid -->
      <main class="habits-content">
        <div v-if="habitsStore.habits.length === 0" class="habits-empty">
          <p>您还没有添加任何习惯</p>
          <button @click="openAddModal" class="add-habit-btn">添加第一个习惯</button>
        </div>
        
        <HabitGrid
          v-else
          :habits="habitsStore.habits"
          :selectedHabitIndex="habitsStore.selectedHabitIndex"
          @select-habit="habitsStore.selectHabit"
          @toggle-complete="handleToggleComplete"
          @toggle-style="habitsStore.toggleHabitStyle"
          @delete-habit="habitsStore.deleteHabit"
          @edit-habit="openEditModal"
        />
      </main>
      
      <!-- Floating add button -->
      <FloatingButton
        @click="openAddModal"
      />
      
      <!-- Add habit modal -->
      <AddHabitModal
        :visible="isAddModalVisible"
        :tags="habitsStore.tags"
        @close="closeAddModal"
        @add-habit="addHabit"
      />
      
      <!-- Edit habit modal -->
      <AddHabitModal
        :visible="isEditModalVisible"
        :tags="habitsStore.tags"
        :edit-mode="true"
        :habit-to-edit="habitToEdit"
        @close="closeEditModal"
        @update-habit="updateHabit"
      />
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useHabitsStore } from '@/stores/habitsStore';
import HabitHeader from '@/components/habits/HabitHeader.vue';
import HabitGrid from '@/components/habits/HabitGrid.vue';
import FloatingButton from '@/components/habits/FloatingButton.vue';
import AddHabitModal from '@/components/habits/AddHabitModal.vue';
import { getCurrentUserFresh } from '@/api/auth';
import { getAudioUrlByUserId } from '@/api/cosyVoice';
import '@/components/habits/HabitsGlobalStyles.css';

// Initialize the habits store
const habitsStore = useHabitsStore();

// Add modal visibility
const isAddModalVisible = ref(false);
const isEditModalVisible = ref(false);
const habitToEdit = ref(null);

// Methods for modal control
const openAddModal = () => {
  isAddModalVisible.value = true;
};

const closeAddModal = () => {
  isAddModalVisible.value = false;
};

const openEditModal = (habitId) => {
  const habit = habitsStore.habits.find(h => h._id === habitId);
  if (habit) {
    habitToEdit.value = habit;
    isEditModalVisible.value = true;
  }
};

const closeEditModal = () => {
  isEditModalVisible.value = false;
  habitToEdit.value = null;
};

// Method to add a habit through the store
const addHabit = async (habitData) => {
  try {
    await habitsStore.addHabit(habitData);
    closeAddModal();
  } catch (error) {
    console.error('添加习惯失败:', error);
    // You might want to show an error message to the user
  }
};

// Method to update a habit through the store
const updateHabit = async (habitData) => {
  try {
    await habitsStore.updateHabit(habitData._id, habitData);
    closeEditModal();
  } catch (error) {
    console.error('更新习惯失败:', error);
  }
};

// Handle toggle complete with audio feedback
const handleToggleComplete = async (habitId, isComplete) => {
  try {
    await habitsStore.toggleComplete(habitId);
    
    // Play encouraging audio feedback if habit is marked as complete
    if (isComplete) {
      console.log('Playing encouraging audio for completed habit');
      const user = await getCurrentUserFresh();
      const userId = user && (user._id || user.id);
      if (userId) {
        const url = await getAudioUrlByUserId(userId, 'encourage');
        if (url) {
          const audioElement = new Audio(url);
          audioElement.volume = 0.9;
          audioElement.preload = 'auto';
          audioElement.play();
        }
      }
    }
  } catch (error) {
    console.error('切换习惯状态失败:', error);
  }
};

// Fetch habits on mount
onMounted(() => {
  console.log('HabitsView 组件已挂载，初始化习惯数据...');
  habitsStore.init();
});
</script>

<style scoped>
.habits-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  max-height: 100vh;
  background-color: #f8f7f4;
  padding-bottom: 80px; /* Space for navigation */
  overflow: hidden; /* Prevent overall page scrolling */
}

.habits-content {
  flex: 1;
  padding: 0 16px 16px;
  overflow-y: auto; /* Add vertical scrolling */
  -webkit-overflow-scrolling: touch; /* Smooth scrolling on iOS */
  scrollbar-width: thin; /* For Firefox */
  scrollbar-color: #d4d4d8 transparent; /* For Firefox */
}

/* Loading state styling */
.habits-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 30vh;
  margin-top: 50px;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-top-color: #3b82f6;
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Error state styling */
.habits-error {
  text-align: center;
  color: #ef4444;
  padding: 24px;
  margin-top: 50px;
}

.habits-error button {
  background-color: #3b82f6;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  margin-top: 16px;
  cursor: pointer;
}

/* Empty state styling */
.habits-empty {
  text-align: center;
  padding: 40px 16px;
}

.add-habit-btn {
  margin-top: 16px;
  background-color: #3b82f6;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
}

/* Custom scrollbar styling for WebKit browsers */
.habits-content::-webkit-scrollbar {
  width: 6px;
}

.habits-content::-webkit-scrollbar-track {
  background: transparent;
}

.habits-content::-webkit-scrollbar-thumb {
  background-color: #d4d4d8;
  border-radius: 6px;
}

/* Global transitions for habit count changes */
.count-transition-enter-active,
.count-transition-leave-active {
  transition: all 0.2s cubic-bezier(0.25, 1.25, 0.5, 1);
}

.count-transition-enter-from,
.count-transition-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* Media query adjustments for smaller screens */
@media (max-height: 600px) {
  .habits-container {
    padding-bottom: 60px;
  }
  
  .habits-content {
    padding: 0 12px 12px;
  }
}
</style>
