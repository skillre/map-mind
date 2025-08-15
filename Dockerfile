FROM nginx:alpine

# 设置工作目录
WORKDIR /app

# 复制nginx配置文件
COPY nginx.conf /etc/nginx/nginx.conf

# 复制前端静态文件
COPY ./index.html ./
COPY ./dist ./dist

# 创建非root用户以提高安全性
RUN addgroup -g 1001 -S nginx && \
    adduser -S nginx -u 1001 -G nginx && \
    chown -R nginx:nginx /app && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d

# 设置用户
USER nginx

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider localhost:80 || exit 1

# 暴露端口
EXPOSE 80

# 启动nginx
CMD ["nginx", "-g", "daemon off;"]