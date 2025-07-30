# 思维导图 - GitHub存储版本

## 功能特性

- ✅ **GitHub存储**：所有思维导图文件存储在GitHub私人仓库中
- ✅ **实时保存**：每30秒自动保存到GitHub仓库
- ✅ **轻量部署**：基于nginx-alpine的Docker容器，镜像仅约20MB
- ✅ **文件管理**：支持新建、打开、保存GitHub仓库中的文件
- ✅ **快捷键**：Ctrl+S快速保存到GitHub

## 快速开始

### 1. 配置GitHub存储

首次使用时需要配置GitHub信息：

1. 点击工具栏上的"GitHub"按钮
2. 填写以下信息：
   - **用户名**：你的GitHub用户名
   - **仓库名**：存储思维导图的仓库名称
   - **Token**：GitHub Personal Access Token（需要repo权限）
   - **分支**：默认使用main分支

3. 点击"保存"完成配置

### 2. Docker部署

#### 使用Docker Compose（推荐）

```bash
# 构建并启动
docker-compose up -d

# 访问 http://localhost:8080
```

#### 使用Docker

```bash
# 构建镜像
docker build -t mindmap-github .

# 运行容器
docker run -d -p 8080:80 --name mindmap-github mindmap-github
```

### 3. 本地开发

```bash
# 安装依赖
cd web && npm install

# 开发模式
npm run serve

# 构建生产版本
npm run build
```

## GitHub Token获取

1. 访问 [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. 点击"Generate new token (classic)"
3. 选择权限：
   - ✅ repo（完整仓库权限）
   - ✅ user（用户信息）
4. 生成token并保存

## 文件说明

- `Dockerfile`：基于nginx-alpine的轻量级镜像
- `docker-compose.yml`：Docker Compose配置文件
- `web/src/api/github.js`：GitHub API集成
- 所有思维导图文件以`.smm`格式保存在GitHub仓库根目录

## 注意事项

- 确保GitHub仓库已创建且可写入
- Token需要有足够的权限访问指定仓库
- 自动保存间隔为30秒，也可手动Ctrl+S保存
- 文件命名格式：`mindmap_时间戳.smm`

## 技术栈

- **前端**：Vue.js + Element UI
- **存储**：GitHub REST API
- **部署**：Docker + nginx-alpine
- **构建**：webpack

## 许可证

MIT License