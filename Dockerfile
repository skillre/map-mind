FROM nginx:alpine

# 设置工作目录
WORKDIR /app

# 复制构建后的前端文件
COPY dist/ /app

# 复制nginx配置文件
COPY nginx.conf /etc/nginx/nginx.conf

# 设置文件权限
RUN chown -R nginx:nginx /app

# 暴露端口
EXPOSE 80

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# 启动nginx
CMD ["nginx", "-g", "daemon off;"]