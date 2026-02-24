@echo off
chcp 65001 >nul
title Knowledge Maze - Server
echo.
echo  ====================================================
echo   Knowledge Maze - Khoi dong Server
echo  ====================================================
echo.
echo  [1] Dang khoi dong Backend (cong 5000)...
start "Knowledge Maze Backend" python server.py
timeout /t 2 >nul

echo  [2] Mo trinh duyet...
start "" "index.html"

echo.
echo  ====================================================
echo   Server dang chay tai: http://localhost:5000
echo   Admin reset          : http://localhost:5000/api/admin/reset?secret=TEACHER_RESET_2026
echo  ====================================================
echo.
echo  Giu cua so nay mo de server tiep tuc chay.
echo  Dong cua so nay se dung server.
echo.
pause
