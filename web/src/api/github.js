/**
 * GitHub存储API集成
 * 使用GitHub API v3进行文件存储和管理
 */

const GITHUB_API_BASE = 'https://api.github.com';

class GitHubStorage {
  constructor() {
    this.owner = null;
    this.repo = null;
    this.token = null;
    this.branch = 'main';
    this.initialized = false;
  }

  /**
   * 初始化GitHub存储
   * @param {string} owner - GitHub用户名
   * @param {string} repo - 仓库名
   * @param {string} token - GitHub访问令牌
   * @param {string} branch - 分支名，默认为main
   */
  init(owner, repo, token, branch = 'main') {
    this.owner = owner;
    this.repo = repo;
    this.token = token;
    this.branch = branch;
    this.initialized = true;
  }

  /**
   * 获取文件内容
   * @param {string} path - 文件路径
   * @returns {Promise<Object>} 文件内容和元数据
   */
  async getFile(path) {
    if (!this.initialized) {
      throw new Error('GitHub存储未初始化');
    }

    try {
      const response = await fetch(
        `${GITHUB_API_BASE}/repos/${this.owner}/${this.repo}/contents/${path}`,
        {
          headers: {
            'Authorization': `token ${this.token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      if (response.status === 404) {
        return null; // 文件不存在
      }

      if (!response.ok) {
        throw new Error(`获取文件失败: ${response.status}`);
      }

      const data = await response.json();
      const content = JSON.parse(atob(data.content));
      
      return {
        content,
        sha: data.sha,
        path: data.path
      };
    } catch (error) {
      console.error('获取文件失败:', error);
      throw error;
    }
  }

  /**
   * 创建或更新文件
   * @param {string} path - 文件路径
   * @param {any} content - 文件内容
   * @param {string} message - 提交消息
   * @param {string} sha - 文件sha（更新时需要）
   * @returns {Promise<Object>} 操作结果
   */
  async saveFile(path, content, message, sha = null) {
    if (!this.initialized) {
      throw new Error('GitHub存储未初始化');
    }

    try {
      const body = {
        message,
        content: btoa(JSON.stringify(content, null, 2)),
        branch: this.branch
      };

      if (sha) {
        body.sha = sha; // 更新文件时需要
      }

      const response = await fetch(
        `${GITHUB_API_BASE}/repos/${this.owner}/${this.repo}/contents/${path}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `token ${this.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        }
      );

      if (!response.ok) {
        throw new Error(`保存文件失败: ${response.status}`);
      }

      const data = await response.json();
      return {
        content: data.content,
        sha: data.content.sha
      };
    } catch (error) {
      console.error('保存文件失败:', error);
      throw error;
    }
  }

  /**
   * 删除文件
   * @param {string} path - 文件路径
   * @param {string} message - 提交消息
   * @param {string} sha - 文件sha
   * @returns {Promise<Object>} 操作结果
   */
  async deleteFile(path, message, sha) {
    if (!this.initialized) {
      throw new Error('GitHub存储未初始化');
    }

    try {
      const response = await fetch(
        `${GITHUB_API_BASE}/repos/${this.owner}/${this.repo}/contents/${path}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `token ${this.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message,
            sha,
            branch: this.branch
          })
        }
      );

      if (!response.ok) {
        throw new Error(`删除文件失败: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('删除文件失败:', error);
      throw error;
    }
  }

  /**
   * 获取仓库中的文件列表
   * @param {string} path - 目录路径
   * @returns {Promise<Array>} 文件列表
   */
  async getFileList(path = '') {
    if (!this.initialized) {
      throw new Error('GitHub存储未初始化');
    }

    try {
      const response = await fetch(
        `${GITHUB_API_BASE}/repos/${this.owner}/${this.repo}/contents/${path}`,
        {
          headers: {
            'Authorization': `token ${this.token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`获取文件列表失败: ${response.status}`);
      }

      const data = await response.json();
      return data.filter(item => item.type === 'file' && item.name.endsWith('.smm'));
    } catch (error) {
      console.error('获取文件列表失败:', error);
      throw error;
    }
  }

  /**
   * 检查仓库是否存在
   * @returns {Promise<boolean>} 是否存在
   */
  async checkRepo() {
    if (!this.initialized) {
      return false;
    }

    try {
      const response = await fetch(
        `${GITHUB_API_BASE}/repos/${this.owner}/${this.repo}`,
        {
          headers: {
            'Authorization': `token ${this.token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

// 创建单例实例
const githubStorage = new GitHubStorage();

/**
 * 初始化GitHub存储
 * @param {string} owner - GitHub用户名
 * @param {string} repo - 仓库名
 * @param {string} token - GitHub访问令牌
 * @param {string} branch - 分支名
 */
export function initGitHubStorage(owner, repo, token, branch = 'main') {
  githubStorage.init(owner, repo, token, branch);
}

/**
 * 获取文件
 * @param {string} path - 文件路径
 * @returns {Promise<Object>} 文件内容
 */
export async function getFile(path) {
  return githubStorage.getFile(path);
}

/**
 * 保存文件
 * @param {string} path - 文件路径
 * @param {any} content - 文件内容
 * @param {string} message - 提交消息
 * @param {string} sha - 文件sha
 * @returns {Promise<Object>} 操作结果
 */
export async function saveFile(path, content, message, sha = null) {
  return githubStorage.saveFile(path, content, message, sha);
}

/**
 * 删除文件
 * @param {string} path - 文件路径
 * @param {string} message - 提交消息
 * @param {string} sha - 文件sha
 * @returns {Promise<Object>} 操作结果
 */
export async function deleteFile(path, message, sha) {
  return githubStorage.deleteFile(path, message, sha);
}

/**
 * 获取文件列表
 * @param {string} path - 目录路径
 * @returns {Promise<Array>} 文件列表
 */
export async function getFileList(path = '') {
  return githubStorage.getFileList(path);
}

/**
 * 检查仓库
 * @returns {Promise<boolean>} 是否存在
 */
export async function checkRepo() {
  return githubStorage.checkRepo();
}

export default githubStorage;