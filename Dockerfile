# 使用更轻量的nginx镜像
FROM nginx:alpine

# 设置工作目录
WORKDIR /app

# 安装curl用于健康检查
RUN apk add --no-cache curl

# 复制构建文件
COPY ./dist /app/dist/
COPY ./index.html /app/
COPY ./nginx.conf /etc/nginx/nginx.conf

# 设置健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

# 声明端口
EXPOSE 80

# 启动nginx
CMD ["nginx", "-g", "daemon off;"]