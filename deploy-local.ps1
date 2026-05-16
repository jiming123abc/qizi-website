# 本地部署脚本 - 推送到 GitHub
Write-Host "🚀 开始部署到 GitHub..." -ForegroundColor Green

# 检查 git 状态
Write-Host "`n📊 检查 git 状态..." -ForegroundColor Yellow
git status

# 添加所有更改
Write-Host "`n📝 添加更改..." -ForegroundColor Yellow
git add .

# 提交
$commitMessage = Read-Host "`n请输入提交信息 (默认: 更新网站版本)"
if ([string]::IsNullOrWhiteSpace($commitMessage)) {
    $commitMessage = "更新网站版本：添加数据库功能，完善管理后台"
}
git commit -m $commitMessage

# 推送到 GitHub
Write-Host "`n☁️  推送到 GitHub..." -ForegroundColor Yellow
git push

Write-Host "`n✅ 推送到 GitHub 完成！" -ForegroundColor Green
Write-Host "`n现在请使用 PuTTY 连接服务器并运行服务器端更新脚本。" -ForegroundColor Cyan