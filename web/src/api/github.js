import axios from 'axios';
import Vue from 'vue';
import vuexStore from '@/store';

// GitHub API基础URL
const BASE_URL = 'https://api.github.com';

/**
 * GitHub API服务类
 * 用于处理GitHub仓库的授权和文件操作
 */
class GitHubService {
  constructor() {
    this.token = '';
    this.owner = '';
    this.repo = '';
    this.branch = 'main';
    this.initialized = false;
    this.loadConfig();
  }

  /**
   * 加载GitHub配置
   */
  loadConfig() {
    const config = vuexStore.state.githubConfig;
    if (config) {
      this.token = config.token || '';
      this.owner = config.owner || '';
      this.repo = config.repo || '';
      this.branch = config.branch || 'main';
      this.initialized = !!(this.token && this.owner && this.repo);
    }
  }

  /**
   * 获取API请求头
   */
  getHeaders() {
    return {
      'Authorization': `token ${this.token}`,
      'Accept': 'application/vnd.github.v3+json'
    };
  }

  /**
   * 检查是否已初始化
   */
  checkInitialized() {
    if (!this.initialized) {
      throw new Error('GitHub服务未初始化，请先配置GitHub仓库信息');
    }
  }

  /**
   * 验证GitHub令牌
   * @returns {Promise<boolean>}
   */
  async validateToken() {
    try {
      if (!this.token) return false;
      
      const response = await axios.get(`${BASE_URL}/user`, {
        headers: this.getHeaders()
      });
      
      return response.status === 200;
    } catch (error) {
      console.error('验证GitHub令牌失败:', error);
      return false;
    }
  }

  /**
   * 验证仓库访问权限
   * @returns {Promise<boolean>}
   */
  async validateRepository() {
    try {
      if (!this.token || !this.owner || !this.repo) return false;
      
      const response = await axios.get(`${BASE_URL}/repos/${this.owner}/${this.repo}`, {
        headers: this.getHeaders()
      });
      
      return response.status === 200;
    } catch (error) {
      console.error('验证GitHub仓库访问权限失败:', error);
      return false;
    }
  }

  /**
   * 获取文件内容
   * @param {string} path - 文件路径
   * @returns {Promise<Object>} - 文件内容和元数据
   */
  async getFile(path) {
    this.checkInitialized();
    
    try {
      const response = await axios.get(
        `${BASE_URL}/repos/${this.owner}/${this.repo}/contents/${path}`,
        {
          headers: this.getHeaders(),
          params: { ref: this.branch }
        }
      );
      
      if (response.data && response.data.content) {
        // GitHub API返回的是Base64编码的内容
        const content = atob(response.data.content.replace(/\n/g, ''));
        return {
          content,
          sha: response.data.sha,
          path: response.data.path,
          success: true
        };
      }
      
      return { success: false, error: '无法获取文件内容' };
    } catch (error) {
      console.error('获取GitHub文件失败:', error);
      // 如果是404错误，说明文件不存在
      if (error.response && error.response.status === 404) {
        return { success: false, error: '文件不存在', notFound: true };
      }
      return { success: false, error: error.message || '获取文件失败' };
    }
  }

  /**
   * 创建或更新文件
   * @param {string} path - 文件路径
   * @param {string} content - 文件内容
   * @param {string} message - 提交消息
   * @param {string} [sha] - 文件的SHA值（更新文件时需要）
   * @returns {Promise<Object>}
   */
  async saveFile(path, content, message, sha = null) {
    this.checkInitialized();
    
    try {
      const payload = {
        message,
        content: btoa(unescape(encodeURIComponent(content))), // 确保正确处理Unicode字符
        branch: this.branch
      };
      
      // 如果提供了SHA，说明是更新文件
      if (sha) {
        payload.sha = sha;
      }
      
      const response = await axios.put(
        `${BASE_URL}/repos/${this.owner}/${this.repo}/contents/${path}`,
        payload,
        { headers: this.getHeaders() }
      );
      
      return {
        success: true,
        sha: response.data.content.sha,
        path: response.data.content.path
      };
    } catch (error) {
      console.error('保存GitHub文件失败:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || '保存文件失败'
      };
    }
  }

  /**
   * 获取仓库文件列表
   * @param {string} [path=''] - 目录路径
   * @returns {Promise<Array>} - 文件列表
   */
  async getFileList(path = '') {
    this.checkInitialized();
    
    try {
      const url = path
        ? `${BASE_URL}/repos/${this.owner}/${this.repo}/contents/${path}`
        : `${BASE_URL}/repos/${this.owner}/${this.repo}/contents`;
      
      const response = await axios.get(url, {
        headers: this.getHeaders(),
        params: { ref: this.branch }
      });
      
      // 过滤并格式化文件列表
      return response.data.map(item => ({
        name: item.name,
        path: item.path,
        type: item.type, // 'file' 或 'dir'
        sha: item.sha,
        size: item.size,
        url: item.html_url
      }));
    } catch (error) {
      console.error('获取GitHub文件列表失败:', error);
      throw new Error(error.response?.data?.message || '获取文件列表失败');
    }
  }

  /**
   * 删除文件
   * @param {string} path - 文件路径
   * @param {string} message - 提交消息
   * @param {string} sha - 文件的SHA值
   * @returns {Promise<Object>}
   */
  async deleteFile(path, message, sha) {
    this.checkInitialized();
    
    try {
      const response = await axios.delete(
        `${BASE_URL}/repos/${this.owner}/${this.repo}/contents/${path}`,
        {
          headers: this.getHeaders(),
          data: {
            message,
            sha,
            branch: this.branch
          }
        }
      );
      
      return { success: true };
    } catch (error) {
      console.error('删除GitHub文件失败:', error);
      return {
        success: false,
        error: error.response?.data?.message || '删除文件失败'
      };
    }
  }
}

// 创建GitHub服务实例
const githubService = new GitHubService();

// 导出GitHub服务实例
export default githubService;