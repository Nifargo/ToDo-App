#!/usr/bin/env python3
"""
Генератор іконок для PWA ToDo додатку
Створює всі необхідні іконки для iOS та Android
"""

from PIL import Image, ImageDraw, ImageFont
import os

# Розміри іконок
SIZES = [72, 96, 128, 144, 152, 167, 180, 192, 512]

# Кольори
PRIMARY_COLOR = (99, 102, 241)  # #6366f1
SECONDARY_COLOR = (139, 92, 246)  # #8b5cf6

def create_icon(size):
    """Створює іконку заданого розміру"""
    # Створюємо зображення з градієнтом
    image = Image.new('RGB', (size, size), PRIMARY_COLOR)
    draw = ImageDraw.Draw(image)

    # Малюємо градієнт
    for y in range(size):
        ratio = y / size
        r = int(PRIMARY_COLOR[0] + (SECONDARY_COLOR[0] - PRIMARY_COLOR[0]) * ratio)
        g = int(PRIMARY_COLOR[1] + (SECONDARY_COLOR[1] - PRIMARY_COLOR[1]) * ratio)
        b = int(PRIMARY_COLOR[2] + (SECONDARY_COLOR[2] - PRIMARY_COLOR[2]) * ratio)
        draw.line([(0, y), (size, y)], fill=(r, g, b))

    # Малюємо галочку
    line_width = max(2, size // 20)
    check_points = [
        (size * 0.25, size * 0.5),
        (size * 0.4, size * 0.65),
        (size * 0.75, size * 0.35)
    ]

    # Товста біла галочка
    draw.line([check_points[0], check_points[1]], fill='white', width=line_width)
    draw.line([check_points[1], check_points[2]], fill='white', width=line_width)

    # Округлені кути (опціонально для більших іконок)
    if size >= 192:
        # Створюємо маску для округлених кутів
        mask = Image.new('L', (size, size), 0)
        mask_draw = ImageDraw.Draw(mask)
        radius = size // 5
        mask_draw.rounded_rectangle([(0, 0), (size, size)], radius=radius, fill=255)

        # Застосовуємо маску
        rounded = Image.new('RGB', (size, size), (255, 255, 255))
        rounded.paste(image, (0, 0))
        image = rounded

    return image

def main():
    """Головна функція"""
    # Створюємо папку icons якщо не існує
    icons_dir = 'icons'
    if not os.path.exists(icons_dir):
        os.makedirs(icons_dir)

    print("🎨 Генерація іконок для PWA...")
    print("=" * 50)

    # Генеруємо іконки всіх розмірів
    for size in SIZES:
        icon = create_icon(size)
        filename = f'{icons_dir}/icon-{size}.png'
        icon.save(filename, 'PNG')
        print(f"✅ Створено: {filename} ({size}x{size})")

    print("=" * 50)
    print(f"🎉 Успішно створено {len(SIZES)} іконок!")
    print(f"📁 Всі іконки збережено в папці: {icons_dir}/")
    print("\n📱 Тепер можете запустити додаток:")
    print("   ./start-server.sh")
    print("   або")
    print("   python3 -m http.server 8000")

if __name__ == '__main__':
    try:
        main()
    except ImportError:
        print("❌ Помилка: Потрібна бібліотека Pillow")
        print("\nВстановіть її командою:")
        print("   pip3 install Pillow")
        print("\nАбо використайте generate-icons.html в браузері")