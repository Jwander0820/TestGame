@echo off
setlocal
cd /d "%~dp0"

set "CHECK_ONLY=0"
set "RUNTIME_KIND="
set "SYSTEM_STATUS=missing"
if /i "%~1"=="--check" set "CHECK_ONLY=1"

where node >nul 2>&1
if errorlevel 1 goto codex_runtime
set "SYSTEM_STATUS=missing-npm"
where npm >nul 2>&1
if errorlevel 1 goto codex_runtime
set "SYSTEM_STATUS=unsupported"
node -e "const [major, minor] = process.versions.node.split('.').map(Number); process.exit((major === 20 && minor >= 19) || major > 22 || (major === 22 && minor >= 12) ? 0 : 1)" >nul 2>&1
if errorlevel 1 goto codex_runtime
set "RUNTIME_KIND=system"
goto runtime_ready

:codex_runtime
set "CODEX_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin"
set "CODEX_PNPM=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd"

if not exist "%CODEX_NODE%\node.exe" goto missing_runtime
if not exist "%CODEX_PNPM%" goto missing_runtime
set "PATH=%CODEX_NODE%;%PATH%"
node -e "const [major, minor] = process.versions.node.split('.').map(Number); process.exit((major === 20 && minor >= 19) || major > 22 || (major === 22 && minor >= 12) ? 0 : 1)" >nul 2>&1
if errorlevel 1 goto missing_runtime
set "RUNTIME_KIND=codex"

:runtime_ready
for /f "delims=" %%V in ('node --version') do set "NODE_VERSION=%%V"
echo [Play] Runtime: %RUNTIME_KIND% Node.js %NODE_VERSION%

if not exist "node_modules\.bin\vite.cmd" goto dependencies_missing
if not exist "node_modules\.bin\tsc.cmd" goto dependencies_missing
if not exist "node_modules\.bin\vitest.cmd" goto dependencies_missing
if not exist "node_modules\phaser\package.json" goto dependencies_missing
goto dependencies_ready

:dependencies_missing
if "%CHECK_ONLY%"=="1" goto dependencies_missing_check

echo [Play] Project packages are missing. Installing them now...
if "%RUNTIME_KIND%"=="codex" goto install_with_pnpm
call npm install --no-package-lock --no-audit --no-fund
if errorlevel 1 goto dependency_install_failed
goto dependencies_ready

:install_with_pnpm
call "%CODEX_PNPM%" install --frozen-lockfile
if errorlevel 1 goto dependency_install_failed

:dependencies_ready
if "%CHECK_ONLY%"=="1" goto check_ready
echo [Play] Server starting. Keep this window open while playing.
echo [Play] Open the Local URL printed below, normally http://localhost:5173
if "%RUNTIME_KIND%"=="codex" goto start_with_pnpm
call npm run dev
exit /b %errorlevel%

:start_with_pnpm
call "%CODEX_PNPM%" dev
exit /b %errorlevel%

:check_ready
echo [Check] Project packages: ready
echo [Check] Launcher is ready. Run play-local.cmd without --check to start.
exit /b 0

:dependencies_missing_check
echo [Check] Project packages: missing
echo [Check] Run play-local.cmd normally to install packages and start the game.
exit /b 2

:dependency_install_failed
echo [Play] Package installation failed. Check the network and the messages above.
echo [Play] Nothing was uploaded; packages are installed only under this project.
pause
exit /b 1

:missing_runtime
echo [Play] No supported Node.js runtime was found.
if "%SYSTEM_STATUS%"=="unsupported" echo [Play] The installed Node.js version is too old for this project.
if "%SYSTEM_STATUS%"=="missing-npm" echo [Play] Node.js exists, but npm is unavailable.
echo [Play] Install Node.js LTS, reopen the terminal, and run this file again.
echo [Play] Required: Node.js 20.19 or newer supported LTS.
echo [Play] Official download: https://nodejs.org/en/download
pause
exit /b 1
