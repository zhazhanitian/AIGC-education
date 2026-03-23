$projectRoot = $PSScriptRoot
Set-Location $projectRoot

$tempDir = 'deploy-temp'
if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
New-Item -ItemType Directory -Path $tempDir | Out-Null

Copy-Item 'server' -Destination "$tempDir/server" -Recurse
Copy-Item 'client/dist' -Destination "$tempDir/client/dist" -Recurse  
Copy-Item 'package.json' -Destination "$tempDir/"
Copy-Item 'deploy/quick-deploy.sh' -Destination "$tempDir/"

Get-ChildItem -Path $tempDir -Recurse -Directory -Filter 'node_modules' | Remove-Item -Recurse -Force

$imagesPath = "$tempDir/server/storage/images"
if (Test-Path $imagesPath) { Get-ChildItem -Path $imagesPath -File | Remove-Item -Force }

$zipFile = 'nanobanana-deploy.zip'
if (Test-Path $zipFile) { Remove-Item $zipFile -Force }
Compress-Archive -Path "$tempDir/*" -DestinationPath $zipFile -Force

Remove-Item $tempDir -Recurse -Force

Write-Host "Packed to $zipFile"
