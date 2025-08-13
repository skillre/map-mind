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
      return {
        content: atob(response.data.content),
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
    const data = {
      message,
      content: btoa(unescape(encodeURIComponent(content))),
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