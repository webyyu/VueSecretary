/**
 * 事件总线工具
 * 用于组件间通信，特别是统计数据更新
 */
import mitt from 'mitt';

const eventBus = mitt();

// 定义事件类型常量
export const EVENTS = {
  TASK_COMPLETED: 'task-completed',
  POMODORO_ADDED: 'pomodoro-added',
  STATS_UPDATED: 'stats-updated'
};

export default eventBus; 