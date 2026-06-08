# Setup Script for Local Java 21 & Maven 3.9.6 Tooling
# Run this script to download and extract portable Java and Maven inside the project folder.

$ErrorActionPreference = "Stop"

# Define local directories
$ToolsDir = Join-Path -Path $PSScriptRoot -ChildPath ".tools"
$JdkDir = Join-Path -Path $ToolsDir -ChildPath "jdk21"
$MvnDir = Join-Path -Path $ToolsDir -ChildPath "maven"

if (!(Test-Path -Path $ToolsDir)) {
    New-Item -ItemType Directory -Path $ToolsDir | Out-Null
    Write-Host "Created tools directory at: $ToolsDir" -ForegroundColor Green
}

# 1. Download and Extract JDK 21 if not present
if (!(Test-Path -Path $JdkDir)) {
    Write-Host "Java 21 not found locally. Downloading portable JDK 21 from Adoptium..." -ForegroundColor Yellow
    $JdkUrl = "https://api.adoptium.net/v3/binary/latest/21/ga/windows/x64/jdk/hotspot/normal/eclipse"
    $JdkZip = Join-Path -Path $ToolsDir -ChildPath "jdk21.zip"
    
    # Download zip
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri $JdkUrl -OutFile $JdkZip -UserAgent "Mozilla/5.0"
    Write-Host "JDK 21 downloaded. Extracting..." -ForegroundColor Yellow
    
    # Extract zip
    $TempExtract = Join-Path -Path $ToolsDir -ChildPath "jdk21_temp"
    if (Test-Path -Path $TempExtract) { Remove-Item -Recurse -Force $TempExtract }
    Expand-Archive -Path $JdkZip -DestinationPath $TempExtract
    
    # Move the inner folder to $JdkDir
    $InnerFolder = Get-ChildItem -Path $TempExtract -Directory | Select-Object -First 1
    Move-Item -Path $InnerFolder.FullName -Destination $JdkDir
    
    # Clean up
    Remove-Item -Path $JdkZip -Force
    Remove-Item -Path $TempExtract -Recurse -Force
    Write-Host "JDK 21 installed successfully at: $JdkDir" -ForegroundColor Green
} else {
    Write-Host "JDK 21 is already installed at: $JdkDir" -ForegroundColor Green
}

# 2. Download and Extract Maven 3.9.6 if not present
if (!(Test-Path -Path $MvnDir)) {
    Write-Host "Maven not found locally. Downloading Apache Maven 3.9.6..." -ForegroundColor Yellow
    $MvnUrl = "https://archive.apache.org/dist/maven/maven-3/3.9.6/binaries/apache-maven-3.9.6-bin.zip"
    $MvnZip = Join-Path -Path $ToolsDir -ChildPath "maven.zip"
    
    # Download zip
    Invoke-WebRequest -Uri $MvnUrl -OutFile $MvnZip -UserAgent "Mozilla/5.0"
    Write-Host "Maven downloaded. Extracting..." -ForegroundColor Yellow
    
    # Extract zip
    $TempExtract = Join-Path -Path $ToolsDir -ChildPath "maven_temp"
    if (Test-Path -Path $TempExtract) { Remove-Item -Recurse -Force $TempExtract }
    Expand-Archive -Path $MvnZip -DestinationPath $TempExtract
    
    # Move the inner folder to $MvnDir
    $InnerFolder = Get-ChildItem -Path $TempExtract -Directory | Select-Object -First 1
    Move-Item -Path $InnerFolder.FullName -Destination $MvnDir
    
    # Clean up
    Remove-Item -Path $MvnZip -Force
    Remove-Item -Path $TempExtract -Recurse -Force
    Write-Host "Maven installed successfully at: $MvnDir" -ForegroundColor Green
} else {
    Write-Host "Maven is already installed at: $MvnDir" -ForegroundColor Green
}

# 3. Verify Installations
Write-Host "`n--- Verification ---" -ForegroundColor Cyan
$env:JAVA_HOME = $JdkDir
$env:PATH = "$JdkDir\bin;$MvnDir\bin;$env:PATH"

$JavaVer = & java -version 2>&1
Write-Host "Java Verification Output:" -ForegroundColor Gray
Write-Host $JavaVer -ForegroundColor DarkGray

$MvnVer = & mvn -version 2>&1
Write-Host "`nMaven Verification Output:" -ForegroundColor Gray
Write-Host $MvnVer -ForegroundColor DarkGray

Write-Host "`nSetup complete! You can run commands using local scripts." -ForegroundColor Green
