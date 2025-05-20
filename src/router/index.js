import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/login'
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/login.vue')
    },
    {
      path: '/tasks',
      name: 'tasks',
      component: () => import('../views/TasksView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/habits',
      name: 'habits',
      component: () => import('../views/HabitsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/ai-assistant',
      name: 'ai-assistant',
      component: () => import('../views/AIAssistantView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/calendar',
      name: 'calendar',
      component: () => import('../views/CalendarView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/stats',
      name: 'stats',
      component: () => import('../views/StatsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/stats/detail',
      name: 'stats-detail',
      component: () => import('../views/StatsDetailView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/voice-test',
      name: 'voice-test',
      component: () => import('../components/voicesetting/VoiceTest.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/stats-test',
      name: 'stats-test',
      component: () => import('../views/TestStatsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/stats-debug',
      name: 'stats-debug',
      component: () => import('../views/StatsTestView.vue'),
      meta: { requiresAuth: true }
    }
  ]
})

// Navigation guard for auth
router.beforeEach((to, from, next) => {
  const isAuthenticated = localStorage.getItem('user') !== null
  
  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login')
  } else {
    next()
  }
})

export default router 