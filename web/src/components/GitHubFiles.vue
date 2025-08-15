<template>
  <el-dialog
    title="GitHub文件列表"
    :visible.sync="dialogVisible"
    width="600px"
    :close-on-click-modal="false"
    :append-to-body="true"
    class="github-files-dialog"
  >
    <div class="repo-info" v-if="githubConfig.owner && githubConfig.repo">
      <span>仓库: {{ githubConfig.owner }}/{{ githubConfig.repo }}</span>
      <span>分支: {{ githubConfig.branch || 'main' }}</span>
    </div>
    
    <div class="file-list-header">
      <el-button size="small" type="primary" @click="refreshFiles" :loading="loading">
        <i class="el-icon-refresh"></i> 刷新
      </el-button>
      <el-button size="small" type="success" @click="showCreateFileDialog">
        <i class="el-icon-plus"></i> 新建文件
      </el-button>
    </div>
    
    <div v-loading="loading" class="file-list-container">
      <el-table
        v-if="files.length > 0"
        :data="files"
        style="width: 100%"
        size="small"
      >
        <el-table-column prop="name" label="文件名" width="300">
          <template slot-scope="scope">
            <span :class="{'current-file': scope.row.name === githubCurrentFile}">
              {{ scope.row.name }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template slot-scope="scope">
            <el-button
              size="mini"
              type="primary"
              @click="openFile(scope.row)"
              :disabled="scope.row.name === githubCurrentFile"
            >打开</el-button>
            <el-button
              size="mini"
              type="danger"
              @click="confirmDeleteFile(scope.row)"
              :disabled="scope.row.name === githubCurrentFile"
            >删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div v-else class="empty-state">
        <p>没有找到.smm文件</p>
      </div>
    </div>
    
    <!-- 创建文件对话框 -->
    <el-dialog
      title="创建新文件"
      :visible.sync="createFileDialogVisible"
      width="400px"
      append-to-body
    >
      <el-form :model="newFileForm" :rules="newFileRules" ref="newFileForm" label-width="80px">
        <el-form-item label="文件名" prop="filename">
          <el-input v-model="newFileForm.filename" placeholder="请输入文件名"></el-input>
          <div class="form-tip">文件名将自动添加.smm扩展名</div>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="createFileDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="createFile" :loading="creatingFile">创建</el-button>
      </span>
    </el-dialog>
  </el-dialog>
</template>

<script>
import { mapState } from 'vuex'
import githubService from '@/api/github'
import exampleData from 'simple-mind-map/example/exampleData'
import { simpleDeepClone } from 'simple-mind-map/src/utils/index'

export default {
  name: 'GitHubFiles',
  data() {
    return {
      dialogVisible: false,
      loading: false,
      files: [],
      createFileDialogVisible: false,
      newFileForm: {
        filename: ''
      },
      newFileRules: {
        filename: [
          { required: true, message: '请输入文件名', trigger: 'blur' },
          { pattern: /^[\w\-. ]+$/, message: '文件名只能包含字母、数字、下划线、横线、点和空格', trigger: 'blur' }
        ]
      },
      creatingFile: false
    }
  },
  
  computed: {
    ...mapState({
      githubConfig: state => state.githubConfig,
      githubCurrentFile: state => state.githubCurrentFile
    })
  },
  
  methods: {
    // 显示对话框
    show() {
      this.dialogVisible = true
      this.refreshFiles()
    },
    
    // 刷新文件列表
    async refreshFiles() {
      if (!this.githubConfig.token || !this.githubConfig.owner || !this.githubConfig.repo) {
        this.$message.error('GitHub配置不完整，请先配置GitHub仓库信息')
        return
      }
      
      this.loading = true
      try {
        const fileList = await githubService.getFileList()
        // 只显示.smm文件
        this.files = fileList.filter(file => file.type === 'file' && file.name.endsWith('.smm'))
      } catch (error) {
        console.error('获取GitHub文件列表失败:', error)
        this.$message.error(`获取GitHub文件列表失败: ${error.message || '未知错误'}`)
        this.files = []
      } finally {
        this.loading = false
      }
    },
    
    // 打开文件
    async openFile(file) {
      this.loading = true
      try {
        // 更新当前文件名
        this.$store.commit('setGitHubCurrentFile', file.name)
        
        // 重新加载数据
        await this.$bus.$emit('reload_data')
        
        this.dialogVisible = false
        this.$message.success(`已打开文件: ${file.name}`)
      } catch (error) {
        console.error('打开GitHub文件失败:', error)
        this.$message.error(`打开GitHub文件失败: ${error.message || '未知错误'}`)
      } finally {
        this.loading = false
      }
    },
    
    // 确认删除文件
    confirmDeleteFile(file) {
      this.$confirm(`确定要删除文件 ${file.name} 吗?`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.deleteFile(file)
      }).catch(() => {})
    },
    
    // 删除文件
    async deleteFile(file) {
      this.loading = true
      try {
        const result = await githubService.deleteFile(
          file.path,
          `删除文件 ${file.name}`,
          file.sha
        )
        
        if (result.success) {
          this.$message.success(`文件 ${file.name} 已删除`)
          this.refreshFiles()
        } else {
          throw new Error(result.error || '删除失败')
        }
      } catch (error) {
        console.error('删除GitHub文件失败:', error)
        this.$message.error(`删除GitHub文件失败: ${error.message || '未知错误'}`)
      } finally {
        this.loading = false
      }
    },
    
    // 显示创建文件对话框
    showCreateFileDialog() {
      this.createFileDialogVisible = true
      this.newFileForm.filename = ''
      this.$nextTick(() => {
        this.$refs.newFileForm && this.$refs.newFileForm.clearValidate()
      })
    },
    
    // 创建新文件
    async createFile() {
      this.$refs.newFileForm.validate(async valid => {
        if (!valid) return
        
        let filename = this.newFileForm.filename.trim()
        if (!filename.endsWith('.smm')) {
          filename += '.smm'
        }
        
        this.creatingFile = true
        try {
          // 检查文件是否已存在
          const existingFile = this.files.find(f => f.name.toLowerCase() === filename.toLowerCase())
          if (existingFile) {
            this.$message.error(`文件 ${filename} 已存在`)
            return
          }
          
          // 创建新文件，使用示例数据
          const content = JSON.stringify(simpleDeepClone(exampleData))
          const result = await githubService.saveFile(
            filename,
            content,
            `创建新文件 ${filename}`
          )
          
          if (result.success) {
            this.$message.success(`文件 ${filename} 已创建`)
            this.createFileDialogVisible = false
            await this.refreshFiles()
            
            // 自动打开新创建的文件
            const newFile = this.files.find(f => f.name === filename)
            if (newFile) {
              this.openFile(newFile)
            }
          } else {
            throw new Error(result.error || '创建失败')
          }
        } catch (error) {
          console.error('创建GitHub文件失败:', error)
          this.$message.error(`创建GitHub文件失败: ${error.message || '未知错误'}`)
        } finally {
          this.creatingFile = false
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.github-files-dialog {
  .repo-info {
    margin-bottom: 15px;
    display: flex;
    justify-content: space-between;
    font-size: 14px;
    color: #606266;
    background-color: #f5f7fa;
    padding: 8px 12px;
    border-radius: 4px;
  }
  
  .file-list-header {
    margin-bottom: 15px;
    display: flex;
    justify-content: flex-start;
    gap: 10px;
  }
  
  .file-list-container {
    min-height: 200px;
  }
  
  .empty-state {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 200px;
    color: #909399;
    font-size: 14px;
  }
  
  .current-file {
    color: #409EFF;
    font-weight: bold;
  }
  
  .form-tip {
    font-size: 12px;
    color: #909399;
    margin-top: 5px;
  }
}

// 暗黑模式样式
.dark {
  .github-files-dialog {
    .repo-info {
      background-color: #2b2b2b;
      color: #dcdfe6;
    }
    
    .empty-state {
      color: #a0a0a0;
    }
    
    .form-tip {
      color: #a0a0a0;
    }
  }
}
</style>