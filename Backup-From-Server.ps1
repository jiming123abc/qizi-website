# PowerShell 脚本：从服务器下载备份
$server = "root@45.77.46.164"
$remoteBackupDir = "/root/website-backups"
$localBackupDir = Join-Path $PSScriptRoot "server-backups"

# 创建本地备份目录
if (-not (Test-Path $localBackupDir)) {
    New-Item -ItemType Directory -Path $localBackupDir | Out-Null
    Write-Host "📁 创建本地备份目录：$localBackupDir"
}

Write-Host "🚀 开始从服务器下载备份..."
Write-Host "🔌 连接服务器：$server"
Write-Host ""

# 获取最新的备份文件
Write-Host "📋 获取备份文件列表..."
$backupFiles = ssh $server "ls -t $remoteBackupDir/*.tar.gz"
if (-not $backupFiles) {
    Write-Host "❌ 未找到备份文件！"
    exit 1
}

$latestBackup = ($backupFiles -split "\n")[0]
Write-Host "✅ 最新备份：$latestBackup"
Write-Host ""

# 下载备份文件
Write-Host "📥 下载备份文件..."
$backupFilename = Split-Path $latestBackup -Leaf
$localPath = Join-Path $localBackupDir $backupFilename

try {
    scp "${server}:${latestBackup}" $localPath
    Write-Host ""
    Write-Host "✅ 下载成功！"
    Write-Host "📦 本地路径：$localPath"
    
    $fileSize = (Get-Item $localPath).Length
    $fileSizeMB = [math]::Round($fileSize / 1MB, 2)
    Write-Host "📊 文件大小：$fileSizeMB MB"
}
catch {
    Write-Host "❌ 下载失败：$_"
    exit 1
}

Write-Host ""
Write-Host "🎉 备份完成！"
Write-Host ""
Write-Host "💡 提示："
Write-Host "   本地备份目录：$localBackupDir"
Write-Host "   所有本地备份："
Get-ChildItem $localBackupDir -Filter "*.tar.gz" | Sort-Object LastWriteTime -Descending | Select-Object -First 5 | ForEach-Object {
    $sizeMB = [math]::Round($_.Length / 1MB, 2)
    $timeStr = $_.LastWriteTime.ToString("yyyy-MM-dd HH:mm:ss")
    Write-Host "   - $($_.Name) ($sizeMB MB, $timeStr)"
}
