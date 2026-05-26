
# 服务器部署脚本
param(
    [Parameter(Mandatory=$true)]
    [string]$Server
)

Write-Host "正在连接服务器 $Server 并部署..." -ForegroundColor Cyan

$commands = @'
cd /var/www/ai-studio
echo "=== 1. 拉取最新代码 ==="
git pull
echo ""
echo "=== 2. 构建前端 ==="
npm run build
echo ""
echo "=== 3. 重启后端服务 ==="
pm2 restart ai-studio-server
echo ""
echo "=== 部署完成！ ==="
'@

& ssh $Server $commands
