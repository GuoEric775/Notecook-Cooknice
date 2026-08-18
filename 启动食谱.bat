@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Notecook 我的食谱
echo 正在启动 Notecook...
call npm start
if errorlevel 1 (
  echo.
  echo 启动失败!请确认已经安装依赖(运行 npm install)。
  pause
)
