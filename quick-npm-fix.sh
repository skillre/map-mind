#!/bin/bash

set -e

echo "===== 快速修复npm构建问题 ====="

# 启用BuildKit
export DOCKER_BUILDKIT=1
export BUILDKIT_PROGRESS=plain

# 清理npm缓存
echo "清理npm缓存..."
cd web
npm cache clean --force

# 检查并修复package.json
echo "检查package.json..."
if grep -q "node ../copy.js" package.json; then
  echo "确认构建脚本包含copy.js"
else
  echo "警告: package.json中可能缺少copy.js引用"
  echo "当前构建脚本:"
  grep "\"build\"" package.json
fi

# 安装依赖
echo "安装依赖..."
npm install

# 尝试本地构建
echo "尝试本地构建..."
VUE_CLI_SERVICE="./node_modules/.bin/vue-cli-service"

if [ -f "$VUE_CLI_SERVICE" ]; then
  echo "找到vue-cli-service，尝试直接构建..."
  $VUE_CLI_SERVICE build --mode development
  
  # 检查构建结果
  if [ -d "dist" ]; then
    echo "Vue构建成功，尝试执行copy.js"
    cd ..
    node copy.js
    echo "本地构建完成，现在尝试Docker构建"
  else
    echo "Vue构建失败，检查错误信息"
    exit 1
  fi
else
  echo "未找到vue-cli-service，跳过本地构建"
  cd ..
fi

# 使用Docker构建
echo "使用Docker构建..."
docker build \
  --no-cache \
  --progress=plain \
  --build-arg NODE_ENV=production \
  --build-arg NPM_CONFIG_LOGLEVEL=error \
  -t map-mind:latest .

# 检查构建结果
if [ $? -eq 0 ]; then
  echo "===== Docker构建成功! ====="
  echo "可以使用以下命令运行容器:"
  echo "docker run -p 8080:80 map-mind:latest"
else
  echo "===== Docker构建失败! ====="
  echo "尝试使用docker-compose构建..."
  docker-compose build --no-cache
fi