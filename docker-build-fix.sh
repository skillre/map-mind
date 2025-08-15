#!/bin/bash

# 脚本用于解决Docker构建卡住的问题
echo "===== Docker构建优化脚本 ====="

# 检查Docker和Docker Compose是否安装
if ! command -v docker &> /dev/null; then
    echo "错误: Docker未安装，请先安装Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "警告: Docker Compose未安装或不在PATH中，尝试使用docker compose命令"
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

# 启用BuildKit
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# 清理Docker缓存
echo "正在清理Docker缓存..."
docker system prune -f

# 拉取基础镜像
echo "正在预先拉取基础镜像..."
docker pull node:16-alpine
docker pull nginx:alpine

# 设置构建参数
export BUILDKIT_PROGRESS=plain

# 构建应用
echo "正在使用优化参数构建应用..."
$DOCKER_COMPOSE build --no-cache --pull

# 启动应用
echo "正在启动应用..."
$DOCKER_COMPOSE up -d

echo "===== 构建过程完成 ====="
echo "如果仍然遇到问题，请尝试以下解决方案："
echo "1. 检查网络连接，确保可以访问Docker Hub"
echo "2. 尝试使用其他Docker镜像源"
echo "3. 增加Docker资源限制（内存、CPU）"
echo "4. 查看Docker日志获取更多信息: docker logs mind-map"