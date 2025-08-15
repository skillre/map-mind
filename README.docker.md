# Docker 部署指南

本文档提供了使用 Docker 部署思维导图应用的详细说明。

## 环境要求

- Docker 19.03.0+
- Docker Compose 1.27.0+

## 快速开始

### 使用 Docker Compose 部署

1. 克隆仓库

```bash
git clone https://github.com/yourusername/mind-map.git
cd mind-map
```

2. 使用 Docker Compose 构建并启动应用

```bash
docker-compose up -d
```

3. 访问应用

打开浏览器，访问 `http://localhost:8080`

### 使用 Docker 直接部署

1. 构建 Docker 镜像

```bash
docker build -t mind-map .
```

2. 运行容器

```bash
docker run -d -p 8080:80 --name mind-map mind-map
```

3. 访问应用

打开浏览器，访问 `http://localhost:8080`

## 配置选项

### 环境变量

在 `docker-compose.yml` 文件中，你可以设置以下环境变量：

- `NODE_ENV`: 设置 Node.js 环境（默认：production）

### 持久化存储

如果你需要持久化存储数据，可以挂载卷：

```yaml
volumes:
  - ./data:/app/data
```

## GitHub 集成

应用支持与 GitHub 集成，可以直接从 GitHub 仓库读取和保存思维导图文件。

### 配置 GitHub 集成

1. 在应用界面中点击 "GitHub" 按钮
2. 输入你的 GitHub 个人访问令牌（需要 repo 权限）
3. 填写仓库所有者、仓库名称和分支名称
4. 设置当前文件名和是否自动保存
5. 点击确定保存配置

## 故障排除

### 容器无法启动

检查 Docker 日志：

```bash
docker logs mind-map
```

### 应用无法访问

1. 确认容器正在运行：

```bash
docker ps | grep mind-map
```

2. 检查端口映射是否正确：

```bash
docker port mind-map
```

## 更新应用

1. 拉取最新代码

```bash
git pull
```

2. 重新构建并启动容器

```bash
docker-compose up -d --build
```

## 安全注意事项

- 应用在容器内以非 root 用户 (nginx) 运行，提高安全性
- 定期更新基础镜像以获取安全补丁
- 不要在公共环境中暴露 GitHub 个人访问令牌