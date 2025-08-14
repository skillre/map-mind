<template>
  <div
    class="toolbarNodeBtnList"
    :class="[dir === 'h' ? 'toolbarNodeBtnListHorizon' : 'toolbarNodeBtnListVertical']"
  >
    <template v-for="item in showBtnList" :key="item.type">
      <el-tooltip
        v-if="dir === 'h'"
        :content="item.name"
        placement="bottom"
        :open-delay="500"
      >
        <div class="toolbarBtn" @click="item.onClick">
          <span class="icon iconfont" :class="item.icon"></span>
        </div>
      </el-tooltip>
      <div
        v-else
        class="toolbarNodeBtn"
        @click="item.onClick"
      >
        <span class="icon iconfont" :class="item.icon"></span>
        <span class="text">{{ item.name }}</span>
      </div>
    </template>
  </div>
</template>

<script>
import { mapState, mapMutations } from 'vuex'

export default {
  props: {
    dir: {
      type: String,
      default: 'h'
    },
    list: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      // 定义按钮配置
      btnList: [
        {
          type: 'back',
          icon: 'iconundo',
          name: this.$t('toolbar.undo'),
          onClick: () => {
            this.$bus.$emit('execCommand', 'BACK')
          }
        },
        {
          type: 'forward',
          icon: 'iconredo',
          name: this.$t('toolbar.redo'),
          onClick: () => {
            this.$bus.$emit('execCommand', 'FORWARD')
          }
        },
        {
          type: 'painter',
          icon: 'iconbiancheng',
          name: this.$t('toolbar.painter'),
          onClick: () => {
            this.$bus.$emit('execCommand', 'PAINTER')
          }
        },
        {
          type: 'siblingNode',
          icon: 'icontongji',
          name: this.$t('toolbar.insertSiblingNode'),
          onClick: () => {
            this.$bus.$emit('execCommand', 'INSERT_SIBLING_NODE')
          }
        },
        {
          type: 'childNode',
          icon: 'iconjiedian',
          name: this.$t('toolbar.insertChildNode'),
          onClick: () => {
            this.$bus.$emit('execCommand', 'INSERT_CHILD_NODE')
          }
        },
        {
          type: 'deleteNode',
          icon: 'iconshanchu',
          name: this.$t('toolbar.deleteNode'),
          onClick: () => {
            this.$bus.$emit('execCommand', 'REMOVE_NODE')
          }
        },
        {
          type: 'image',
          icon: 'icontupian',
          name: this.$t('toolbar.image'),
          onClick: () => {
            this.$store.commit('setActiveSidebar', 'nodeImage')
          }
        },
        {
          type: 'icon',
          icon: 'iconfont icon',
          name: this.$t('toolbar.icon'),
          onClick: () => {
            this.$store.commit('setActiveSidebar', 'nodeIcon')
          }
        },
        {
          type: 'link',
          icon: 'iconchaolian',
          name: this.$t('toolbar.link'),
          onClick: () => {
            this.$store.commit('setActiveSidebar', 'nodeHyperlink')
          }
        },
        {
          type: 'note',
          icon: 'iconflowbranch',
          name: this.$t('toolbar.note'),
          onClick: () => {
            this.$store.commit('setActiveSidebar', 'nodeNote')
          }
        },
        {
          type: 'tag',
          icon: 'iconbiaoqian',
          name: this.$t('toolbar.tag'),
          onClick: () => {
            this.$store.commit('setActiveSidebar', 'nodeTag')
          }
        },
        {
          type: 'summary',
          icon: 'iconsummary',
          name: this.$t('toolbar.summary'),
          onClick: () => {
            this.$bus.$emit('execCommand', 'INSERT_SUMMARY')
          }
        },
        {
          type: 'associativeLine',
          icon: 'iconlianxian',
          name: this.$t('toolbar.associativeLine'),
          onClick: () => {
            this.$bus.$emit('execCommand', 'INSERT_ASSOCIATIVE_LINE')
          }
        },
        {
          type: 'formula',
          icon: 'iconfont icon-gongshi',
          name: this.$t('toolbar.formula'),
          onClick: () => {
            this.$store.commit('setActiveSidebar', 'formula')
          }
        },
        {
          type: 'outerFrame',
          icon: 'iconwaijian',
          name: this.$t('toolbar.outerFrame'),
          onClick: () => {
            this.$bus.$emit('execCommand', 'INSERT_OUTER_FRAME')
          }
        },
        {
          type: 'annotation',
          icon: 'iconzhushi',
          name: '注释',
          onClick: () => {
            this.$bus.$emit('execCommand', 'INSERT_ANNOTATION')
          }
        },
        {
          type: 'ai',
          icon: 'iconAI',
          name: this.$t('toolbar.ai'),
          onClick: () => {
            this.$store.commit('setActiveSidebar', 'ai')
          }
        },
        // GitHub相关按钮
        {
          type: 'githubConfig',
          icon: 'icondakai',
          name: 'GitHub配置',
          onClick: () => {
            this.$parent.initGitHub()
          }
        },
        {
          type: 'githubNew',
          icon: 'iconxinjian',
          name: this.$t('toolbar.newFile'),
          onClick: () => {
            this.$parent.createNewGitHubFile()
          }
        },
        {
          type: 'githubOpen',
          icon: 'iconwenjian1',
          name: this.$t('toolbar.openFile'),
          onClick: () => {
            this.$parent.openGitHubFile()
          }
        },
        {
          type: 'githubSave',
          icon: 'iconlingcunwei',
          name: '保存到GitHub',
          onClick: () => {
            this.$parent.saveToGitHubNow()
          }
        },
        {
          type: 'githubLogout',
          icon: 'icongit-logout',
          name: '登出GitHub',
          onClick: () => {
            this.$parent.logoutGitHub()
          }
        }
      ]
    }
  },
  computed: {
    ...mapState({
      isDark: state => state.localConfig.isDark,
      openNodeRichText: state => state.localConfig.openNodeRichText,
      enableAi: state => state.localConfig.enableAi
    }),
    showBtnList() {
      return this.btnList.filter(item => {
        // 检查是否在传入的列表中
        if (!this.list.includes(item.type)) return false
        
        // 特殊按钮的显示条件
        if (item.type === 'formula' && !this.openNodeRichText) {
          return false
        }
        
        if (item.type === 'ai' && !this.enableAi) {
          return false
        }
        
        // GitHub按钮始终显示
        if (['githubConfig', 'githubNew', 'githubOpen', 'githubSave', 'githubLogout'].includes(item.type)) {
          return true
        }
        
        return true
      })
    }
  },
  created() {
    this.$bus.$on('mode_change', this.onModeChange)
    this.$bus.$on('node_active', this.onNodeActive)
    this.$bus.$on('back_forward', this.onBackForward)
    this.$bus.$on('painter_start', this.onPainterStart)
    this.$bus.$on('painter_end', this.onPainterEnd)
  },
  beforeDestroy() {
    this.$bus.$off('mode_change', this.onModeChange)
    this.$bus.$off('node_active', this.onNodeActive)
    this.$bus.$off('back_forward', this.onBackForward)
    this.$bus.$off('painter_start', this.onPainterStart)
    this.$bus.$off('painter_end', this.onPainterEnd)
  },
  methods: {
    ...mapMutations(['setActiveSidebar']),

    // 监听模式切换
    onModeChange(mode) {
      this.readonly = mode === 'readonly'
    },

    // 监听节点激活
    onNodeActive(...args) {
      this.activeNodes = [...args[1]]
    },

    // 监听前进后退
    onBackForward(index, len) {
      this.backEnd = index <= 0
      this.forwardEnd = index >= len - 1
    },

    // 开始格式刷
    onPainterStart() {
      this.isInPainter = true
    },

    // 格式刷结束
    onPainterEnd() {
      this.isInPainter = false
    },

    // 显示节点图标侧边栏
    showNodeIcon() {
      this.$bus.$emit('close_node_icon_toolbar')
      this.setActiveSidebar('nodeIconSidebar')
    },

    // 打开公式侧边栏
    showFormula() {
      this.setActiveSidebar('formulaSidebar')
    },

    // 选择附件
    selectAttachmentFile() {
      this.$bus.$emit('selectAttachment', this.activeNodes)
    },

    // 设置标记
    onSetAnnotation(...args) {
      this.$bus.$emit('execCommand', 'SET_NOTATION', this.activeNodes, ...args)
    },

    // AI生成整体
    aiCrate() {
      this.$bus.$emit('ai_create_all')
    }
  }
}
</script>

<style lang="less">
.toolbarNodeBtnList {
  display: flex;

  &.isDark {
    .toolbarBtn {
      color: hsla(0, 0%, 100%, 0.9);

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
      text-align: center;
    }
  }

  &.v {
    display: block;
    width: 120px;
    flex-wrap: wrap;

    .toolbarBtn {
      flex-direction: row;
      justify-content: flex-start;
      margin-bottom: 10px;
      width: 100%;
      margin-right: 0;

      &:last-of-type {
        margin-bottom: 0;
      }

      .icon {
        margin-right: 10px;
      }

      .text {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
  }
}
</style>
