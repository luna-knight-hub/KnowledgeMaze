@echo off
chcp 65001 >nul
title Knowledge Maze - Server
echo.
echo  ====================================================
echo   Knowledge Maze - Khoi dong Server
echo  ====================================================
echo.

REM -- Kich hoat moi truong ao (venv) neu co --
if exist "%~dp0venv\Scripts\activate.bat" (
    echo  [*] Kich hoat moi truong ao (venv)...
    call "%~dp0venv\Scripts\activate.bat"
) else (
    echo  [!] Khong tim thay venv, dung Python he thong.
)

echo  [1] Dang khoi dong Backend (cong 5000)...
start "Knowledge Maze Backend" python server.py
timeout /t 2 >nul

echo  [2] Mo trinh duyet...
start "" "http://localhost:5000"

echo.
echo  ====================================================
echo   Server dang chay tai: http://localhost:5000
echo   Admin reset          : POST /api/admin/reset
echo  ====================================================
echo.
echo  Giu cua so nay mo de server tiep tuc chay.
echo  Dong cua so nay se dung server.
echo.
pause
