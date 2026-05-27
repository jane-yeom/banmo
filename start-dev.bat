@echo off
chcp 65001 > nul
echo =============================================
echo  반모 (Banmo) 개발 서버 시작
echo =============================================
echo.

echo [1/2] 백엔드 서버 시작 중... (http://localhost:3001)
start "반모 백엔드" cmd /k "cd /d D:\git\banmo\backend && npm run start:dev"

echo 백엔드 초기화 대기 중 (3초)...
timeout /t 3 /nobreak > nul

echo [2/2] 프론트엔드 서버 시작 중... (http://localhost:3000)
start "반모 프론트엔드" cmd /k "cd /d D:\git\banmo\frontend && npm run dev"

echo.
echo =============================================
echo  서버 실행 완료!
echo =============================================
echo.
echo  프론트엔드:  http://localhost:3000
echo  백엔드 API:  http://localhost:3001
echo  관리자:      http://localhost:3000/admin/login
echo.
echo  종료하려면 각 cmd 창을 닫으세요.
echo =============================================
pause
