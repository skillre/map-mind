#!/bin/bash

# 思维导图应用Docker部署测试脚本

echo "开始测试Docker部署..."

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ 错误: Docker未安装"
    exit 1
fi

# 检查Docker Compose是否安装
if ! command -v docker-compose &> /dev/null; then
    echo "❌ 错误: Docker Compose未安装"
    exit 1
fi

echo "✅ Docker环境检查通过"

# 构建Docker镜像
echo "正在构建Docker镜像..."
if ! docker build -t mind-map-test .; then
    echo "❌ 错误: Docker镜像构建失败"
    exit 1
fi

echo "✅ Docker镜像构建成功"

# 使用Docker Compose启动服务
echo "正在使用Docker Compose启动服务..."
if ! docker-compose up -d; then
    echo "❌ 错误: Docker Compose启动失败"
    exit 1
fi

echo "✅ Docker Compose启动成功"

# 等待服务启动
echo "等待服务启动..."
sleep 10

# 检查容器是否运行
if ! docker ps | grep mind-map > /dev/null; then
    echo "❌ 错误: 容器未运行"
    docker-compose logs
    docker-compose down
    exit 1
fi

echo "✅ 容器正在运行"

# 检查服务是否可访问
echo "检查服务是否可访问..."
if ! curl -s http://localhost:8080 | grep -q "<title>"; then
    echo "❌ 错误: 服务不可访问"
    docker-compose logs
    docker-compose down
    exit 1
fi

echo "✅ 服务可以正常访问"

# 停止并删除容器
echo "清理测试环境..."
docker-compose down

echo "🎉 Docker部署测试成功!"