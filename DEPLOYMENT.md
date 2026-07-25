# Flow Ubuntu 服务器部署指南

## 前置要求

- Ubuntu 20.04+ 或更高版本
- Node.js 18.0.0 或更高版本
- Git
- Docker 和 Docker Compose（可选，用于容器化部署）
- pnpm 包管理器

## 方案一：Docker 部署（推荐）

### 1. 安装 Docker 和 Docker Compose

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装必要依赖
sudo apt install -y curl git

# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 启动 Docker 并设置开机自启
sudo systemctl start docker
sudo systemctl enable docker

# 将当前用户添加到 docker 组（避免每次都使用 sudo）
sudo usermod -aG docker $USER

# 重新登录以使组权限生效
exit
# 重新登录服务器

# 安装 Docker Compose
sudo apt install -y docker-compose-plugin
```

### 2. 克隆项目

```bash
git clone https://github.com/pacexy/flow.git
cd flow
```

### 3. 配置环境变量

```bash
# 配置 Reader 应用
cp apps/reader/.env.local.example apps/reader/.env.local
nano apps/reader/.env.local

# 配置 Website 应用
cp apps/website/.env.local.example apps/website/.env.local
nano apps/website/.env.local
```

根据需要修改 `.env.local` 文件中的变量。

### 4. 使用 Docker Compose 启动

```bash
# 构建并启动所有服务
docker compose up -d

# 查看运行状态
docker compose ps

# 查看日志
docker compose logs -f
```

### 5. 访问应用

- Reader 应用: `http://服务器IP:3000`
- Website 应用: 需要根据实际配置访问

### 6. 常用 Docker 命令

```bash
# 停止服务
docker compose stop

# 启动服务
docker compose start

# 重启服务
docker compose restart

# 停止并删除容器
docker compose down

# 重新构建并启动
docker compose up -d --build

# 查看特定服务的日志
docker compose logs -f reader
docker compose logs -f website
```

---

## 方案二：直接部署（无 Docker）

### 1. 安装 Node.js 18+

```bash
# 使用 NodeSource 仓库安装 Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 验证安装
node -v
npm -v
```

### 2. 安装 pnpm

```bash
# 使用 npm 安装 pnpm
npm install -g pnpm

# 验证安装
pnpm -v
```

### 3. 安装 PM2（进程管理器）

```bash
npm install -g pm2
```

### 4. 克隆项目

```bash
git clone https://github.com/pacexy/flow.git
cd flow
```

### 5. 配置环境变量

```bash
# 配置 Reader 应用
cp apps/reader/.env.local.example apps/reader/.env.local
nano apps/reader/.env.local

# 配置 Website 应用
cp apps/website/.env.local.example apps/website/.env.local
nano apps/website/.env.local
```

### 6. 安装依赖

```bash
pnpm install
```

### 7. 构建项目

```bash
pnpm build
```

### 8. 使用 PM2 启动应用

```bash
# 创建 PM2 配置文件 ecosystem.config.js
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'flow-reader',
      script: 'node',
      args: 'apps/reader/.next/standalone/server.js',
      cwd: '/path/to/flow',
      env: {
        NODE_ENV: 'production',
        PORT: 7127
      }
    },
    {
      name: 'flow-website',
      script: 'node',
      args: 'apps/website/.next/standalone/server.js',
      cwd: '/path/to/flow',
      env: {
        NODE_ENV: 'production',
        PORT: 7117
      }
    }
  ]
}
EOF

# 替换 /path/to/flow 为你的实际项目路径
# 修改 ecosystem.config.js 中的路径

# 启动应用
pm2 start ecosystem.config.js

# 保存 PM2 配置
pm2 save

# 设置 PM2 开机自启
pm2 startup
```

### 9. 配置反向代理（Nginx）

```bash
# 安装 Nginx
sudo apt install -y nginx

# 创建 Reader 应用的 Nginx 配置
sudo nano /etc/nginx/sites-available/flow-reader

# 添加以下内容
server {
    listen 80;
    server_name reader.yourdomain.com;

    location / {
        proxy_pass http://localhost:7127;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# 创建 Website 应用的 Nginx 配置
sudo nano /etc/nginx/sites-available/flow-website

# 添加以下内容
server {
    listen 80;
    server_name www.yourdomain.com;

    location / {
        proxy_pass http://localhost:7117;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# 启用配置
sudo ln -s /etc/nginx/sites-available/flow-reader /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/flow-website /etc/nginx/sites-enabled/

# 测试 Nginx 配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

### 10. 配置 SSL 证书（Let's Encrypt）

```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取 SSL 证书
sudo certbot --nginx -d reader.yourdomain.com -d www.yourdomain.com

# 自动续期
sudo certbot renew --dry-run
```

### 11. PM2 常用命令

```bash
# 查看应用状态
pm2 status

# 查看日志
pm2 logs

# 重启应用
pm2 restart flow-reader
pm2 restart flow-website

# 停止应用
pm2 stop flow-reader
pm2 stop flow-website 

# 删除应用
pm2 delete flow-reader

# 监控
pm2 monit
```

---

## 防火墙配置

```bash
# 如果使用 UFW
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# 如果使用 iptables
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
```

---

## 更新部署

### Docker 方式

```bash
cd flow
git pull
docker compose down
docker compose up -d --build
```

### PM2 方式

```bash
cd flow
git pull
pnpm install
pnpm build
pm2 restart flow-reader flow-website
```

---

## 故障排查

### 查看日志

```bash
# Docker 方式
docker compose logs -f

# PM2 方式
pm2 logs
```

### 检查端口占用

```bash
sudo netstat -tulpn | grep :7127
sudo netstat -tulpn | grep :7117
```

### 检查服务状态

```bash
# Docker
docker compose ps

# PM2
pm2 status

# Nginx
sudo systemctl status nginx
```

---

## 注意事项

1. 确保服务器有足够的内存和存储空间
2. 定期备份数据
3. 保持系统和依赖包更新
4. 生产环境建议使用 HTTPS
5. 配置适当的日志轮转策略