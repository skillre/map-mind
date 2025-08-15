<template>
  <el-dialog
    :title="$t('github.configTitle')"
    :visible.sync="dialogVisible"
    width="500px"
    :close-on-click-modal="false"
  >
    <el-form :model="form" label-width="120px" ref="formRef">
      <el-form-item :label="$t('github.token')">
        <el-input
          v-model="form.token"
          :placeholder="$t('github.tokenPlaceholder')"
          show-password
        ></el-input>
        <div class="form-tip">{{ $t('github.tokenTip') }}</div>
      </el-form-item>
      <el-form-item :label="$t('github.owner')">
        <el-input
          v-model="form.owner"
          :placeholder="$t('github.ownerPlaceholder')"
        ></el-input>
      </el-form-item>
      <el-form-item :label="$t('github.repo')">
        <el-input
          v-model="form.repo"
          :placeholder="$t('github.repoPlaceholder')"
        ></el-input>
      </el-form-item>
      <el-form-item :label="$t('github.branch')">
        <el-input
          v-model="form.branch"
          :placeholder="$t('github.branchPlaceholder')"
        ></el-input>
      </el-form-item>
      <el-form-item :label="$t('github.path')">
        <el-input
          v-model="form.path"
          :placeholder="$t('github.pathPlaceholder')"
        ></el-input>
      </el-form-item>
      <el-form-item :label="$t('github.autoSave')">
        <el-switch v-model="form.autoSave"></el-switch>
        <div class="form-tip">{{ $t('github.autoSaveTip') }}</div>
      </el-form-item>
      <el-form-item v-if="form.autoSave" :label="$t('github.autoSaveInterval')">
        <el-input-number
          v-model="form.autoSaveInterval"
          :min="30"
          :max="3600"
          :step="30"
        ></el-input-number>
        <span style="margin-left: 10px">{{ $t('github.seconds') }}</span>
      </el-form-item>
    </el-form>
    <span slot="footer" class="dialog-footer">
      <el-button @click="dialogVisible = false">{{ $t('github.cancel') }}</el-button>
      <el-button type="primary" @click="saveConfig">{{ $t('github.save') }}</el-button>
    </span>
  </el-dialog>
</template>

<script>
import { mapState, mapMutations } from 'vuex'

export default {
  data() {
    return {
      dialogVisible: false,
      form: {
        token: '',
        owner: '',
        repo: '',
        branch: 'main',
        path: 'mind-map.json',
        autoSave: true,
        autoSaveInterval: 300 // 5分钟
      }
    }
  },
  
  computed: {
    ...mapState(['githubConfig'])
  },
  
  watch: {
    githubConfig: {
      handler(val) {
        if (val) {
          this.form = { ...val }
        }
      },
      immediate: true
    }
  },
  
  created() {
    this.$bus.$on('openGithubConfig', this.openDialog)
  },
  
  beforeDestroy() {
    this.$bus.$off('openGithubConfig', this.openDialog)
  },
  
  methods: {
    ...mapMutations(['setGithubConfig']),
    
    openDialog() {
      this.dialogVisible = true
    },
    
    saveConfig() {
      this.setGithubConfig({ ...this.form })
      this.dialogVisible = false
      this.$message.success(this.$t('github.configSaved'))
    }
  }
}
</script>

<style scoped>
.form-tip {
  font-size: 12px;
  color: #999;
  margin-top: 5px;
}
</style>