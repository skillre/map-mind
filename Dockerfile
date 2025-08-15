# 构建阶段
FROM node:16-alpine AS builder

WORKDIR /app

# 复制所有项目文件，确保copy.js可用
COPY . /app/

# 进入web目录
WORKDIR /app/web

# 设置npm镜像源以加速依赖安装
RUN npm config set registry https://registry.npmmirror.com

# 安装依赖，使用npm install替代npm ci以提高兼容性
RUN npm install --quiet

# 构建应用
RUN npm run build || (echo "构建失败，查看日志" && exit 1)

# 部署阶段
FROM nginx:alpine

# 设置工作目录
WORKDIR /app

# 从构建阶段复制构建结果
COPY --from=builder /app/index.html ./index.html
COPY --from=builder /app/web/dist ./dist
COPY ./nginx.conf /etc/nginx/nginx.conf

# 暴露端口
EXPOSE 80

# 使用非root用户运行nginx
RUN mkdir -p /var/cache/nginx /var/log/nginx /etc/nginx/conf.d && \
    chown -R nginx:nginx /app && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

USER nginx

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1