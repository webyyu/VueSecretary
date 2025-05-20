<template>
  <div class="habit-grid">
    <HabitCard
      v-for="(habit, index) in habits"
      :key="habit._id"
      :title="habit.name"
      :count="habit.completionCount"
      :isDark="habit.isDark || false"
      :isCompleted="habit.completedToday"
      :isSelected="selectedHabitIndex === index"
      :streak="habit.streak || 0"
      :tags="habit.tags || []"
      :habit="habit"
      @select="selectHabit(index)"
      @toggle-complete="toggleComplete(index)"
      @toggle-style="toggleStyle(index)"
      @delete="deleteHabit(habit._id)"
      @edit="editHabit(habit._id)"
    />
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';
import HabitCard from './HabitCard.vue';

const props = defineProps({
  habits: {
    type: Array,
    required: true
  },
  selectedHabitIndex: {
    type: Number,
    default: -1
  }
});

const emit = defineEmits(['select-habit', 'toggle-complete', 'toggle-style', 'delete-habit', 'edit-habit']);

const selectHabit = (index) => {
  emit('select-habit', index);
};

const toggleComplete = (index) => {
  emit('toggle-complete', index);
};

const toggleStyle = (index) => {
  emit('toggle-style', index);
};

const deleteHabit = (habitId) => {
  if (confirm('确定要删除这个习惯吗？')) {
    emit('delete-habit', habitId);
  }
};

const editHabit = (habitId) => {
  emit('edit-habit', habitId);
};
</script>

<style scoped>
.habit-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 20px;
  padding: 4px 0;
}

@media (min-width: 640px) {
  .habit-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 768px) {
  .habit-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (min-width: 1024px) {
  .habit-grid {
    grid-template-columns: repeat(5, 1fr);
  }
}
</style> 