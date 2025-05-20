import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import {
  faPlus,
  faMinus,
  faCheck,
  faTimes,
  faEdit,
  faTrash,
  faCamera,
  faFire,
  faBook,
  faRunning,
  faUtensils,
  faHeart,
  faStar,
  faBriefcase,
  faGraduationCap,
  faMusic,
  faGamepad,
  faBell,
  faExclamation,
  faSmile,
  faSadTear,
  faMoon,
  faSun,
  faClock,
  faDumbbell,
  faMedal,
  faTrophy,
  faPalette,
  faAppleAlt,
  faWater,
  // New icons for voice setting feature
  faCloudArrowUp,
  faFileAudio,
  faMicrophone,
  faMicrophoneAlt,
  faPlay,
  faPause,
  faArrowRight,
  faArrowLeft,
  faInfoCircle,
  faExclamationTriangle,
  faCheckCircle,
  faMagic,
  faDownload,
  faPlusCircle,
  faHistory,
  faSave,
  // Stats API icons
  faSpinner,
  faVial,
  faTasks,
  faCalendarCheck,
  // Stats debug icons
  faSync
} from '@fortawesome/free-solid-svg-icons';

// 添加需要的图标到库
library.add(
  faPlus,
  faMinus,
  faCheck,
  faTimes,
  faEdit,
  faTrash,
  faCamera,
  faFire,
  faBook,
  faRunning,
  faUtensils,
  faHeart, 
  faStar,
  faBriefcase,
  faGraduationCap,
  faMusic,
  faGamepad,
  faBell,
  faExclamation,
  faSmile,
  faSadTear,
  faMoon,
  faSun,
  faClock,
  faDumbbell,
  faMedal,
  faTrophy,
  faPalette,
  faAppleAlt,
  faWater,
  // New icons for voice setting feature
  faCloudArrowUp,
  faFileAudio,
  faMicrophone,
  faMicrophoneAlt,
  faPlay,
  faPause,
  faArrowRight,
  faArrowLeft,
  faInfoCircle,
  faExclamationTriangle,
  faCheckCircle,
  faMagic,
  faDownload,
  faPlusCircle,
  faHistory,
  faSave,
  // Stats API icons
  faSpinner,
  faVial,
  faTasks,
  faCalendarCheck,
  // Stats debug icons
  faSync
);

// 导出组件和图标列表
export { FontAwesomeIcon };

// 导出习惯图标列表以供选择
export const habitIcons = [
  { name: 'book', icon: 'book', title: '阅读', color: '#4299e1' },
  { name: 'running', icon: 'running', title: '跑步', color: '#48bb78' },
  { name: 'utensils', icon: 'utensils', title: '健康饮食', color: '#ed8936' },
  { name: 'heart', icon: 'heart', title: '健康', color: '#f56565' },
  { name: 'graduation-cap', icon: 'graduation-cap', title: '学习', color: '#805ad5' },
  { name: 'briefcase', icon: 'briefcase', title: '工作', color: '#4a5568' },
  { name: 'music', icon: 'music', title: '音乐', color: '#ed64a6' },
  { name: 'gamepad', icon: 'gamepad', title: '游戏', color: '#667eea' },
  { name: 'bell', icon: 'bell', title: '提醒', color: '#f6ad55' },
  { name: 'dumbbell', icon: 'dumbbell', title: '锻炼', color: '#0f766e' },
  { name: 'clock', icon: 'clock', title: '时间管理', color: '#0284c7' },
  { name: 'medal', icon: 'medal', title: '成就', color: '#d97706' },
  { name: 'palette', icon: 'palette', title: '艺术', color: '#be185d' },
  { name: 'apple-alt', icon: 'apple-alt', title: '饮食', color: '#b91c1c' },
  { name: 'water', icon: 'water', title: '喝水', color: '#2563eb' }
];

// 导出颜色选项
export const colorOptions = [
  { name: '蓝色', value: '#4299e1' },
  { name: '绿色', value: '#48bb78' },
  { name: '橙色', value: '#ed8936' },
  { name: '红色', value: '#f56565' },
  { name: '紫色', value: '#805ad5' },
  { name: '深灰色', value: '#1f2937' },
  { name: '粉色', value: '#ed64a6' },
  { name: '靛蓝', value: '#667eea' },
  { name: '黄色', value: '#f6ad55' },
  { name: '青绿', value: '#0f766e' }
];

// Vue插件安装方法
export default {
  install(app) {
    app.component('font-awesome-icon', FontAwesomeIcon);
  }
}; 