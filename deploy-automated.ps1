# 柒子文化官网 - 自动化部署脚本
# 使用方法：在 PowerShell 中运行 .\deploy-automated.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  🚀 柒子文化官网 - 自动化部署" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$serverIp = "45.77.46.164"
$serverUser = "root"
$packageFile = "qizi-website-20260522_053144.tar.gz"
$deployScript = "server-deploy.sh"

Write-Host "📦 准备上传文件..." -ForegroundColor Yellow
Write-Host "  - 打包文件: $packageFile" -ForegroundColor Gray
Write-Host "  - 部署脚本: $deployScript" -ForegroundColor Gray
Write-Host "  - 服务器: ${serverUser}@${serverIp}" -ForegroundColor Gray
Write-Host ""

Write-Host "⚠️  注意：此脚本需要您手动输入服务器密码" -ForegroundColor Yellow
Write-Host "   密码: xE_8Ues,3uaCx+j2" -ForegroundColor Gray
Write-Host ""

Write-Host "请按以下步骤操作：" -ForegroundColor Cyan
Write-Host ""
Write-Host "1️⃣  上传打包文件：" -ForegroundColor White
Write-Host "   scp `"$packageFile`" ${serverUser}@${serverIp}:/root/" -ForegroundColor Green
Write-Host ""
Write-Host "2️⃣  上传部署脚本：" -ForegroundColor White
Write-Host "   scp `"$deployScript`" ${serverUser}@${serverIp}:/root/" -ForegroundColor Green
Write-Host ""
Write-Host "3️⃣  连接到服务器：" -ForegroundColor White
Write-Host "   ssh ${serverUser}@${serverIp}" -ForegroundColor Green
Write-Host ""
Write-Host "4️⃣  在服务器上执行部署：" -ForegroundColor White
Write-Host "   chmod +x /root/server-deploy.sh" -ForegroundColor Green
Write-Host "   cd /root" -ForegroundColor Green
Write-Host "   ./server-deploy.sh $packageFile" -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 提示：您可以复制上面的命令，分别在 PowerShell 中执行" -ForegroundColor Cyan
Write-Host ""
Write-Host "按任意键打开新的 PowerShell 窗口..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# 打开新的 PowerShell 窗口
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '请依次执行上面的命令'; cd '$(Get-Location)'"
