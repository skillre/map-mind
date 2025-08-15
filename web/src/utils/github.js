/**
 * GitHub API 服务
 */

// 获取文件内容
export async function getFileContent(config) {
  const { token, owner, repo, branch, path } = config
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  })
  
  if (!response.ok) {
    if (response.status === 404) {
      return null // 文件不存在
    }
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`)
  }
  
  const data = await response.json()
  return {
    content: atob(data.content), // Base64解码
    sha: data.sha
  }
}

// 创建或更新文件
export async function createOrUpdateFile(config, content, message, sha = null) {
  const { token, owner, repo, branch, path } = config
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`
  
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message,
      content: btoa(content), // Base64编码
      branch,
      sha // 如果是更新文件需要提供SHA
    })
  })
  
  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`)
  }
  
  const data = await response.json()
  return data.content.sha
}

// 删除文件
export async function deleteFile(config, message, sha) {
  const { token, owner, repo, branch, path } = config
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`
  
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message,
      branch,
      sha
    })
  })
  
  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`)
  }
  
  return true
}