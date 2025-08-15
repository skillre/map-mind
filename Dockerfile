# 构建阶段
FROM node:16-alpine AS builder

WORKDIR /app

# 复制项目文件
COPY web/package*.json ./

# 安装依赖
RUN npm ci --quiet

# 复制源代码
COPY web/ ./

# 构建应用
RUN npm run build

# 部署阶段
FROM nginx:alpine

# 设置工作目录
WORKDIR /app

# 从构建阶段复制构建结果
COPY --from=builder /app/dist ./dist
COPY ./index.html ./
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