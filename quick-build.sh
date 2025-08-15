#!/bin/bash

# 快速构建脚本 - 使用国内镜像源解决构建卡住问题
echo "===== 快速构建脚本 ====="

# 启用BuildKit
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# 设置构建参数
export BUILDKIT_PROGRESS=plain
# 清理Docker缓存以避免潜在问题
docker system prune -f --volumes

# 直接使用docker命令构建，跳过docker-compose
echo "正在构建应用..."
docker build \
  --build-arg BUILDKIT_INLINE_CACHE=1 \
  --progress=plain \
  -t mind-map:latest .

# 运行容器
echo "正在启动应用..."
docker run -d \
  --name mind-map \
  -p 8080:80 \
  -e NODE_ENV=production \
  --restart unless-stopped \
  mind-map:latest

echo "===== 构建完成 ====="
echo "应用已启动，访问 http://localhost:8080 查看"