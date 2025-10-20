#!/bin/bash

echo "🚀 Запуск локального сервера для PWA ToDo додатку..."
echo ""
echo "📱 Після запуску відкрийте в браузері:"
echo "   http://localhost:8000"
echo ""
echo "📲 Для встановлення на iPhone:"
echo "   1. Відкрийте в Safari"
echo "   2. Натисніть 'Поділитися' 📤"
echo "   3. Виберіть 'На екран Home'"
echo "   4. Натисніть 'Додати'"
echo ""
echo "⚠️  Натисніть Ctrl+C щоб зупинити сервер"
echo ""

# Перевірка наявності Python 3
if command -v python3 &> /dev/null; then
    echo "✅ Використовуємо Python 3..."
    python3 -m http.server 8000
# Перевірка наявності Python 2
elif command -v python &> /dev/null; then
    echo "✅ Використовуємо Python 2..."
    python -m SimpleHTTPServer 8000
# Перевірка наявності PHP
elif command -v php &> /dev/null; then
    echo "✅ Використовуємо PHP..."
    php -S localhost:8000
else
    echo "❌ Помилка: Python або PHP не знайдено!"
    echo "   Встановіть Python або PHP, або використайте Node.js:"
    echo "   npx http-server -p 8000"
    exit 1
fi