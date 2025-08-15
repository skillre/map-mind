import exampleData from 'simple-mind-map/example/exampleData'
import { simpleDeepClone } from 'simple-mind-map/src/utils/index'
import Vue from 'vue'
import vuexStore from '@/store'
import githubService from './github'

const SIMPLE_MIND_MAP_DATA = 'SIMPLE_MIND_MAP_DATA'
const SIMPLE_MIND_MAP_CONFIG = 'SIMPLE_MIND_MAP_CONFIG'
const SIMPLE_MIND_MAP_LANG = 'SIMPLE_MIND_MAP_LANG'
const SIMPLE_MIND_MAP_LOCAL_CONFIG = 'SIMPLE_MIND_MAP_LOCAL_CONFIG'
const SIMPLE_MIND_MAP_GITHUB_CONFIG = 'SIMPLE_MIND_MAP_GITHUB_CONFIG'

let mindMapData = null

// 获取缓存的思维导图数据
export const getData = async () => {
  // 接管模式
  if (window.takeOverApp) {
    mindMapData = window.takeOverAppMethods.getMindMapData()
    return mindMapData
  }
  // 操作本地文件模式
  if (vuexStore.state.isHandleLocalFile) {
    return Vue.prototype.getCurrentData()
  }
  // GitHub文件模式
  if (vuexStore.state.isHandleGitHubFile) {
    try {
      // 从GitHub获取文件
      const currentFile = vuexStore.state.githubCurrentFile || 'mindmap.smm'
      const result = await githubService.getFile(currentFile)
      if (result.success) {
        try {
          const data = JSON.parse(result.content)
          return data
        } catch (error) {
          console.error('解析GitHub文件内容失败:', error)
          return simpleDeepClone(exampleData)
        }
      } else {
        // 如果文件不存在，使用默认数据
        if (result.notFound) {
          return simpleDeepClone(exampleData)
        }
        throw new Error(result.error || '获取GitHub文件失败')
      }
    } catch (error) {
      console.error('从GitHub获取数据失败:', error)
      Vue.prototype.$message.error(`从GitHub获取数据失败: ${error.message}`)
      return simpleDeepClone(exampleData)
    }
  }
  // 本地存储模式
  let store = localStorage.getItem(SIMPLE_MIND_MAP_DATA)
  if (store === null) {
    return simpleDeepClone(exampleData)
  } else {
    try {
      return JSON.parse(store)
    } catch (error) {
      return simpleDeepClone(exampleData)
    }
  }
}

// 存储思维导图数据
export const storeData = async data => {
  try {
    let originData = null
    if (window.takeOverApp) {
      originData = mindMapData
    } else {
      originData = await getData()
    }
    if (!originData) {
      originData = {}
    }
    originData = {
      ...originData,
      ...data
    }
    if (window.takeOverApp) {
      mindMapData = originData
      window.takeOverAppMethods.saveMindMapData(originData)
      return
    }
    
    // 本地文件模式
    Vue.prototype.$bus.$emit('write_local_file', originData)
    if (vuexStore.state.isHandleLocalFile) {
      return
    }
    
    // GitHub文件模式
    if (vuexStore.state.isHandleGitHubFile) {
      try {
        const currentFile = vuexStore.state.githubCurrentFile || 'mindmap.smm'
        const content = JSON.stringify(originData)
        
        // 检查是否需要自动保存
        const shouldAutoSave = vuexStore.state.githubConfig.autoSave
        if (!shouldAutoSave) {
          // 如果不自动保存，只更新内存中的数据
          Vue.prototype.$bus.$emit('github_data_changed', originData)
          return
        }
        
        // 获取文件SHA（如果存在）
        let sha = null
        try {
          const fileInfo = await githubService.getFile(currentFile)
          if (fileInfo.success) {
            sha = fileInfo.sha
          }
        } catch (error) {
          console.log('文件不存在，将创建新文件')
        }
        
        // 保存到GitHub
        const result = await githubService.saveFile(
          currentFile,
          content,
          '更新思维导图数据',
          sha
        )
        
        if (!result.success) {
          console.error('保存到GitHub失败:', result.error)
          Vue.prototype.$message.error(`保存到GitHub失败: ${result.error}`)
        }
        
        return
      } catch (error) {
        console.error('保存到GitHub失败:', error)
        Vue.prototype.$message.error(`保存到GitHub失败: ${error.message}`)
      }
      return
    }
    
    // 本地存储模式
    localStorage.setItem(SIMPLE_MIND_MAP_DATA, JSON.stringify(originData))
  } catch (error) {
    console.log(error)
    if ('exceeded') {
      Vue.prototype.$bus.$emit('localStorageExceeded')
    }
  }
}

// 获取思维导图配置数据
export const getConfig = () => {
  if (window.takeOverApp) {
    window.takeOverAppMethods.getMindMapConfig()
    return
  }
  let config = localStorage.getItem(SIMPLE_MIND_MAP_CONFIG)
  if (config) {
    return JSON.parse(config)
  }
  return null
}

// 存储思维导图配置数据
export const storeConfig = config => {
  try {
    if (window.takeOverApp) {
      window.takeOverAppMethods.saveMindMapConfig(config)
      return
    }
    localStorage.setItem(SIMPLE_MIND_MAP_CONFIG, JSON.stringify(config))
  } catch (error) {
    console.log(error)
  }
}

// 存储语言
export const storeLang = lang => {
  if (window.takeOverApp) {
    window.takeOverAppMethods.saveLanguage(lang)
    return
  }
  localStorage.setItem(SIMPLE_MIND_MAP_LANG, lang)
}

// 获取存储的语言
export const getLang = () => {
  if (window.takeOverApp) {
    return window.takeOverAppMethods.getLanguage() || 'zh'
  }
  let lang = localStorage.getItem(SIMPLE_MIND_MAP_LANG)
  if (lang) {
    return lang
  }
  storeLang('zh')
  return 'zh'
}

// 存储本地配置
export const storeLocalConfig = config => {
  if (window.takeOverApp) {
    return window.takeOverAppMethods.saveLocalConfig(config)
  }
  localStorage.setItem(SIMPLE_MIND_MAP_LOCAL_CONFIG, JSON.stringify(config))
}

// 获取本地配置
export const getLocalConfig = () => {
  if (window.takeOverApp) {
    return window.takeOverAppMethods.getLocalConfig()
  }
  let config = localStorage.getItem(SIMPLE_MIND_MAP_LOCAL_CONFIG)
  if (config) {
    return JSON.parse(config)
  }
  return null
}

// 获取GitHub配置
export const getGitHubConfig = () => {
  let config = localStorage.getItem(SIMPLE_MIND_MAP_GITHUB_CONFIG)
  if (config) {
    try {
      return JSON.parse(config)
    } catch (error) {
      return {}
    }
  }
  return {}
}

// 存储GitHub配置
export const storeGitHubConfig = data => {
  try {
    let originData = getGitHubConfig()
    originData = {
      ...originData,
      ...data
    }
    localStorage.setItem(SIMPLE_MIND_MAP_GITHUB_CONFIG, JSON.stringify(originData))
  } catch (error) {
    console.log(error)
  }
}
