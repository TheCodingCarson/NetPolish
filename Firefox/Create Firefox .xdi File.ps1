# Creates a .xdi file for use in Firefox without needing to use debugging each time
#
# Input is the running directory and output is "NetPolish-Firefox.xpi"
# Excludes Any .ps1 or .md files
#

# PowerShell script for packaging
$sourceDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$zipFile = Join-Path $sourceDir "NetPolish-Firefox.zip"
$destinationFile = Join-Path $sourceDir "NetPolish-Firefox.xpi"
$tempDir = Join-Path $sourceDir "_temp"
New-Item -ItemType Directory -Force -Path $tempDir | Out-Null

$files = Get-ChildItem -Path $sourceDir -Recurse | Where-Object {
    !$_.PSIsContainer -and $_.FullName -notlike "*\_temp\*" -and $_.Extension -ne '.md' -and $_.Extension -ne '.ps1'
}
$totalFiles = $files.Count
$fileCount = 0
Write-Host "Extension packaging... Please Wait..."

foreach ($file in $files) {
    $dest = $file.FullName.Replace($sourceDir, $tempDir)
    if (-Not (Test-Path (Split-Path -Path $dest -Parent))) {
        New-Item -ItemType Directory -Path (Split-Path -Path $dest -Parent) -Force | Out-Null
    }
    Copy-Item -Path $file.FullName -Destination $dest -Force -ErrorAction SilentlyContinue | Out-Null
    $fileCount++
    $percentComplete = ($fileCount / $totalFiles) * 100
    Write-Progress -Activity "Copying files..." -Status "$percentComplete% Complete:" -PercentComplete $percentComplete
}
Compress-Archive -Path "$tempDir\*" -DestinationPath $zipFile -Force | Out-Null
Rename-Item -Path $zipFile -NewName $destinationFile | Out-Null
Remove-Item -Recurse -Force $tempDir | Out-Null

Write-Host "Extension packaged into NetPolish-Firefox.xpi successfully!"