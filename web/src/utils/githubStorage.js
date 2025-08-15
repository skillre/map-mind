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
    
    // 启动自动保存
    this.startAutoSave()
  }
  
  // 启动自动保存
  startAutoSave() {
    // 清除现有的定时器
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer)
    }
    
    const githubConfig = store.state.githubConfig
    if (githubConfig && githubConfig.autoSave) {
      this.autoSaveTimer = setInterval(() => {
        this.save()
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
  async save(data = null) {
    // 防止并发保存
    if (this.isSaving) {
      return
    }
    
    const githubConfig = store.state.githubConfig
    if (!githubConfig) {
      return
    }
    
    this.isSaving = true
    
    try {
      // 如果没有提供数据，则从store中获取当前数据
      if (!data) {
        // 这里需要获取当前思维导图的数据
        // 由于涉及复杂的数据获取逻辑，暂时留空
        // 在实际应用中，应该从Vue原型或mind map实例中获取数据
        return
      }
      
      const content = JSON.stringify(data, null, 2)
      const sha = store.state.githubFileSha
      const message = `Update mind map ${new Date().toLocaleString()}`
      
      const newSha = await createOrUpdateFile(githubConfig, content, message, sha)
      store.commit('setGithubFileSha', newSha)
      
      console.log('Successfully saved to GitHub')
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