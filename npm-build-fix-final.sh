#!/bin/bash

set -e

echo "===== 综合修复npm构建问题 ====="

# 设置颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# 确保脚本可执行
chmod +x "$0"

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo -e "${RED}错误: Docker未安装，请先安装Docker${NC}"
    exit 1
fi

# 启用BuildKit
export DOCKER_BUILDKIT=1
export BUILDKIT_PROGRESS=plain

# 清理Docker缓存
echo -e "${YELLOW}正在清理Docker缓存...${NC}"
docker system prune -f

# 检查项目结构
echo -e "${YELLOW}检查项目结构...${NC}"
if [ ! -d "./web" ]; then
    echo -e "${RED}错误: 未找到web目录，请确保在正确的项目根目录运行此脚本${NC}"
    exit 1
fi

if [ ! -f "./copy.js" ]; then
    echo -e "${RED}错误: 未找到copy.js文件，请确保文件存在${NC}"
    exit 1
fi

# 检查package.json
echo -e "${YELLOW}检查package.json...${NC}"
if [ ! -f "./web/package.json" ]; then
    echo -e "${RED}错误: 未找到web/package.json文件${NC}"
    exit 1
fi

# 检查构建脚本
echo -e "${YELLOW}检查构建脚本...${NC}"
BUILD_SCRIPT=$(grep '"build":' ./web/package.json | cut -d '"' -f 4)
echo -e "构建脚本: ${GREEN}$BUILD_SCRIPT${NC}"

# 检查是否包含copy.js
if [[ $BUILD_SCRIPT == *"copy.js"* ]]; then
    echo -e "${GREEN}构建脚本包含copy.js引用${NC}"
else
    echo -e "${YELLOW}警告: 构建脚本可能缺少copy.js引用${NC}"
    # 创建备份
    cp ./web/package.json ./web/package.json.bak
    # 修改构建脚本
    sed -i 's/"build": ".*"/"build": "vue-cli-service build \&\& node ..\/copy.js"/' ./web/package.json
    echo -e "${GREEN}已修复构建脚本${NC}"
fi

# 尝试本地构建
echo -e "${YELLOW}尝试本地构建...${NC}"
cd web

# 清理npm缓存
echo -e "${YELLOW}清理npm缓存...${NC}"
npm cache clean --force

# 安装依赖
echo -e "${YELLOW}安装依赖...${NC}"
npm install

# 检查vue-cli-service
VUE_CLI_SERVICE="./node_modules/.bin/vue-cli-service"
if [ ! -f "$VUE_CLI_SERVICE" ]; then
    echo -e "${RED}错误: 未找到vue-cli-service，尝试重新安装${NC}"
    npm install @vue/cli-service
fi

# 尝试构建
echo -e "${YELLOW}尝试本地构建...${NC}"
npm run build || {
    echo -e "${RED}本地构建失败，尝试单独执行vue-cli-service${NC}"
    $VUE_CLI_SERVICE build --mode development
    cd ..
    node copy.js
}

# 返回项目根目录
cd ..

# 修复Dockerfile
echo -e "${YELLOW}检查Dockerfile...${NC}"
if [ -f "./Dockerfile" ]; then
    # 创建备份
    cp ./Dockerfile ./Dockerfile.bak
    
    # 检查是否需要修复
    if ! grep -q "COPY . /app/" ./Dockerfile; then
        echo -e "${YELLOW}修复Dockerfile中的文件复制顺序...${NC}"
        sed -i 's/COPY web\/package\*\.json \.\//#COPY web\/package\*\.json \.\/\n# 复制所有项目文件，确保copy.js可用\nCOPY . \/app\/\n\n# 进入web目录\nWORKDIR \/app\/web/' ./Dockerfile
    fi
    
    # 检查构建命令
    if ! grep -q "RUN npm run build || (echo \"构建失败" ./Dockerfile; then
        echo -e "${YELLOW}修复Dockerfile中的构建命令...${NC}"
        sed -i 's/RUN npm run build/RUN npm run build || (echo "构建失败，查看日志" \&\& exit 1)/' ./Dockerfile
    fi
    
    # 检查部署阶段的文件复制
    if ! grep -q "COPY --from=builder /app/index.html ./index.html" ./Dockerfile; then
        echo -e "${YELLOW}修复Dockerfile中的文件复制路径...${NC}"
        sed -i 's/COPY --from=builder \/app\/dist \.\/dist/COPY --from=builder \/app\/index.html \.\/index.html\nCOPY --from=builder \/app\/web\/dist \.\/dist/' ./Dockerfile
    fi
    
    echo -e "${GREEN}Dockerfile修复完成${NC}"
fi

# 使用Docker构建
echo -e "${YELLOW}使用Docker构建...${NC}"
docker build \
  --no-cache \
  --progress=plain \
  --build-arg NODE_ENV=production \
  --build-arg NPM_CONFIG_LOGLEVEL=error \
  -t map-mind:latest . || {
    echo -e "${RED}Docker构建失败，尝试使用调试版Dockerfile${NC}"
    docker build \
      --no-cache \
      --progress=plain \
      -f Dockerfile.debug \
      -t map-mind:debug .
}

# 检查构建结果
if docker images | grep -q "map-mind"; then
    echo -e "${GREEN}===== Docker构建成功! =====${NC}"
    echo -e "可以使用以下命令运行容器:"
    echo -e "${YELLOW}docker run -p 8080:80 map-mind:latest${NC}"
    echo -e "然后访问 ${GREEN}http://localhost:8080${NC}"
else
    echo -e "${RED}===== Docker构建失败! =====${NC}"
    echo -e "请检查上面的错误信息，或者尝试使用docker-compose:"
    echo -e "${YELLOW}docker-compose -f docker-compose.debug.yml up --build${NC}"
fi