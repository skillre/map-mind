import { getFileContent, createOrUpdateFile } from './github'
import store from '@/store'

class GithubStorage {
  constructor() {
    this.autoSaveTimer = null
    this.isSaving = false
  }
  
  // 初始化
  init() {
    // 从localStorage恢复GitHub配置
    const githubConfig = localStorage.getItem('GITHUB_CONFIG')
    if (githubConfig) {
      try {
        store.commit('setGithubConfig', JSON.parse(githubConfig))
      } catch (e) {
        console.error('Failed to parse GitHub config:', e)
      }
    }
    
    // 监听配置变化并重新启动自动保存
    store.watch(
      (state) => state.githubConfig,
      (newConfig) => {
        this.startAutoSave()
      }
    )
    
    // 启动自动保存
    this.startAutoSave()
  }
  
  // 启动自动保存
  startAutoSave() {
    // 清除现有的定时器
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer)
      this.autoSaveTimer = null
    }
    
    const githubConfig = store.state.githubConfig
    if (githubConfig && githubConfig.autoSave) {
      this.autoSaveTimer = setInterval(() => {
        // 触发保存事件，由主程序监听并处理实际保存逻辑
        window.dispatchEvent(new CustomEvent('github-auto-save'))
      }, githubConfig.autoSaveInterval * 1000)
    }
  }
  
  // 加载文件
  async load() {
    const githubConfig = store.state.githubConfig
    if (!githubConfig) {
      throw new Error('GitHub configuration not found')
    }
    
    try {
      const result = await getFileContent(githubConfig)
      if (result) {
        store.commit('setGithubFileSha', result.sha)
        return JSON.parse(result.content)
      }
      return null
    } catch (error) {
      console.error('Failed to load from GitHub:', error)
      throw error
    }
  }
  
  // 保存文件
  async save(data) {
    // 防止并发保存
    if (this.isSaving) {
      console.log('Save operation is in progress, skipping...')
      return
    }
    
    const githubConfig = store.state.githubConfig
    if (!githubConfig) {
      console.log('GitHub configuration not found, skipping save...')
      return
    }
    
    this.isSaving = true
    
    try {
      const content = JSON.stringify(data, null, 2)
      const sha = store.state.githubFileSha
      const message = `Update mind map ${new Date().toLocaleString()}`
      
      const newSha = await createOrUpdateFile(githubConfig, content, message, sha)
      store.commit('setGithubFileSha', newSha)
      
      console.log('Successfully saved to GitHub')
      return true
    } catch (error) {
      console.error('Failed to save to GitHub:', error)
      throw error
    } finally {
      this.isSaving = false
    }
  }
  
  // 手动保存
  async manualSave(data) {
    const githubConfig = store.state.githubConfig
    if (!githubConfig) {
      throw new Error('GitHub configuration not found')
    }
    
    return this.save(data)
  }
}

export default new GithubStorage()