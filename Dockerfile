FROM nginx:alpine

# 安装wget用于健康检查
RUN apk add --no-cache wget

# 删除默认的nginx配置
RUN rm /etc/nginx/conf.d/default.conf

# 复制自定义nginx配置文件
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 复制前端静态文件到nginx默认目录
COPY ./index.html /usr/share/nginx/html/
COPY ./dist /usr/share/nginx/html/dist/

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider localhost:80 || exit 1

# 暴露端口
EXPOSE 80

# 启动nginx
CMD ["nginx", "-g", "daemon off;"]