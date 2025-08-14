import axios from 'axios'

class GitHubService {
  constructor(token, owner, repo) {
    this.token = token
    this.owner = owner
    this.repo = repo
    this.baseURL = `https://api.github.com/repos/${owner}/${repo}`
    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      }
    })
  }

  // 获取文件内容
  async getFile(filePath, branch = 'main') {
    try {
      const response = await this.api.get(`/contents/${filePath}`, {
        params: {
          ref: branch
        }
      })
      
      // 解码base64内容
      const decodedContent = atob(response.data.content)
      // 处理UTF-8编码
      const decodedUTF8 = decodeURIComponent(escape(decodedContent))
      
      return {
        content: decodedUTF8,
        sha: response.data.sha
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return null
      }
      throw error
    }
  }

  // 创建或更新文件
  async saveFile(filePath, content, message, branch = 'main', sha = null) {
    // 确保内容是字符串
    if (typeof content !== 'string') {
      content = JSON.stringify(content, null, 2)
    }
    
    // UTF-8编码后再base64编码
    const encodedUTF8 = unescape(encodeURIComponent(content))
    const base64Content = btoa(encodedUTF8)
    
    const data = {
      message,
      content: base64Content,
      branch
    }
    
    if (sha) {
      data.sha = sha
    }

    const response = await this.api.put(`/contents/${filePath}`, data)
    return response.data
  }

  // 获取用户仓库列表
  async getRepos() {
    const response = await axios.get('https://api.github.com/user/repos', {
      headers: {
        'Authorization': `token ${this.token}`
      }
    })
    return response.data
  }
}

export default GitHubService