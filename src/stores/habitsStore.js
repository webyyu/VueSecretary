import { defineStore } from 'pinia';
import { ref, computed, onMounted } from 'vue';
import { 
  getAllHabits, 
  getHabitTags, 
  createHabit, 
  updateHabit,
  completeHabit,
  uncompleteHabit,
  deleteHabit
} from '@/api/habits';

export const useHabitsStore = defineStore('habits', () => {
  // State
  const habits = ref([]);
  const isLoading = ref(false);
  const error = ref(null);
  const selectedHabitIndex = ref(-1);
  const totalCount = ref(0);
  const tags = ref([]);
  
  // Getters (computed)
  const selectedHabit = computed(() => {
    if (selectedHabitIndex.value >= 0 && selectedHabitIndex.value < habits.value.length) {
      return habits.value[selectedHabitIndex.value];
    }
    return null;
  });
  
  const headerTitle = computed(() => {
    return selectedHabit.value ? selectedHabit.value.name : '选择或添加一个习惯';
  });
  
  const headerCount = computed(() => {
    return selectedHabit.value ? selectedHabit.value.completionCount : totalCount.value;
  });
  
  const headerTags = computed(() => {
    if (selectedHabit.value && selectedHabit.value.tags) {
      return selectedHabit.value.tags.map(tag => ({ 
        value: tag, 
        label: tag, 
        type: getTagType(tag) 
      }));
    }
    return [{ value: 'default', label: '无需备注', type: 'green' }];
  });
  
  const headerStreak = computed(() => {
    return selectedHabit.value ? (selectedHabit.value.streak || 0) : 0;
  });

  // Helper function to determine tag type
  function getTagType(tag) {
    if (tag === 'bad' || tag === 'negative') return 'red';
    if (tag === 'entertainment' || tag === 'fun' || tag === 'leisure') return 'orange';
    if (tag === 'health' || tag === 'study' || tag === 'personal') return 'green';
    if (tag === 'work') return 'blue';
    if (tag === '阅读') return 'purple';
    return 'green'; // Default
  }
  
  // Helper function to check if habit has "阅读" tag
  function hasReadingTag(habit) {
    return habit.tags && habit.tags.some(tag => tag === '阅读');
  }
  
  // Helper function to check if reading habit can be increased
  function canIncreaseReadingHabit(habit) {
    return !hasReadingTag(habit) || habit.completionCount < 1;
  }
  
  // Actions
  async function fetchHabits() {
    try {
      isLoading.value = true;
      error.value = null;
      console.log('正在获取习惯数据...');
      
      const response = await getAllHabits();
      console.log('获取习惯响应:', response);
      
      habits.value = response.data.data || [];
      
      // Add UI-specific properties to each habit
      habits.value.forEach(habit => {
        habit.isDark = habit.color === '#1f2937';
        habit.iconType = habit.completedToday ? 'check' : 'plus';
        
        // Ensure we have a valid FontAwesome icon, never use default-habit-icon
        if (!habit.icon || habit.icon.includes('/')) {
          // Assign an icon based on tags
          if (habit.tags && habit.tags.length > 0) {
            if (habit.tags.includes('阅读')) habit.icon = 'book';
            else if (habit.tags.includes('health') || habit.tags.includes('健康')) habit.icon = 'heart';
            else if (habit.tags.includes('study') || habit.tags.includes('学习')) habit.icon = 'graduation-cap';
            else if (habit.tags.includes('work') || habit.tags.includes('工作')) habit.icon = 'briefcase';
            else if (habit.tags.includes('entertainment') || habit.tags.includes('娱乐')) habit.icon = 'gamepad';
            else habit.icon = 'star';
          } else {
            habit.icon = 'star'; // Default to a star icon
          }
        }
      });
      
      // Calculate total completion count
      totalCount.value = habits.value.reduce((sum, habit) => sum + (habit.completionCount || 0), 0);
      
      console.log(`成功获取 ${habits.value.length} 个习惯`);
    } catch (err) {
      console.error('获取习惯失败:', err);
      error.value = err.message || '获取习惯失败';
    } finally {
      isLoading.value = false;
    }
  }
  
  async function fetchTags() {
    try {
      console.log('正在获取习惯标签...');
      const response = await getHabitTags();
      console.log('获取标签响应:', response);
      
      tags.value = response.data.data || [];
      console.log(`成功获取 ${tags.value.length} 个标签`);
    } catch (err) {
      console.error('获取标签失败:', err);
    }
  }
  
  function selectHabit(index) {
    if (selectedHabitIndex.value === index) {
      selectedHabitIndex.value = -1;
    } else {
      selectedHabitIndex.value = index;
    }
  }
  
  async function increaseCount() {
    if (selectedHabit.value) {
      // 检查是否为阅读习惯且已经完成
      if (hasReadingTag(selectedHabit.value) && selectedHabit.value.completionCount >= 1) {
        console.log('阅读习惯已达到最大完成次数');
        return;
      }
      
      try {
        console.log(`正在完成习惯: ${selectedHabit.value._id}`);
        const response = await completeHabit(selectedHabit.value._id);
        console.log('完成习惯响应:', response);
        
        // Update the local state with the response data
        if (response.data.data) {
          const habitIndex = habits.value.findIndex(h => h._id === selectedHabit.value._id);
          if (habitIndex !== -1) {
            habits.value[habitIndex].completionCount = response.data.data.completionCount;
            habits.value[habitIndex].completedToday = response.data.data.completedToday;
            habits.value[habitIndex].streak = response.data.data.streak;
            habits.value[habitIndex].iconType = 'check';
            console.log('习惯完成次数已更新');
          }
        }
      } catch (err) {
        console.error('完成习惯失败:', err);
        error.value = err.message || '完成习惯失败';
      }
    } else {
      totalCount.value++;
    }
  }
  
  async function decreaseCount() {
    if (selectedHabit.value) {
      try {
        console.log(`正在取消完成习惯: ${selectedHabit.value._id}`);
        const response = await uncompleteHabit(selectedHabit.value._id);
        console.log('取消完成习惯响应:', response);
        
        // Update the local state with the response data
        if (response.data.data) {
          const habitIndex = habits.value.findIndex(h => h._id === selectedHabit.value._id);
          if (habitIndex !== -1) {
            habits.value[habitIndex].completionCount = response.data.data.completionCount;
            habits.value[habitIndex].completedToday = response.data.data.completedToday;
            habits.value[habitIndex].streak = response.data.data.streak;
            habits.value[habitIndex].iconType = 'plus';
            console.log('习惯完成次数已更新');
          }
        }
      } catch (err) {
        console.error('取消完成习惯失败:', err);
        error.value = err.message || '取消完成习惯失败';
      }
    } else if (totalCount.value > 0) {
      totalCount.value--;
    }
  }
  
  async function toggleComplete(index) {
    if (index >= 0 && index < habits.value.length) {
      const habit = habits.value[index];
      
      // 检查是否为阅读习惯且已经完成
      if (!habit.completedToday && hasReadingTag(habit) && habit.completionCount >= 1) {
        console.log('阅读习惯已达到最大完成次数');
        return;
      }
      
      try {
        if (habit.completedToday) {
          console.log(`正在取消完成习惯: ${habit._id}`);
          const response = await uncompleteHabit(habit._id);
          console.log('取消完成习惯响应:', response);
          
          if (response.data.data) {
            habit.completionCount = response.data.data.completionCount;
            habit.completedToday = response.data.data.completedToday;
            habit.streak = response.data.data.streak;
            habit.iconType = 'plus';
          }
        } else {
          console.log(`正在完成习惯: ${habit._id}`);
          const response = await completeHabit(habit._id);
          console.log('完成习惯响应:', response);
          
          if (response.data.data) {
            habit.completionCount = response.data.data.completionCount;
            habit.completedToday = response.data.data.completedToday;
            habit.streak = response.data.data.streak;
            habit.iconType = 'check';
          }
        }
        console.log('习惯完成状态已更新');
      } catch (err) {
        console.error('切换习惯完成状态失败:', err);
        error.value = err.message || '切换习惯完成状态失败';
      }
    }
  }
  
  function toggleHabitStyle(index) {
    if (index >= 0 && index < habits.value.length) {
      // This is just a UI state change, no need to update backend
      habits.value[index].isDark = !habits.value[index].isDark;
      
      // 更新后端颜色数据
      const newColor = habits.value[index].isDark ? '#1f2937' : '#4a69bd';
      updateHabitById(habits.value[index]._id, { color: newColor });
    }
  }
  
  async function addHabit(habitData) {
    try {
      console.log('正在创建新习惯:', habitData);
      const response = await createHabit(habitData);
      console.log('创建习惯响应:', response);
      
      const newHabit = response.data.data;
      
      // Add UI-specific properties
      newHabit.isDark = habitData.color === '#1f2937' || habitData.isDark;
      newHabit.iconType = 'plus';
      
      // Add the new habit to the array
      habits.value.push(newHabit);
      console.log('新习惯已添加');
      
      // Optionally select the new habit
      selectHabit(habits.value.length - 1);
      
      return newHabit;
    } catch (err) {
      console.error('创建习惯失败:', err);
      error.value = err.message || '创建习惯失败';
      throw err;
    }
  }
  
  async function updateHabitById(habitId, habitData) {
    try {
      console.log(`正在更新习惯 ${habitId}:`, habitData);
      const response = await updateHabit(habitId, habitData);
      console.log('更新习惯响应:', response);
      
      // Update the local habit
      const habitIndex = habits.value.findIndex(h => h._id === habitId);
      if (habitIndex !== -1) {
        const updatedHabit = response.data.data;
        // Preserve UI-specific properties
        updatedHabit.isDark = habitData.color === '#1f2937' || habitData.isDark || habits.value[habitIndex].isDark;
        updatedHabit.iconType = habits.value[habitIndex].completedToday ? 'check' : 'plus';
        
        habits.value[habitIndex] = updatedHabit;
        console.log('习惯已更新');
      }
      
      return response.data.data;
    } catch (err) {
      console.error('更新习惯失败:', err);
      error.value = err.message || '更新习惯失败';
      throw err;
    }
  }
  
  async function removeHabit(habitId) {
    try {
      console.log(`正在删除习惯: ${habitId}`);
      await deleteHabit(habitId);
      console.log('习惯已删除');
      
      // Remove from local array
      habits.value = habits.value.filter(h => h._id !== habitId);
      
      // Reset selection if deleted habit was selected
      if (selectedHabit.value && selectedHabit.value._id === habitId) {
        selectedHabitIndex.value = -1;
      }
    } catch (err) {
      console.error('删除习惯失败:', err);
      error.value = err.message || '删除习惯失败';
      throw err;
    }
  }
  
  // Initialize data
  function init() {
    fetchHabits();
    fetchTags();
  }
  
  // Run initialization
  init();
  
  return {
    // State
    habits,
    isLoading,
    error,
    selectedHabitIndex,
    totalCount,
    tags,
    
    // Getters
    selectedHabit,
    headerTitle,
    headerCount,
    headerTags,
    headerStreak,
    
    // Actions
    fetchHabits,
    fetchTags,
    selectHabit,
    increaseCount,
    decreaseCount,
    toggleComplete,
    toggleHabitStyle,
    addHabit,
    updateHabit: updateHabitById,
    deleteHabit: removeHabit,
    init,
    
    // Helper functions exposed for components
    hasReadingTag,
    canIncreaseReadingHabit
  };
}); 