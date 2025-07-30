<template>
  <div class="toolbarContainer" :class="{ isDark: isDark }">
    <div class="toolbar" ref="toolbarRef">
      <!-- 节点操作 -->
      <div class="toolbarBlock">
        <ToolbarNodeBtnList :list="horizontalList"></ToolbarNodeBtnList>
        <!-- 更多 -->
        <el-popover
          v-model="popoverShow"
          placement="bottom-end"
          width="120"
          trigger="hover"
          v-if="showMoreBtn"
          :style="{ marginLeft: horizontalList.length > 0 ? '20px' : 0 }"
        >
          <ToolbarNodeBtnList
            dir="v"
            :list="verticalList"
            @click.native="popoverShow = false"
          ></ToolbarNodeBtnList>
          <div slot="reference" class="toolbarBtn">
            <span class="icon iconfont icongongshi"></span>
            <span class="text">{{ $t('toolbar.more') }}</span>
          </div>
        </el-popover>
      </div>
      <!-- 导出 -->
      <div class="toolbarBlock">
        <el-tooltip
          effect="dark"
          :content="$t('toolbar.newFileTip')"
          placement="bottom"
          v-if="!isMobile"
        >
          <div class="toolbarBtn" @click="createNewFile">
            <span class="icon iconfont iconxinjianwenjian"></span>
            <span class="text">{{ $t('toolbar.newFile') }}</span>
          </div>
        </el-tooltip>
        <el-tooltip
          effect="dark"
          :content="$t('toolbar.openFileTip')"
          placement="bottom"
          v-if="!isMobile"
        >
          <div class="toolbarBtn" @click="showGitHubFiles">
            <span class="icon iconfont iconwenjian1"></span>
            <span class="text">{{ $t('toolbar.openFile') }}</span>
          </div>
        </el-tooltip>
        <div class="toolbarBtn" @click="saveToGitHub" v-if="!isMobile">
          <span class="icon iconfont iconlingcunwei"></span>
          <span class="text">{{ $t('toolbar.save') }}</span>
        </div>
        <div class="toolbarBtn" @click="showGitHubConfig" v-if="!isMobile">
          <span class="icon iconfont iconshezhi"></span>
          <span class="text">GitHub</span>
        </div>
        <div class="toolbarBtn" @click="$bus.$emit('showImport')">
          <span class="icon iconfont icondaoru"></span>
          <span class="text">{{ $t('toolbar.import') }}</span>
        </div>
        <div
          class="toolbarBtn"
          @click="$bus.$emit('showExport')"
          style="margin-right: 0;"
        >
          <span class="icon iconfont iconexport"></span>
          <span class="text">{{ $t('toolbar.export') }}</span>
        </div>
        <!-- GitHub文件列表对话框 -->
        <el-dialog
          title="GitHub文件"
          :visible.sync="gitHubFilesVisible"
          width="500px"
          :append-to-body="true"
        >
          <el-table
            :data="gitHubFiles"
            style="width: 100%"
            max-height="400"
            empty-text="暂无文件"
          >
            <el-table-column prop="name" label="文件名" width="300"></el-table-column>
            <el-table-column label="操作" width="120">
              <template slot-scope="scope">
                <el-button
                  size="mini"
                  type="primary"
                  @click="openGitHubFile(scope.row)"
                >打开</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-dialog>

        <!-- GitHub配置对话框 -->
        <el-dialog
          title="GitHub配置"
          :visible.sync="gitHubConfigVisible"
          width="400px"
          :append-to-body="true"
        >
          <el-form :model="gitHubConfig" label-width="80px">
            <el-form-item label="用户名">
              <el-input v-model="gitHubConfig.owner" placeholder="GitHub用户名"></el-input>
            </el-form-item>
            <el-form-item label="仓库名">
              <el-input v-model="gitHubConfig.repo" placeholder="仓库名称"></el-input>
            </el-form-item>
            <el-form-item label="Token">
              <el-input v-model="gitHubConfig.token" type="password" placeholder="GitHub Personal Access Token"></el-input>
            </el-form-item>
            <el-form-item label="分支">
              <el-input v-model="gitHubConfig.branch" placeholder="分支名称，默认main"></el-input>
            </el-form-item>
          </el-form>
          <div slot="footer" class="dialog-footer">
            <el-button @click="gitHubConfigVisible = false">取消</el-button>
            <el-button type="primary" @click="saveGitHubConfig">保存</el-button>
          </div>
        </el-dialog>
      </div>
    </div>
    <NodeImage></NodeImage>
    <NodeHyperlink></NodeHyperlink>
    <NodeIcon></NodeIcon>
    <NodeNote></NodeNote>
    <NodeTag></NodeTag>
    <Export></Export>
    <Import ref="ImportRef"></Import>
  </div>
</template>

<script>
import NodeImage from './NodeImage.vue'
import NodeHyperlink from './NodeHyperlink.vue'
import NodeIcon from './NodeIcon.vue'
import NodeNote from './NodeNote.vue'
import NodeTag from './NodeTag.vue'
import Export from './Export.vue'
import Import from './Import.vue'
import { mapState } from 'vuex'
import { Notification } from 'element-ui'
import exampleData from 'simple-mind-map/example/exampleData'
import { getData } from '../../../api'
import ToolbarNodeBtnList from './ToolbarNodeBtnList.vue'
import { throttle, isMobile } from 'simple-mind-map/src/utils/index'

// 工具栏
let fileHandle = null
const defaultBtnList = [
  'back',
  'forward',
  'painter',
  'siblingNode',
  'childNode',
  'deleteNode',
  'image',
  'icon',
  'link',
  'note',
  'tag',
  'summary',
  'associativeLine',
  'formula',
  // 'attachment',
  'outerFrame',
  'annotation',
  'ai'
]

export default {
  components: {
    NodeImage,
    NodeHyperlink,
    NodeIcon,
    NodeNote,
    NodeTag,
    Export,
    Import,
    ToolbarNodeBtnList
  },
  data() {
    return {
      isMobile: isMobile(),
      horizontalList: [],
      verticalList: [],
      showMoreBtn: true,
      popoverShow: false,
      gitHubFilesVisible: false,
      gitHubConfigVisible: false,
      gitHubFiles: [],
      gitHubConfig: {
        owner: localStorage.getItem('github_owner') || '',
        repo: localStorage.getItem('github_repo') || '',
        token: localStorage.getItem('github_token') || '',
        branch: localStorage.getItem('github_branch') || 'main'
      },
      currentFileName: 'data.smm',
      autoSaveInterval: null
    }
  },
  computed: {
    ...mapState({
      isDark: state => state.localConfig.isDark,
      isHandleLocalFile: state => state.isHandleLocalFile,
      openNodeRichText: state => state.localConfig.openNodeRichText,
      enableAi: state => state.localConfig.enableAi
    }),

    btnLit() {
      let res = [...defaultBtnList]
      if (!this.openNodeRichText) {
        res = res.filter(item => {
          return item !== 'formula'
        })
      }
      if (!this.enableAi) {
        res = res.filter(item => {
          return item !== 'ai'
        })
      }
      return res
    }
  },
  watch: {
    isHandleLocalFile(val) {
      if (!val) {
        Notification.closeAll()
      }
    },
    btnLit: {
      deep: true,
      handler() {
        this.computeToolbarShow()
      }
    }
  },
  created() {
    this.initGitHubStorage()
    this.startAutoSave()
  },
  mounted() {
    this.computeToolbarShow()
    this.computeToolbarShowThrottle = throttle(this.computeToolbarShow, 300)
    window.addEventListener('resize', this.computeToolbarShowThrottle)
    this.$bus.$on('lang_change', this.computeToolbarShowThrottle)
    this.$bus.$on('node_note_dblclick', this.onNodeNoteDblclick)
  },
  beforeDestroy() {
    this.stopAutoSave()
    window.removeEventListener('resize', this.computeToolbarShowThrottle)
    this.$bus.$off('lang_change', this.computeToolbarShowThrottle)
    this.$bus.$off('node_note_dblclick', this.onNodeNoteDblclick)
  },
  methods: {
    // 计算工具按钮如何显示
    computeToolbarShow() {
      if (!this.$refs.toolbarRef) return
      const windowWidth = window.innerWidth - 40
      const all = [...this.btnLit]
      let index = 1
      const loopCheck = () => {
        if (index > all.length) return done()
        this.horizontalList = all.slice(0, index)
        this.$nextTick(() => {
          const width = this.$refs.toolbarRef.getBoundingClientRect().width
          if (width < windowWidth) {
            index++
            loopCheck()
          } else if (index > 0 && width > windowWidth) {
            index--
            this.horizontalList = all.slice(0, index)
            done()
          }
        })
      }
      const done = () => {
        this.verticalList = all.slice(index)
        this.showMoreBtn = this.verticalList.length > 0
      }
      loopCheck()
    },

    // 初始化GitHub存储
    async initGitHubStorage() {
      const config = this.gitHubConfig
      if (config.owner && config.repo && config.token) {
        try {
          const { initGitHub } = await import('@/api')
          initGitHub(config.owner, config.repo, config.token, config.branch)
          this.$message.success('GitHub存储已初始化')
        } catch (error) {
          console.error('初始化GitHub存储失败:', error)
          this.$message.error('GitHub存储初始化失败')
        }
      }
    },

    // 显示GitHub配置
    showGitHubConfig() {
      this.gitHubConfigVisible = true
    },

    // 保存GitHub配置
    async saveGitHubConfig() {
      try {
        localStorage.setItem('github_owner', this.gitHubConfig.owner)
        localStorage.setItem('github_repo', this.gitHubConfig.repo)
        localStorage.setItem('github_token', this.gitHubConfig.token)
        localStorage.setItem('github_branch', this.gitHubConfig.branch)
        
        await this.initGitHubStorage()
        this.gitHubConfigVisible = false
        this.$message.success('配置已保存')
      } catch (error) {
        this.$message.error('保存配置失败')
      }
    },

    // 显示GitHub文件列表
    async showGitHubFiles() {
      try {
        const { getFileList } = await import('@/api/github')
        this.gitHubFiles = await getFileList()
        this.gitHubFilesVisible = true
      } catch (error) {
        console.error('获取文件列表失败:', error)
        this.$message.error('获取文件列表失败')
      }
    },

    // 打开GitHub文件
    async openGitHubFile(file) {
      try {
        const { getFile } = await import('@/api/github')
        const fileData = await getFile(file.path)
        if (fileData) {
          this.setData(JSON.stringify(fileData.content))
          this.currentFileName = file.name
          this.gitHubFilesVisible = false
          this.$message.success(`已打开: ${file.name}`)
        }
      } catch (error) {
        console.error('打开文件失败:', error)
        this.$message.error('打开文件失败')
      }
    },

    // 保存到GitHub
    async saveToGitHub() {
      try {
        const { getData, storeData } = await import('@/api')
        const data = await getData()
        await storeData(data)
        this.$message.success('已保存到GitHub')
      } catch (error) {
        console.error('保存失败:', error)
        this.$message.error('保存失败')
      }
    },

    // 创建新文件
    async createNewFile() {
      try {
        const { saveFile } = await import('@/api/github')
        const fileName = `mindmap_${Date.now()}.smm`
        const content = exampleData
        const message = `Create new mind map: ${fileName}`
        
        await saveFile(fileName, content, message)
        this.currentFileName = fileName
        this.$bus.$emit('setData', content)
        this.$message.success('新文件已创建')
      } catch (error) {
        console.error('创建文件失败:', error)
        this.$message.error('创建文件失败')
      }
    },

    // 开始自动保存
    startAutoSave() {
      // 每30秒自动保存一次
      this.autoSaveInterval = setInterval(() => {
        if (this.gitHubConfig.owner && this.gitHubConfig.repo && this.gitHubConfig.token) {
          this.saveToGitHub()
        }
      }, 30000)
    },

    // 停止自动保存
    stopAutoSave() {
      if (this.autoSaveInterval) {
        clearInterval(this.autoSaveInterval)
        this.autoSaveInterval = null
      }
    },

    // 渲染数据
    setData(str) {
      try {
        let data = JSON.parse(str)
        if (typeof data !== 'object') {
          throw new Error(this.$t('toolbar.fileContentError'))
        }
        this.$bus.$emit('setData', data)
      } catch (error) {
        console.log(error)
        this.$message.error(this.$t('toolbar.fileOpenFailed'))
      }
    },

    onNodeNoteDblclick(node, e) {
      e.stopPropagation()
      this.$bus.$emit('showNodeNote', node)
    }
  }
}
</script>

<style lang="less" scoped>
.toolbarContainer {
  &.isDark {
    .toolbar {
      color: hsla(0, 0%, 100%, 0.9);
      .toolbarBlock {
        background-color: #262a2e;

        .fileTreeBox {
          background-color: #262a2e;

          /deep/ .el-tree {
            background-color: #262a2e;

            &.el-tree--highlight-current {
              .el-tree-node.is-current > .el-tree-node__content {
                background-color: hsla(0, 0%, 100%, 0.05) !important;
              }
            }

            .el-tree-node:focus > .el-tree-node__content {
              background-color: hsla(0, 0%, 100%, 0.05) !important;
            }

            .el-tree-node__content:hover,
            .el-upload-list__item:hover {
              background-color: hsla(0, 0%, 100%, 0.02) !important;
            }
          }

          .fileTreeWrap {
            .customTreeNode {
              .treeNodeInfo {
                color: #fff;
              }

              .treeNodeBtnList {
                .el-button {
                  padding: 7px 5px;
                }
              }
            }
          }
        }
      }

      .toolbarBtn {
        .icon {
          background: transparent;
          border-color: transparent;
        }

        &:hover {
          &:not(.disabled) {
            .icon {
              background: hsla(0, 0%, 100%, 0.05);
            }
          }
        }

        &.disabled {
          color: #54595f;
        }
      }
    }
  }
  .toolbar {
    position: fixed;
    left: 50%;
    transform: translateX(-50%);
    top: 20px;
    width: max-content;
    display: flex;
    font-size: 12px;
    font-family: PingFangSC-Regular, PingFang SC;
    font-weight: 400;
    color: rgba(26, 26, 26, 0.8);
    z-index: 2;

    .toolbarBlock {
      display: flex;
      background-color: #fff;
      padding: 10px 20px;
      border-radius: 6px;
      box-shadow: 0 2px 16px 0 rgba(0, 0, 0, 0.06);
      border: 1px solid rgba(0, 0, 0, 0.06);
      margin-right: 20px;
      flex-shrink: 0;
      position: relative;

      &:last-of-type {
        margin-right: 0;
      }

      .fileTreeBox {
        position: absolute;
        left: 0;
        top: 68px;
        width: 100%;
        height: 30px;
        background-color: #fff;
        padding: 12px 5px;
        padding-top: 0;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        border-radius: 5px;
        min-width: 200px;
        box-shadow: 0 2px 16px 0 rgba(0, 0, 0, 0.06);

        &.expand {
          height: 300px;

          .fileTreeWrap {
            visibility: visible;
          }
        }

        .fileTreeToolbar {
          width: 100%;
          height: 30px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #e9e9e9;
          margin-bottom: 12px;
          padding-left: 12px;

          .fileTreeName {
          }

          .fileTreeActionList {
            .btn {
              font-size: 18px;
              margin-left: 12px;
              cursor: pointer;
            }
          }
        }

        .fileTreeWrap {
          width: 100%;
          height: 100%;
          overflow: auto;
          visibility: hidden;

          .customTreeNode {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 13px;
            padding-right: 5px;

            .treeNodeInfo {
              display: flex;
              align-items: center;

              .treeNodeIcon {
                margin-right: 5px;
                opacity: 0.7;
              }

              .treeNodeName {
                max-width: 200px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
              }
            }

            .treeNodeBtnList {
              display: flex;
              align-items: center;
            }
          }
        }
      }
    }

    .toolbarBtn {
      display: flex;
      justify-content: center;
      flex-direction: column;
      cursor: pointer;
      margin-right: 20px;

      &:last-of-type {
        margin-right: 0;
      }

      &:hover {
        &:not(.disabled) {
          .icon {
            background: #f5f5f5;
          }
        }
      }

      &.active {
        .icon {
          background: #f5f5f5;
        }
      }

      &.disabled {
        color: #bcbcbc;
        cursor: not-allowed;
        pointer-events: none;
      }

      .icon {
        display: flex;
        height: 26px;
        background: #fff;
        border-radius: 4px;
        border: 1px solid #e9e9e9;
        justify-content: center;
        flex-direction: column;
        text-align: center;
        padding: 0 5px;
      }

      .text {
        margin-top: 3px;
      }
    }
  }
}
</style>
