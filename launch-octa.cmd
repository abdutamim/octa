@echo off
cd /d "%~dp0"
set OCTA_SKIP_NET_USE=1
npx electron-vite preview
pause
