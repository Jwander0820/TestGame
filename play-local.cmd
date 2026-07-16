@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 goto codex_runtime
where npm >nul 2>&1
if errorlevel 1 goto codex_runtime

echo [Play] Starting with system Node.js and npm.
echo [Play] Open http://localhost:5173 after the server starts.
call npm run dev
exit /b

:codex_runtime
set "CODEX_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin"
set "CODEX_PNPM=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd"

if not exist "%CODEX_NODE%\node.exe" goto missing_runtime
if not exist "%CODEX_PNPM%" goto missing_runtime

echo [Play] System Node.js was not found; using the Codex bundled runtime.
echo [Play] Open http://localhost:5173 after the server starts.
set "PATH=%CODEX_NODE%;%PATH%"
call "%CODEX_PNPM%" dev
exit /b

:missing_runtime
echo [Play] No usable Node.js runtime was found.
echo [Play] Install Node.js LTS, reopen the terminal, and run this file again.
echo [Play] Official download: https://nodejs.org/en/download
pause
exit /b 1
