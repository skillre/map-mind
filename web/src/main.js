import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import './i18n'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import '@/style/index.less'
import '@/assets/icon-font/iconfont.css'
import VueClipboard from 'vue-clipboard2'
import GithubStorage from '@/utils/githubStorage'

Vue.config.productionTip = false
Vue.use(ElementUI)
Vue.use(VueClipboard)

// 初始化GitHub存储服务
GithubStorage.init()

// import VConsole from 'vconsole'
// const vConsole = new VConsole()

// 总线
Vue.prototype.$bus = new Vue()

const initApp = () => {
  i18n.locale = getLang()
  new Vue({
    render: h => h(App),
    router,
    store,
    i18n
  }).$mount('#app')
}

// 是否处于接管应用模式
if (window.takeOverApp) {
  window.initApp = initApp
  window.$bus = bus
} else {
  initApp()
}
