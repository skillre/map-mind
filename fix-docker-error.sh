#!/bin/bash

# 脚本用于解决Docker构建错误：registry.npmmirror.com/node:16-alpine: not found
echo "===== Docker构建错误修复脚本 ====="

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "错误: Docker未安装，请先安装Docker"
    exit 1
fi

# 检查docker-compose命令
if ! command -v docker-compose &> /dev/null; then
    echo "使用 'docker compose' 命令替代 'docker-compose'"
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

# 启用BuildKit
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# 停止并移除现有容器
echo "正在停止并移除现有容器..."
$DOCKER_COMPOSE down 2>/dev/null || true
docker rm -f mind-map 2>/dev/null || true

# 清理Docker缓存
echo "正在清理Docker缓存..."
docker system prune -f

# 拉取基础镜像
echo "正在预先拉取基础镜像..."
docker pull node:16-alpine
docker pull nginx:alpine

# 检查Dockerfile中是否使用了错误的镜像源
echo "正在检查Dockerfile..."
if grep -q "registry.npmmirror.com" Dockerfile; then
    echo "检测到Dockerfile中使用了registry.npmmirror.com，正在修复..."
    sed -i '' 's|registry.npmmirror.com/node:16-alpine|node:16-alpine|g' Dockerfile
    sed -i '' 's|registry.npmmirror.com/nginx:alpine|nginx:alpine|g' Dockerfile
    echo "Dockerfile已修复"
fi

# 构建应用
echo "正在构建应用..."
$DOCKER_COMPOSE build --no-cache

# 启动应用
echo "正在启动应用..."
$DOCKER_COMPOSE up -d

# 检查应用是否成功启动
echo "正在检查应用是否成功启动..."
sleep 5
if docker ps | grep -q mind-map; then
    echo "✅ 应用已成功启动，访问 http://localhost:8080 查看"
else
    echo "❌ 应用启动失败，请查看日志获取更多信息"
    $DOCKER_COMPOSE logs
fi

echo "===== 修复过程完成 ====="