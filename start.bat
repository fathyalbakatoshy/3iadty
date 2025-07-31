@echo off
echo ========================================
echo   3ayadatna Backend Server
echo   منصة عياداتنا - الخادم الخلفي
echo ========================================
echo.

echo Checking Node.js installation...
node --version
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo.
echo Installing dependencies...
npm install

echo.
echo Setting up environment...
if not exist .env (
    copy env-template.txt .env
    echo Please edit .env file with your configuration
    echo ثم قم بتعديل ملف .env حسب إعداداتك
)

echo.
echo Starting server on port 5000...
echo الخادم يعمل على البورت 5000
echo.
echo Health Check: http://localhost:5000/health
echo API Info: http://localhost:5000/api
echo.
echo Press Ctrl+C to stop the server
echo اضغط Ctrl+C لإيقاف الخادم
echo.

npm start 