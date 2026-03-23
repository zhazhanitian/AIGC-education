# Windows PowerShell 打包脚本 v2.0
# 支持云存储模式
# 在项目根目录运行: .\deploy\pack-for-deploy.ps1

Write-Host "====== 打包 Nano Banana Pro 部署文件 v2.0 ======" -ForegroundColor Cyan

# 设置路径
$projectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $projectRoot

# 1. 构建前端
Write-Host "[1/4] 构建前端..." -ForegroundColor Yellow
Set-Location client
npm run build
Set-Location ..

# 2. 创建部署包
Write-Host "[2/4] 创建部署包..." -ForegroundColor Yellow

# 创建临时目录
$tempDir = "deploy-temp"
if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
New-Item -ItemType Directory -Path $tempDir | Out-Null

# 复制必要文件
Copy-Item "server" -Destination "$tempDir/server" -Recurse
Copy-Item "client/dist" -Destination "$tempDir/client/dist" -Recurse
Copy-Item "package.json" -Destination "$tempDir/"
Copy-Item "deploy/quick-deploy.sh" -Destination "$tempDir/"

# 3. 清理不必要的文件
Write-Host "[3/4] 清理不必要的文件..." -ForegroundColor Yellow

# 排除 node_modules
Get-ChildItem -Path "$tempDir" -Recurse -Directory -Filter "node_modules" | Remove-Item -Recurse -Force

# 排除 storage/images 中的图片（保留目录结构）
$imagesPath = "$tempDir/server/storage/images"
if (Test-Path $imagesPath) {
    Get-ChildItem -Path $imagesPath -File | Remove-Item -Force
    Write-Host "  已清理 storage/images 中的图片" -ForegroundColor Gray
}

# 清空 metadata 和 tasks
$metadataPath = "$tempDir/server/storage/metadata.json"
if (Test-Path $metadataPath) {
    '[]' | Out-File -FilePath $metadataPath -Encoding UTF8 -NoNewline
    Write-Host "  已清空 metadata.json" -ForegroundColor Gray
}
$tasksPath = "$tempDir/server/storage/tasks.json"
if (Test-Path $tasksPath) {
    '[]' | Out-File -FilePath $tasksPath -Encoding UTF8 -NoNewline
    Write-Host "  已清空 tasks.json" -ForegroundColor Gray
}
$usersPath = "$tempDir/server/storage/users.json"
if (Test-Path $usersPath) {
    '[]' | Out-File -FilePath $usersPath -Encoding UTF8 -NoNewline
    Write-Host "  已清空 users.json" -ForegroundColor Gray
}
$sessionsPath = "$tempDir/server/storage/sessions.json"
if (Test-Path $sessionsPath) {
    '{}' | Out-File -FilePath $sessionsPath -Encoding UTF8 -NoNewline
    Write-Host "  已清空 sessions.json" -ForegroundColor Gray
}

# 4. 压缩
Write-Host "[4/4] 压缩文件..." -ForegroundColor Yellow
$zipFile = "nanobanana-deploy.zip"
if (Test-Path $zipFile) { Remove-Item $zipFile -Force }
Compress-Archive -Path "$tempDir/*" -DestinationPath $zipFile

# 清理
Remove-Item $tempDir -Recurse -Force

$fileSize = [math]::Round((Get-Item $zipFile).Length / 1MB, 2)
Write-Host ""
Write-Host "====== 打包完成！ ======" -ForegroundColor Green
Write-Host "文件: $zipFile ($fileSize MB)" -ForegroundColor Cyan
Write-Host ""
Write-Host "上传到服务器:" -ForegroundColor Yellow
Write-Host "  scp $zipFile root@服务器IP:/var/www/" -ForegroundColor White
Write-Host ""
Write-Host "在服务器上执行:" -ForegroundColor Yellow
Write-Host "  cd /var/www" -ForegroundColor White
Write-Host "  rm -rf nanobanana" -ForegroundColor White
Write-Host "  unzip nanobanana-deploy.zip -d nanobanana" -ForegroundColor White
Write-Host "  cd nanobanana && bash quick-deploy.sh 你的域名.com" -ForegroundColor White
Write-Host ""
Write-Host "部署脚本将询问存储模式：" -ForegroundColor Cyan
Write-Host "  1) 本地存储 - 图片保存在服务器本地" -ForegroundColor Gray
Write-Host "  2) 云存储TOS - 图片上传到火山引擎对象存储（推荐）" -ForegroundColor Gray