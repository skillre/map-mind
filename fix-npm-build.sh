#!/bin/bash

set -e

echo "===== 开始修复npm构建问题 ====="

# 确保脚本可执行
chmod +x "$0"

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "错误: Docker未安装，请先安装Docker"
    exit 1
fi

# 检查docker-compose是否安装
if ! command -v docker-compose &> /dev/null; then
    echo "错误: docker-compose未安装，请先安装docker-compose"
    exit 1
fi

# 启用BuildKit
export DOCKER_BUILDKIT=1

# 清理Docker缓存
echo "正在清理Docker缓存..."
docker system prune -f

# 预拉取基础镜像
echo "正在预拉取基础镜像..."
docker pull node:16-alpine
docker pull nginx:alpine

# 检查项目结构
echo "检查项目结构..."
if [ ! -d "./web" ]; then
    echo "错误: 未找到web目录，请确保在正确的项目根目录运行此脚本"
    exit 1
fi

if [ ! -f "./copy.js" ]; then
    echo "错误: 未找到copy.js文件，请确保文件存在"
    exit 1
fi

# 检查package.json
echo "检查package.json..."
if [ ! -f "./web/package.json" ]; then
    echo "错误: 未找到web/package.json文件"
    exit 1
fi

# 尝试在本地环境构建
echo "尝试在本地环境构建..."
cd web
npm install

# 检查构建脚本
echo "检查构建脚本..."
BUILD_SCRIPT=$(grep '"build":' package.json | cut -d '"' -f 4)
echo "构建脚本: $BUILD_SCRIPT"

# 修改构建脚本以便调试
echo "修改构建脚本以便调试..."
sed -i.bak 's/"build": ".*"/"build": "vue-cli-service build --mode development && node ../copy.js"/' package.json

# 尝试构建
echo "尝试构建..."
npm run build

# 恢复原始构建脚本
echo "恢复原始构建脚本..."
mv package.json.bak package.json

# 返回项目根目录
cd ..

# 使用Docker构建
echo "使用Docker构建..."
docker build --no-cache --progress=plain -t map-mind:latest .

# 检查构建结果
if [ $? -eq 0 ]; then
    echo "===== Docker构建成功! ====="
    echo "可以使用以下命令运行容器:"
    echo "docker run -p 8080:80 map-mind:latest"
    echo "然后访问 http://localhost:8080"
else
    echo "===== Docker构建失败! ====="
    echo "请检查上面的错误信息"
fi