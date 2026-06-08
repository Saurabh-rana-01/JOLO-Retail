# Run Helper Script for ROIMS Project
# Sets path for local JDK/Maven and executes maven goals.

$ErrorActionPreference = "Stop"

# Define local directories
$ToolsDir = Join-Path -Path $PSScriptRoot -ChildPath ".tools"
$JdkDir = Join-Path -Path $ToolsDir -ChildPath "jdk21"
$MvnDir = Join-Path -Path $ToolsDir -ChildPath "maven"

# Check if setup has been run
if (!(Test-Path -Path $JdkDir) -or !(Test-Path -Path $MvnDir)) {
    Write-Error "Local JDK or Maven not found. Please run .\setup.ps1 first to download the dependencies!"
    exit 1
}

# Configure Local Environment
$env:JAVA_HOME = $JdkDir
$env:PATH = "$JdkDir\bin;$MvnDir\bin;$env:PATH"

# Run Maven Commands
if ($args.Count -eq 0) {
    Write-Host "Running Spring Boot Application..." -ForegroundColor Green
    & mvn spring-boot:run
} else {
    $Command = $args -join " "
    Write-Host "Running: mvn $Command" -ForegroundColor Green
    & mvn @args
}
