МАТЕРИАЛЫ ДЛЯ КАРТОЧЕК RUSTORE И GOOGLE PLAY
(сгенерировано tools/store-assets.js — команда npm run store:assets)

ЧТО ГДЕ ЗАЛИВАТЬ
  icon-512.png            иконка: RuStore 512×512 (png/jpg), Google Play 512×512 (32-bit PNG)
  feature-graphic.jpg     баннер: только Google Play, 1024×500, JPEG (без альфа-канала)
  screens-9x16/*.jpg      скриншоты 1080×1920 (9:16), JPEG: RuStore (до 5 МБ) и Google Play
  card.txt                тексты: название, краткое/полное описание, «что нового», FAQ
  CONSOLE_PASTE.txt       лист для копипаста в консоль RuStore: по одному полю за раз

ФАЙЛЫ (12 шт.)
  store/icon-512.png
  store/feature-graphic.jpg
  store/screens-9x16/01_menu.jpg
  store/screens-9x16/02_map.jpg
  store/screens-9x16/03_home.jpg
  store/screens-9x16/04_achievements.jpg
  store/screens-9x16/05_shop.jpg
  store/screens-9x16/06_games.jpg
  store/screens-9x16/07_fishing.jpg
  store/screens-9x16/08_museum.jpg
  store/screens-9x16/09_outfits.jpg
  store/screens-9x16/10_settings.jpg

НАПОМИНАНИЯ
  • RuStore: тип «Игра», категории «Дети» + «Симуляторы», возрастная категория 0+
    (рейтинга «3+» в RuStore нет), маркировка внутриигрового контента — пустая.
  • Порядок скриншотов = порядок в карточке: сначала меню, карта и дом.
  • Google Play не принимает PNG с альфа-каналом для скриншотов — у нас JPEG.
  • RuStore обрезает картинки не в 9:16 — у нас ровно 9:16, обрезки не будет.
  • Если игра изменилась — перегенерируйте: npm run store:assets
  • Подробная инструкция по публикации — файл how_to.txt в папке gopher
    (рядом с проектом gopher-life).
