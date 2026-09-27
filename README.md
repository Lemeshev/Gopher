# 🐹 Gopher Life

Игра-питомец с маскотом-гофером: чистый **HTML5 Canvas + vanilla JS**, упакованный в **Android WebView**.
Никаких фреймворков и сборщиков фронтенда — открывается и как веб-страница, и как APK.

## Возможности

- 7 сцен: меню, карта мира, дом, магазин, мини-игры, статистика, поликлиника
- 9 характеристик питомца (счастье, сытость, энергия, здоровье, чистота, интеллект, навыки, стресс)
- Уровни и XP-прогресс, монеты, инвентарь, достижения
- Смена времени суток, офлайн-прогресс, автосохранение в `localStorage`
- Маскот рисуется на canvas с анимацией, эмоциями и аксессуарами
- Звук на Web Audio API (генерируется кодом, без аудиофайлов)

## Структура

```
www/                     исходники игры (открываются в браузере как есть)
  index.html             точка входа, вызывает new Game().init()
  css/style.css
  js/helpers.js          утилиты рисования (roundRect, createButton, ...)
  js/gopher.js           маскот
  js/system.js           характеристики, сохранения, достижения
  js/audio.js            синтез звуков
  js/game_menu.js        + game_map / game_home / game_shop
  js/game_minigames.js   + game_stats / game_clinic
  js/game.js             ядро: цикл, ввод, переходы сцен, туториал
android/                 обёртка WebView + ресурсы (иконка)
tools/verify.js          приёмка качества (4 ревьюера, 51 проверка)
tools/render-gopher.js   рендер маскота в SVG для визуальной проверки
preview/                 готовые превью иконки и маскота
```

`android/app/src/main/assets/www/` — **копия** `www/`. После правок синхронизируйте:
`cp www/js/*.js android/app/src/main/assets/www/js/` (иначе APK уедет со старым кодом).

## Быстрая проверка в браузере (без сборки)

```bash
cd www && python3 -m http.server 8080
# открыть http://localhost:8080
```

## Сборка APK

```bash
cd android
./gradlew assembleRelease      # подписанный релиз
# результат: app/build/outputs/apk/release/app-release.apk
```

### Подпись

Секреты **не хранятся в репозитории**. Создайте `android/keystore.properties`
по шаблону `android/keystore.properties.example`:

```properties
storeFile=gopherlife-release.keystore
storePassword=<ваш пароль>
keyAlias=<алиас>
keyPassword=<ваш пароль>
```

Ключ создаётся один раз:

```bash
keytool -genkeypair -v -keystore android/gopherlife-release.keystore \
  -alias gopherlife -keyalg RSA -keysize 2048 -validity 10000
```

Если файла `keystore.properties` нет, сборка проходит, но APK остаётся
неподписанным (установить на устройство не получится).

## Приёмка качества

Перед выдачей сборки прогоняйте автотесты — они проверяют именно то,
что ломалось в прошлых версиях:

```bash
node tools/verify.js
```

4 независимых ревьюера:

1. **Статический анализ** — синтаксис, синхронность `www/` и `assets/www/`,
   наличие запуска игры, палитра маскота, отсутствие мусора и секретов.
2. **Эмулятор браузера** — реальный boot `new Game().init()` и 630 кадров
   отрисовки по всем 7 сценам (ловит «чёрный экран»), проверка утечек.
3. **Функциональные клики** — навигация меню → карта → дом → магазин →
   статистика → назад и эффект действий (кормление реально повышает сытость).
4. **Целостность APK** — что внутри APK актуальные файлы, есть ресурс иконки
   и сборка подписана, а не debug.

Код выхода `0` — сборку можно отдавать.

## Превью

`preview/launcher-icon.png` — иконка, `preview/gopher-happy.png` — маскот.

## Лицензия

MIT
