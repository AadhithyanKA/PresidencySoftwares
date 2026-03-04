@echo off
setlocal

if "%~1"=="" (
  echo Usage:
  echo   push_repo.bat ^<git-remote-url^>
  echo Example:
  echo   push_repo.bat https://github.com/USERNAME/PresidencySoftwares.git
  echo.
  pause
  exit /b 1
)

set REMOTE_URL=%~1

git remote get-url origin >nul 2>&1
if %errorlevel%==0 (
  git remote set-url origin "%REMOTE_URL%"
) else (
  git remote add origin "%REMOTE_URL%"
)

git push -u origin main
pause

