<template>
  <BaseLayout title="统计">
    <!-- Today's Summary -->
    <div class="stat-card">
      <div class="stat-header">
        <div class="stat-title">今日概览</div>
        <div class="stat-action" @click="showDetailedStats">查看详情</div>
      </div>
      
      <div class="metric-cards">
        <div class="metric-card" style="--index: 0.5;">
          <div class="metric-icon text-primary">
            <font-awesome-icon icon="tasks" />
          </div>
          <div class="metric-value">{{ todayStats.completedTasks }}</div>
          <div class="metric-label">完成任务</div>
        </div>
        
        <div class="metric-card" style="--index: 0.7;">
          <div class="metric-icon text-purple">
            <font-awesome-icon icon="calendar-check" />
          </div>
          <div class="metric-value">{{ todayStats.habitCheckins }}</div>
          <div class="metric-label">习惯打卡</div>
        </div>
        
        <div class="metric-card" style="--index: 0.9;">
          <div class="metric-icon text-orange">
            <font-awesome-icon icon="clock" />
          </div>
          <div class="metric-value">{{ todayStats.focusTime }}h</div>
          <div class="metric-label">专注时间</div>
        </div>
      </div>
    </div>
    
    <!-- Weekly Trends -->
    <div class="stat-card">
      <div class="stat-header">
        <div class="stat-title">趋势</div>
        <div class="time-range">
          <div 
            v-for="option in timeRangeOptions" 
            :key="option.value"
            class="time-option" 
            :class="{ active: timeRange === option.value }"
            @click="changeTimeRange(option.value)"
          >
            {{ option.label }}
          </div>
        </div>
      </div>
      
      <div class="chart-container">
        <LineChart :data="trendChartData" :options="trendChartOptions" />
      </div>
      
      <div class="chart-legend">
        <div class="legend-item">
          <div class="legend-color" style="background-color: var(--app-primary);"></div>
          <div>任务</div>
        </div>
        <div class="legend-item">
          <div class="legend-color" style="background-color: #AF52DE;"></div>
          <div>习惯</div>
        </div>
        <div class="legend-item">
          <div class="legend-color" style="background-color: var(--app-warning);"></div>
          <div>专注</div>
        </div>
      </div>
    </div>
    
    <!-- Monthly Summary -->
    <div class="stat-card">
      <div class="stat-header">
        <div class="stat-title">月度汇总</div>
      </div>
      
      <div class="chart-container">
        <BarChart :data="monthlyChartData" :options="monthlyChartOptions" />
      </div>
    </div>
    
    <!-- Export Button -->
    <button class="export-button" @click="exportReport" :disabled="exportLoading">
      <font-awesome-icon v-if="!exportLoading" icon="download" class="btn-icon" />
      <font-awesome-icon v-else icon="spinner" class="btn-icon fa-spin" />
      {{ exportButtonText }}
    </button>
  </BaseLayout>
</template>

<script setup>
import { ref, computed, onMounted, reactive, watch, onActivated, onUnmounted } from 'vue';
import { Line as LineChart, Bar as BarChart } from 'vue-chartjs';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import BaseLayout from '../components/layout/BaseLayout.vue';
import { statsApi } from '../api';
import eventBus, { EVENTS } from '../utils/eventBus';
import { useRouter } from 'vue-router';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

// 初始化路由
const router = useRouter();

// Loading states
const todayLoading = ref(false);
const trendsLoading = ref(false);
const monthlySummaryLoading = ref(false);
const exportLoading = ref(false);
const exportButtonText = ref('导出统计报告');

// Today's statistics
const todayStats = ref({
  completedTasks: 0,
  habitCheckins: 0,
  focusTime: 0
});

// Time range selection
const timeRangeOptions = [
  { label: '周', value: 'week' },
  { label: '月', value: 'month' },
  { label: '年', value: 'year' }
];
const timeRange = ref('week');

// Trend chart data
const trendsData = ref({
  labels: [],
  datasets: []
});

// Monthly summary data
const monthlyData = ref({
  labels: ['任务完成率', '习惯坚持率', '专注效率'],
  actualData: [0, 0, 0]
});

// Chart data computations
const trendChartData = computed(() => {
  return {
    labels: trendsData.value.labels || [],
    datasets: [
      {
        label: '任务',
        data: trendsData.value.datasets?.[0]?.data || [],
        borderColor: '#007AFF',
        backgroundColor: 'rgba(0, 122, 255, 0.1)',
        tension: 0.3,
        fill: true
      },
      {
        label: '习惯',
        data: trendsData.value.datasets?.[1]?.data || [],
        borderColor: '#AF52DE',
        backgroundColor: 'rgba(175, 82, 222, 0.1)',
        tension: 0.3,
        fill: true
      },
      {
        label: '专注时间(小时)',
        data: trendsData.value.datasets?.[2]?.data || [],
        borderColor: '#FF9500',
        backgroundColor: 'rgba(255, 149, 0, 0.1)',
        tension: 0.3,
        fill: true
      }
    ]
  };
});

// Trend chart options
const trendChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      mode: 'index',
      intersect: false
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        display: false
      }
    },
    x: {
      grid: {
        display: false
      }
    }
  },
  animation: {
    duration: 1500,
    easing: 'easeOutQuart'
  }
};

// Monthly summary chart data
const monthlyChartData = computed(() => {
  return {
    labels: monthlyData.value.labels,
    datasets: [
      {
        label: '目标',
        data: [100, 100, 100],
        backgroundColor: 'rgba(142, 142, 147, 0.2)',
        borderRadius: 6
      },
      {
        label: '实际',
        data: monthlyData.value.actualData,
        backgroundColor: [
          '#007AFF',
          '#AF52DE',
          '#FF9500'
        ],
        borderRadius: 6
      }
    ]
  };
});

// Monthly chart options
const monthlyChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y',
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      callbacks: {
        label: function(context) {
          return context.dataset.label + ': ' + context.parsed.x + '%';
        }
      }
    }
  },
  scales: {
    x: {
      beginAtZero: true,
      max: 100,
      ticks: {
        callback: function(value) {
          return value + '%';
        }
      },
      grid: {
        display: false
      }
    },
    y: {
      grid: {
        display: false
      }
    }
  },
  animation: {
    duration: 1500,
    easing: 'easeOutQuart',
    delay: function(context) {
      return context.dataIndex * 300;
    }
  }
};

// Event handlers for task completion and Pomodoro sessions
const handleTaskCompleted = async (data) => {
  console.log('统计模块: 检测到任务完成状态变更，更新统计数据...', data);
  
  // 立即更新今日概览
  await fetchTodaySummary();
  
  // 如果当前显示的是周视图，也更新趋势数据
  if (timeRange.value === 'week') {
    await fetchTrends();
  }
  
  // 添加调试日志
  console.log('统计模块: 数据更新完成', {
    todayStats: todayStats.value,
    timeRange: timeRange.value
  });
};

const handlePomodoroAdded = async (data) => {
  console.log('统计模块: 检测到新的番茄钟会话，更新统计数据...', data);
  
  // 立即更新今日概览
  await fetchTodaySummary();
  
  // 如果当前显示的是周视图，也更新趋势数据
  if (timeRange.value === 'week') {
    await fetchTrends();
  }
  
  // 添加调试日志
  console.log('统计模块: 数据更新完成', {
    todayStats: todayStats.value,
    timeRange: timeRange.value
  });
};

// Setup event listeners
onMounted(() => {
  // Register event listeners
  eventBus.on(EVENTS.TASK_COMPLETED, handleTaskCompleted);
  eventBus.on(EVENTS.POMODORO_ADDED, handlePomodoroAdded);
  
  // Initial data fetch
  fetchTodaySummary();
  fetchTrends();
  fetchMonthlySummary();
});

// Clean up event listeners when component is unmounted
onUnmounted(() => {
  eventBus.off(EVENTS.TASK_COMPLETED, handleTaskCompleted);
  eventBus.off(EVENTS.POMODORO_ADDED, handlePomodoroAdded);
});

// Refresh data when the component is activated (e.g., when navigating back to this view)
onActivated(() => {
  console.log('Stats view activated, refreshing data...');
  fetchTodaySummary();
  fetchTrends();
});

// Fetch today's summary data with improved logging
const fetchTodaySummary = async () => {
  todayLoading.value = true;
  try {
    console.log('统计模块: 获取今日概览统计数据...');
    const data = await statsApi.getTodaySummary();
    todayStats.value = data;
    console.log('统计模块: 今日概览数据更新成功:', data);
    console.log('  - 完成任务数: ' + data.completedTasks);
    console.log('  - 习惯打卡数: ' + data.habitCheckins);
    console.log('  - 专注时间(小时): ' + data.focusTime);
  } catch (error) {
    console.error('统计模块: 获取今日概览失败:', error);
  } finally {
    todayLoading.value = false;
  }
};

// Fetch trends data with improved logging
const fetchTrends = async () => {
  trendsLoading.value = true;
  try {
    console.log(`统计模块: 获取${timeRange.value}趋势数据...`);
    const data = await statsApi.getTrends(timeRange.value);
    trendsData.value = data;
    console.log('统计模块: 趋势数据更新成功:', data);
  } catch (error) {
    console.error('统计模块: 获取趋势数据失败:', error);
  } finally {
    trendsLoading.value = false;
  }
};

// Fetch monthly summary data
const fetchMonthlySummary = async () => {
  monthlySummaryLoading.value = true;
  try {
    // 获取当前月份的YYYY-MM格式
    const now = new Date();
    const month = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    
    console.log(`获取${month}月度汇总数据...`);
    const data = await statsApi.getMonthlySummary(month);
    monthlyData.value = data;
    console.log('月度汇总数据:', data);
  } catch (error) {
    console.error('获取月度汇总失败:', error);
  } finally {
    monthlySummaryLoading.value = false;
  }
};

// Change time range and fetch new data
const changeTimeRange = (value) => {
  timeRange.value = value;
  fetchTrends();
};

// Export report
const exportReport = async () => {
  exportLoading.value = true;
  exportButtonText.value = '正在导出...';
  
  try {
    console.log('导出统计报告...');
    const result = await statsApi.exportReport();
    
    if (result.status === 'error') {
      // 处理尚未实现的情况
      console.warn('报告导出功能尚未实现:', result.message);
      
      // 显示反馈
      const button = document.querySelector('.export-button');
      if (button) {
        exportButtonText.value = '功能尚未实现';
        button.style.backgroundColor = 'var(--app-warning)';
        
        setTimeout(() => {
          exportButtonText.value = '导出统计报告';
          button.style.backgroundColor = '';
          exportLoading.value = false;
        }, 2000);
      }
    } else {
      // 导出成功的处理逻辑
      exportButtonText.value = '报告已导出';
      const button = document.querySelector('.export-button');
      if (button) {
        button.style.backgroundColor = 'var(--app-success)';
        
        setTimeout(() => {
          exportButtonText.value = '导出统计报告';
          button.style.backgroundColor = '';
          exportLoading.value = false;
        }, 2000);
      }
    }
  } catch (error) {
    console.error('导出报告失败:', error);
    
    // 显示错误反馈
    exportButtonText.value = '导出失败';
    const button = document.querySelector('.export-button');
    if (button) {
      button.style.backgroundColor = 'var(--app-danger)';
      
      setTimeout(() => {
        exportButtonText.value = '导出统计报告';
        button.style.backgroundColor = '';
        exportLoading.value = false;
      }, 2000);
    }
  }
};

// Show detailed stats
const showDetailedStats = () => {
  console.log('查看详细统计信息');
  
  // 获取当前日期的YYYY-MM-DD格式
  const today = new Date();
  const formattedDate = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
  
  // 跳转到详情页面，并传递日期参数
  router.push({
    path: '/stats/detail',
    query: { date: formattedDate }
  });
};

// Watch for time range changes
watch(timeRange, () => {
  fetchTrends();
});
</script>

<style scoped>
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

.stat-card:nth-child(1) {
  --index: 0;
}

.stat-card:nth-child(2) {
  --index: 1;
}

.stat-card:nth-child(3) {
  --index: 2;
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

.stat-action {
  color: var(--app-primary);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.stat-action:active {
  transform: scale(0.95);
}

.time-range {
  display: flex;
  background-color: var(--app-light);
  border-radius: 8px;
  overflow: hidden;
}

.time-option {
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.time-option.active {
  background-color: white;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  font-weight: 600;
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

.chart-container {
  position: relative;
  margin: 20px 0;
  height: 200px;
  opacity: 0;
  animation: fadeIn 0.8s ease forwards;
  animation-delay: 0.2s;
}

.chart-legend {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 16px;
  opacity: 0;
  animation: fadeIn 0.8s ease forwards;
  animation-delay: 0.4s;
}

.legend-item {
  display: flex;
  align-items: center;
  font-size: 14px;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  margin-right: 6px;
}

.export-button {
  width: 100%;
  padding: 16px;
  background-color: var(--app-primary);
  color: white;
  border: none;
  border-radius: 12px;
  text-align: center;
  font-weight: 600;
  margin-top: 16px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  animation: fadeIn 0.8s ease forwards;
  animation-delay: 0.6s;
  opacity: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.export-button:active:not(:disabled) {
  transform: scale(0.98);
}

.export-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-icon {
  margin-right: 8px;
}

/* Responsive adjustments for small screens */
@media (max-width: 480px) {
  .metric-cards {
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  }
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .stat-card {
    background-color: #2C2C2E;
  }
  
  .metric-card {
    background-color: #3A3A3C;
  }
  
  .time-option.active {
    background-color: #3A3A3C;
  }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style> 