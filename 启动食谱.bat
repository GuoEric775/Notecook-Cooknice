@echo off
cd /d "%~dp0"
title Notecook
echo Starting Notecook...
call npm start
if errorlevel 1 (
  echo.
  echo Failed! Please run: npm install
  pause
)
