<template>
  <div class="base-layout">
    <AppHeader 
      :title="title" 
      :right-action="rightAction" 
      :right-action-icon="rightActionIcon"
      :left-action="leftAction"
      :left-action-icon="leftActionIcon"
      @right-action="$emit('right-action')"
      @left-action="$emit('left-action')"
    />
    <div class="content-area">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
import AppHeader from './AppHeader.vue';

defineProps({
  title: {
    type: String,
    required: true
  },
  rightAction: {
    type: Boolean,
    default: false
  },
  rightActionIcon: {
    type: String,
    default: 'plus'
  },
  leftAction: {
    type: Boolean,
    default: false
  },
  leftActionIcon: {
    type: String,
    default: 'chevron-left'
  }
});

defineEmits(['right-action', 'left-action']);
</script>

<style scoped>
.base-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
}

.content-area {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: var(--content-padding);
  padding-bottom: calc(var(--nav-height) + var(--content-padding));
}

@media (min-width: 768px) {
  .content-area {
    padding-bottom: var(--content-padding);
  }
}
</style> 