МАТЕРИАЛЫ ДЛЯ КАРТОЧЕК RUSTORE И GOOGLE PLAY
(сгенерировано tools/store-assets.js — команда npm run store:assets)

ЧТО ГДЕ ЗАЛИВАТЬ
  icon-512.png            иконка: RuStore 512×512 (png/jpg), Google Play 512×512 (32-bit PNG)
  feature-graphic.jpg     баннер: только Google Play, 1024×500, JPEG (без альфа-канала)
  screens-9x16/*.jpg      скриншоты 1080×1920 (9:16), JPEG: RuStore (до 5 МБ) и Google Play
  card.txt                тексты: название, краткое/полное описание, «что нового», FAQ

ФАЙЛЫ (2 шт.)
  store/icon-512.png
  store/feature-graphic.jpg

НАПОМИНАНИЯ
  • Порядок скриншотов = порядок в карточке: сначала меню, карта и дом.
  • Google Play не принимает PNG с альфа-каналом для скриншотов — у нас JPEG.
  • RuStore обрезает картинки не в 9:16 — у нас ровно 9:16, обрезки не будет.
  • Если игра изменилась — перегенерируйте: npm run store:assets
  • Подробная инструкция по публикации — файл how_to.txt в папке gopher
    (рядом с проектом gopher-life).
