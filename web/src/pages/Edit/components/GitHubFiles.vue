<template>
  <el-dialog
    title="GitHub文件列表"
    :visible.sync="visible"
    width="500px"
    :close-on-click-modal="false"
  >
    <div class="github-files-container">
      <div class="github-files-header">
        <div class="repo-info">
          <span>{{ githubConfig.owner }}/{{ githubConfig.repo }}</span>
          <span class="branch">{{ githubConfig.branch || 'main' }}</span>
        </div>
        <el-button size="small" type="primary" @click="refreshFiles">刷新</el-button>
      </div>
      
      <div class="github-files-list" v-loading="loading">
        <div v-if="error" class="error-message">
          <i class="el-icon-warning-outline"></i>
          <span>{{ error }}</span>
          <el-button type="text" @click="refreshFiles">重试</el-button>
        </div>
        
        <div v-else-if="files.length === 0 && !loading" class="empty-message">
          <i class="el-icon-document"></i>
          <span>仓库中没有.smm文件</span>
          <el-button type="text" @click="createNewFile">创建新文件</el-button>
        </div>
        
        <el-table
          v-else
          :data="files"
          style="width: 100%"
          @row-click="handleRowClick"
        >
          <el-table-column prop="name" label="文件名">
            <template slot-scope="scope">
              <div class="file-item" :class="{ active: scope.row.name === currentFile }">
                <i class="el-icon-document"></i>
                <span>{{ scope.row.name }}</span>
                <span v-if="scope.row.name === currentFile" class="current-tag">当前</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column width="120" align="right">
            <template slot-scope="scope">
              <el-button
                size="mini"
                type="text"
                @click.stop="openFile(scope.row)"
                :disabled="scope.row.name === currentFile"
              >打开</el-button>
              <el-button
                size="mini"
                type="text"
                @click.stop="deleteFile(scope.row)"
                :disabled="scope.row.name === currentFile"
              >删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      
      <div class="github-files-footer">
        <el-button @click="visible = false">关闭</el-button>
        <el-button type="primary" @click="createNewFile">新建文件</el-button>
      </div>
    </div>
    
    <!-- 新建文件对话框 -->
    <el-dialog
      title="新建文件"
      :visible.sync="newFileDialogVisible"
      width="400px"
      append-to-body
    >
      <el-form :model="newFileForm" label-width="80px">
        <el-form-item label="文件名" prop="filename" required>
          <el-input 
            v-model="newFileForm.filename" 
            placeholder="请输入文件名"
            :suffix="'.smm'"
          ></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="newFileDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmCreateFile">确定</el-button>
      </div>
    </el-dialog>
  </el-dialog>
</template>

<script>
import { mapState } from 'vuex'
import githubService from '../../../api/github'
import exampleData from 'simple-mind-map/example/exampleData'
import { getData, storeData } from '../../../api'

export default {
  name: 'GitHubFiles',
  data() {
    return {
      visible: false,
      loading: false,
      error: '',
      files: [],
      newFileDialogVisible: false,
      newFileForm: {
        filename: ''
      }
    }
  },
  computed: {
    ...mapState({
      githubConfig: state => state.githubConfig,
      currentFile: state => state.githubCurrentFile
    })
  },
  methods: {
    show() {
      this.visible = true
      this.refreshFiles()
    },
    
    // 刷新文件列表
    async refreshFiles() {
      if (!githubService.checkInitialized()) {
        this.error = '请先配置GitHub连接'
        return
      }
      
      this.loading = true
      this.error = ''
      
      try {
        const result = await githubService.getFileList('.smm')
        if (result.success) {
          this.files = result.files
        } else {
          this.error = result.error || '获取文件列表失败'
        }
      } catch (error) {
        console.error('获取GitHub文件列表失败:', error)
        this.error = error.message || '获取文件列表失败'
      } finally {
        this.loading = false
      }
    },
    
    // 处理行点击
    handleRowClick(row) {
      // 可以在这里处理行点击事件
    },
    
    // 打开文件
    async openFile(file) {
      try {
        const loading = this.$loading({
          lock: true,
          text: '正在加载文件...',
          spinner: 'el-icon-loading',
          background: 'rgba(0, 0, 0, 0.7)'
        })
        
        // 设置当前文件
        this.$store.commit('setGitHubCurrentFile', file.name)
        
        // 加载文件内容
        const data = await getData()
        this.$bus.$emit('setData', data)
        
        loading.close()
        this.visible = false
      } catch (error) {
        console.error('打开GitHub文件失败:', error)
        this.$message.error(`打开文件失败: ${error.message}`)
      }
    },
    
    // 删除文件
    async deleteFile(file) {
      try {
        await this.$confirm(`确定要删除文件 ${file.name} 吗？`, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        
        const loading = this.$loading({
          lock: true,
          text: '正在删除文件...',
          spinner: 'el-icon-loading',
          background: 'rgba(0, 0, 0, 0.7)'
        })
        
        const result = await githubService.deleteFile(file.name, file.sha)
        
        loading.close()
        
        if (result.success) {
          this.$message.success('文件删除成功')
          this.refreshFiles()
        } else {
          this.$message.error(`删除文件失败: ${result.error}`)
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('删除GitHub文件失败:', error)
          this.$message.error(`删除文件失败: ${error.message || error}`)
        }
      }
    },
    
    // 创建新文件对话框
    createNewFile() {
      this.newFileForm.filename = ''
      this.newFileDialogVisible = true
    },
    
    // 确认创建新文件
    async confirmCreateFile() {
      if (!this.newFileForm.filename) {
        this.$message.warning('请输入文件名')
        return
      }
      
      // 添加.smm后缀
      let filename = this.newFileForm.filename
      if (!filename.endsWith('.smm')) {
        filename += '.smm'
      }
      
      // 检查文件是否已存在
      const existingFile = this.files.find(file => file.name === filename)
      if (existingFile) {
        this.$message.warning(`文件 ${filename} 已存在`)
        return
      }
      
      try {
        const loading = this.$loading({
          lock: true,
          text: '正在创建文件...',
          spinner: 'el-icon-loading',
          background: 'rgba(0, 0, 0, 0.7)'
        })
        
        // 使用默认数据创建新文件
        const content = JSON.stringify(exampleData)
        const result = await githubService.saveFile(filename, content, '创建新思维导图文件')
        
        loading.close()
        
        if (result.success) {
          this.$message.success('文件创建成功')
          this.newFileDialogVisible = false
          
          // 刷新文件列表并打开新文件
          await this.refreshFiles()
          const newFile = this.files.find(file => file.name === filename)
          if (newFile) {
            this.openFile(newFile)
          }
        } else {
          this.$message.error(`创建文件失败: ${result.error}`)
        }
      } catch (error) {
        console.error('创建GitHub文件失败:', error)
        this.$message.error(`创建文件失败: ${error.message}`)
      }
    }
  }
}
</script>

<style lang="less" scoped>
.github-files-container {
  display: flex;
  flex-direction: column;
  height: 400px;
}

.github-files-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  
  .repo-info {
    font-weight: bold;
    
    .branch {
      margin-left: 10px;
      font-size: 12px;
      color: #999;
      background-color: #f5f7fa;
      padding: 2px 6px;
      border-radius: 3px;
    }
  }
}

.github-files-list {
  flex: 1;
  overflow-y: auto;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  
  .error-message,
  .empty-message {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 200px;
    color: #909399;
    
    i {
      font-size: 32px;
      margin-bottom: 10px;
    }
  }
  
  .file-item {
    display: flex;
    align-items: center;
    
    i {
      margin-right: 5px;
    }
    
    &.active {
      color: #409EFF;
      font-weight: bold;
    }
    
    .current-tag {
      margin-left: 5px;
      font-size: 12px;
      background-color: #ecf5ff;
      color: #409EFF;
      padding: 2px 6px;
      border-radius: 3px;
    }
  }
}

.github-files-footer {
  margin-top: 15px;
  text-align: right;
}
</style>