@echo off
echo.
echo 🚀 Запуск локального сервера для PWA ToDo додатку...
echo.
echo 📱 Після запуску відкрийте в браузері:
echo    http://localhost:8000
echo.
echo 📲 Для встановлення на iPhone:
echo    1. Відкрийте в Safari
echo    2. Натисніть 'Поділитися' 📤
echo    3. Виберіть 'На екран Home'
echo    4. Натисніть 'Додати'
echo.
echo ⚠️  Натисніть Ctrl+C щоб зупинити сервер
echo.

python -m http.server 8000 2>nul
if errorlevel 1 (
    echo ❌ Помилка: Python не знайдено!
    echo    Встановіть Python або використайте Node.js:
    echo    npx http-server -p 8000
    pause
    exit /b 1
)