FROM node:alpine AS builder
WORKDIR /app

# 设置 npm 镜像源为淘宝镜像
RUN npm config set registry https://registry.npmmirror.com  

COPY package*.json ./
RUN npm install

# 修正：复制所有源码
COPY . .

ENV NODE_OPTIONS="--max-old-space-size=2048"
RUN npm run build

# 生产阶段
FROM nginx:stable-alpine AS production-stage
# 复制自定义 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf
# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]