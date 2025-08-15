# Docker构建问题排查指南

## 常见问题

### 构建卡住在镜像拉取阶段

如果Docker构建过程卡在了镜像拉取阶段（例如`node:16-alpine`或`nginx:alpine`），这通常是由以下原因导致的：

1. **网络连接问题**：无法连接到Docker Hub或连接速度过慢
2. **Docker镜像源问题**：默认的Docker Hub镜像源在某些地区可能访问缓慢
3. **Docker资源限制**：分配给Docker的内存或CPU资源不足
4. **缓存问题**：Docker缓存可能损坏或过大

## 解决方案

### 1. 使用优化后的Dockerfile和docker-compose.yml

我们已经优化了Dockerfile和docker-compose.yml文件，主要改进包括：

- 使用国内npm镜像源加速依赖安装
- 使用`npm install`替代`npm ci`以提高兼容性
- 移除过时的`version`字段
- 添加BuildKit相关配置加速构建
- 限制构建平台为`linux/amd64`

### 2. 使用构建优化脚本

我们提供了一个构建优化脚本`docker-build-fix.sh`，它会：

- 启用BuildKit加速构建
- 清理Docker缓存
- 预先拉取基础镜像
- 使用优化参数构建应用

使用方法：

```bash
# 添加执行权限
chmod +x docker-build-fix.sh

# 运行脚本
./docker-build-fix.sh
```

### 3. 手动解决方案

如果上述方法仍然无法解决问题，可以尝试以下手动步骤：

#### 设置Docker镜像源

创建或编辑`~/.docker/config.json`文件：

```json
{
  "registry-mirrors": [
    "https://registry.docker-cn.com",
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com"
  ]
}
```

#### 增加Docker资源限制

在Docker Desktop的设置中，增加分配给Docker的内存和CPU资源。

#### 完全清理Docker环境

```bash
# 停止所有容器
docker stop $(docker ps -aq)

# 删除所有容器
docker rm $(docker ps -aq)

# 删除所有镜像
docker rmi $(docker images -q)

# 清理所有未使用的对象
docker system prune -a --volumes
```

## 其他提示

- 确保Docker Desktop已更新到最新版本
- 检查网络连接，确保可以访问Docker Hub
- 尝试使用VPN或代理服务器改善网络连接
- 查看Docker日志获取更多信息：`docker logs mind-map`

如果问题仍然存在，请提供完整的构建日志以便进一步分析。