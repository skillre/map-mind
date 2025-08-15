/**
 * GitHub集成测试脚本
 * 用于测试思维导图应用的GitHub存储功能
 */

const githubService = require('./web/src/api/github');

// 测试配置
const config = {
  token: 'YOUR_GITHUB_TOKEN', // 替换为你的GitHub令牌
  owner: 'YOUR_GITHUB_USERNAME', // 替换为你的GitHub用户名
  repo: 'YOUR_REPO_NAME', // 替换为你的仓库名
  branch: 'main' // 替换为你的分支名
};

// 测试文件名
const testFileName = 'test-mindmap.smm';

// 测试数据
const testData = {
  root: {
    data: {
      text: '测试思维导图'
    },
    children: [
      {
        data: {
          text: '子节点1'
        },
        children: []
      },
      {
        data: {
          text: '子节点2'
        },
        children: []
      }
    ]
  },
  theme: {
    template: 'classic',
    config: {}
  },
  layout: 'logicalStructure'
};

/**
 * 运行测试
 */
async function runTests() {
  console.log('开始GitHub集成测试...');
  
  try {
    // 加载配置
    githubService.loadConfig(config);
    console.log('✅ 配置加载成功');
    
    // 测试仓库连接
    const repoResult = await githubService.validateRepository();
    if (repoResult.success) {
      console.log('✅ 仓库连接成功');
    } else {
      throw new Error(`仓库连接失败: ${repoResult.error}`);
    }
    
    // 测试获取文件列表
    const fileList = await githubService.getFileList();
    console.log(`✅ 获取文件列表成功，共 ${fileList.length} 个文件`);
    
    // 测试保存文件
    const saveResult = await githubService.saveFile(
      testFileName,
      JSON.stringify(testData),
      '测试: 创建思维导图文件'
    );
    
    if (saveResult.success) {
      console.log(`✅ 文件保存成功: ${testFileName}`);
    } else {
      throw new Error(`文件保存失败: ${saveResult.error}`);
    }
    
    // 测试获取文件
    const getResult = await githubService.getFile(testFileName);
    if (getResult.success) {
      console.log(`✅ 文件获取成功: ${testFileName}`);
      
      // 验证文件内容
      const content = JSON.parse(getResult.content);
      if (content.root.data.text === testData.root.data.text) {
        console.log('✅ 文件内容验证成功');
      } else {
        throw new Error('文件内容验证失败，内容不匹配');
      }
    } else {
      throw new Error(`文件获取失败: ${getResult.error}`);
    }
    
    // 测试删除文件
    const deleteResult = await githubService.deleteFile(
      testFileName,
      '测试: 删除思维导图文件'
    );
    
    if (deleteResult.success) {
      console.log(`✅ 文件删除成功: ${testFileName}`);
    } else {
      throw new Error(`文件删除失败: ${deleteResult.error}`);
    }
    
    console.log('🎉 所有测试通过!');
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// 运行测试
runTests();