import './assets/main.css'
import './assets/css/variables.css'
import './debug.js' // Debug script for network monitoring
import { setupAxiosInterceptors } from './api-fixes/tasks-fix'
import { setupApiLogger } from './api/logger' // API logger for debugging
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import router from './router'
import App from './App.vue'


// Setup axios interceptors to handle 500 errors
setupAxiosInterceptors()

// Setup API logger
setupApiLogger()

// FontAwesome setup
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { fas } from '@fortawesome/free-solid-svg-icons'

// Custom directives
import { vDoubleTap } from './components/habits/doubleTap'

// Add additional icons
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';

library.add(fas)
library.add(faInfoCircle)

const app = createApp(App)

// Register components
app.component('font-awesome-icon', FontAwesomeIcon)

// Register directives
app.directive('double-tap', vDoubleTap)

app.use(createPinia())
app.use(ElementPlus)
app.use(router)

app.mount('#app')
