// ============ СЦЕНА ПОСЕЩЕНИЯ ЛОКАЦИИ ============
// Музеи — это ХАБ: сначала выбираем музей, потом осматриваем экспонаты.
// Каждое посещение показывает свежую подборку из общей базы контента
// (приоритет отдаётся тем предметам, что ещё не попадались).

// Список музеев берём из MUSEUM_CATEGORIES (game_content.js) — так хаб, звук,
// вкладка «Знания» и достижения всегда согласованы между собой (v1.3.7).
const MUSEUM_KEYS = (typeof MUSEUM_CATEGORIES !== 'undefined') ? MUSEUM_CATEGORIES : [
  'art_museum', 'nature_museum', 'space_museum', 'history_museum'
];

const VISIT_DATA = {
  // ----- ХАБ МУЗЕЕВ -----
  museums: {
    name: '🏛️ Музеи', bg: '#12122a', kind: 'hub',
    intro: 'Какой музей посетим?',
    sub: [
      { id: 'art_museum', emoji: '🖼️', name: 'Художественный', desc: 'Живопись и скульптура', color: '#E91E63' },
      { id: 'nature_museum', emoji: '🦕', name: 'Музей природы', desc: 'Животные и минералы', color: '#4CAF50' },
      { id: 'space_museum', emoji: '🚀', name: 'Космический', desc: 'Планеты, звёзды, ракеты', color: '#3F51B5' },
      { id: 'history_museum', emoji: '🏺', name: 'Исторический', desc: 'Артефакты и эпохи', color: '#8D6E63' },
      { id: 'rail_museum', emoji: '🚂', name: 'Железных дорог', desc: 'Паровозы, вокзалы, метро', color: '#5D4037' },
      { id: 'navy_museum', emoji: '⚓', name: 'Морской', desc: 'Флот, ледоколы, парусники', color: '#0277BD' },
      { id: 'tech_museum', emoji: '💡', name: 'Науки и техники', desc: 'Изобретения и опыты', color: '#F9A825' },
      { id: 'music_museum', emoji: '🎼', name: 'Музыки и театра', desc: 'Инструменты, балет, опера', color: '#7B1FA2' },
      { id: 'toy_museum', emoji: '🧸', name: 'Игрушек', desc: 'Куклы, матрёшки, игры', color: '#D84315' },
      { id: 'palace_museum', emoji: '🏰', name: 'Дворцовый', desc: 'Эрмитаж: залы и сокровища', color: '#00695C' },
      // --- 40 новых музеев (v1.3.12): «музеев добавь до 50 разных» ---
      { id: 'ocean_museum', emoji: '🌊', name: 'Океанариум', desc: 'Рыбы, кораллы, киты', color: '#0E5C86' },
      { id: 'paleo_museum', emoji: '🦴', name: 'Палеонтологический', desc: 'Динозавры и скелеты', color: '#B08968' },
      { id: 'planetarium', emoji: '🔭', name: 'Планетарий', desc: 'Звёздное небо и телескопы', color: '#5C5CC4' },
      { id: 'gems_museum', emoji: '💎', name: 'Музей камня', desc: 'Кристаллы и самоцветы', color: '#7FD4FF' },
      { id: 'human_museum', emoji: '🫀', name: 'Музей человека', desc: 'Как устроен наш организм', color: '#FF6B6B' },
      { id: 'botanic_museum', emoji: '🌿', name: 'Ботанический сад', desc: 'Растения и цветы', color: '#2F6B3A' },
      { id: 'insects_museum', emoji: '🐛', name: 'Музей насекомых', desc: 'Жуки, бабочки, муравьи', color: '#6BCB77' },
      { id: 'birds_museum', emoji: '🦜', name: 'Музей птиц', desc: 'Гнёзда, перья, пение', color: '#4D96FF' },
      { id: 'cats_museum', emoji: '🐈', name: 'Кошачий музей', desc: 'Породы кошек и коты мира', color: '#E8A33D' },
      { id: 'dogs_museum', emoji: '🐕', name: 'Музей собак', desc: 'Породы и собачья работа', color: '#C1783C' },
      { id: 'horses_museum', emoji: '🐎', name: 'Конный музей', desc: 'Лошади, сёдла, кареты', color: '#3D5522' },
      { id: 'farm_museum', emoji: '🚜', name: 'Музей деревни', desc: 'Мельница, утварь, трактор', color: '#486B2A' },
      { id: 'bread_museum', emoji: '🍞', name: 'Музей хлеба', desc: 'От колоска до каравая', color: '#E0A96D' },
      { id: 'tea_museum', emoji: '🫖', name: 'Музей чая', desc: 'Чайники, травы, самовар', color: '#3FA37A' },
      { id: 'chocolate_museum', emoji: '🍫', name: 'Шоколадный музей', desc: 'Какао, плитки, конфеты', color: '#8D5524' },
      { id: 'cheese_museum', emoji: '🧀', name: 'Сырный музей', desc: 'Сыры и сыроварни', color: '#D9B23D' },
      { id: 'icecream_museum', emoji: '🍦', name: 'Музей мороженого', desc: 'Рожки, шарики, эскимо', color: '#F6A5C0' },
      { id: 'honey_museum', emoji: '🍯', name: 'Музей мёда', desc: 'Улей, соты и пчёлы', color: '#B8892B' },
      { id: 'robots_museum', emoji: '🤖', name: 'Музей роботов', desc: 'Механизмы, датчики, руки', color: '#3D6B8C' },
      { id: 'computers_museum', emoji: '💾', name: 'Музей компьютеров', desc: 'От калькулятора до ИИ', color: '#4D6B8C' },
      { id: 'clocks_museum', emoji: '🕰️', name: 'Музей часов', desc: 'Маятники, куранты, будильники', color: '#B08D57' },
      { id: 'photo_museum', emoji: '📷', name: 'Музей фотографии', desc: 'Плёнка, вспышка, снимки', color: '#9AA0B5' },
      { id: 'planes_museum', emoji: '✈️', name: 'Музей авиации', desc: 'Самолёты и планеры', color: '#7FB8E6' },
      { id: 'cars_museum', emoji: '🚗', name: 'Музей автомобилей', desc: 'Моторы, шины, руль', color: '#8C5A3C' },
      { id: 'glass_museum', emoji: '🫙', name: 'Музей стекла', desc: 'Как варят стекло', color: '#9FD8FF' },
      { id: 'pottery_museum', emoji: '⚱️', name: 'Гончарный музей', desc: 'Глина, круг, горшки', color: '#C1783C' },
      { id: 'metal_museum', emoji: '⚙️', name: 'Музей металла', desc: 'Руда, ковка, сплавы', color: '#7C8794' },
      { id: 'wood_museum', emoji: '🪵', name: 'Музей дерева', desc: 'Древесина и резьба', color: '#A9743A' },
      { id: 'textile_museum', emoji: '🧵', name: 'Музей тканей', desc: 'Лён, нити, ткацкий станок', color: '#D98CB3' },
      { id: 'shoes_museum', emoji: '👟', name: 'Музей обуви', desc: 'От лаптей до кроссовок', color: '#8A5A2B' },
      { id: 'hats_museum', emoji: '🎩', name: 'Музей шляп', desc: 'Панамы, цилиндры, короны', color: '#6E4B8E' },
      { id: 'circus_museum', emoji: '🎪', name: 'Музей цирка', desc: 'Арена, фокусы, акробаты', color: '#FF4D6D' },
      { id: 'puppets_museum', emoji: '🎭', name: 'Театр кукол', desc: 'Куклы, ширма, нитки', color: '#B44EC4' },
      { id: 'cartoons_museum', emoji: '📺', name: 'Музей мультфильмов', desc: 'Как рисуют мультики', color: '#4D7CE8' },
      { id: 'bricks_museum', emoji: '🧱', name: 'Музей конструкторов', desc: 'Кубики и механизмы', color: '#F5B301' },
      { id: 'puzzles_museum', emoji: '🧩', name: 'Музей головоломок', desc: 'Кубик Рубика и задачи', color: '#4FB3A5' },
      { id: 'chess_museum', emoji: '♟️', name: 'Музей шахмат', desc: 'Фигуры и первые ходы', color: '#7C8794' },
      { id: 'sport_museum', emoji: '🏅', name: 'Музей спорта', desc: 'Медали, кубки, рекорды', color: '#3D7C8C' },
      { id: 'post_museum', emoji: '✉️', name: 'Музей почты', desc: 'Конверты, марки, голуби', color: '#4D96FF' },
      { id: 'fire_museum', emoji: '🚒', name: 'Пожарный музей', desc: 'Каски, лестницы, стволы', color: '#E4572E' },
    ]
  },

  // ----- МУЗЕИ -----
  art_museum: {
    name: '🖼️ Художественный музей', bg: '#1a1a2e', kind: 'browse',
    content: 'art_museum', count: 12, energyCost: 5,
    perItem: '+1 интеллект за картину',
    perItemReward: { stat: 'intelligence', amount: 1 },
    reward: { stat: 'intelligence', amount: 5, label: 'Интеллект +5' }
  },
  nature_museum: {
    name: '🦕 Музей природы', bg: '#16301c', kind: 'browse',
    content: 'nature_museum', count: 12, energyCost: 5,
    perItem: '+1 интеллект за экспонат',
    perItemReward: { stat: 'intelligence', amount: 1 },
    reward: { stat: 'intelligence', amount: 5, label: 'Интеллект +5' }
  },
  space_museum: {
    name: '🚀 Космический музей', bg: '#0a0a2a', kind: 'browse',
    content: 'space_museum', count: 12, energyCost: 5,
    perItem: '+1 интеллект за экспонат',
    perItemReward: { stat: 'intelligence', amount: 1 },
    reward: { stat: 'intelligence', amount: 5, label: 'Интеллект +5' }
  },
  history_museum: {
    name: '🏺 Исторический музей', bg: '#2b1f14', kind: 'browse',
    content: 'history_museum', count: 12, energyCost: 5,
    perItem: '+1 интеллект за артефакт',
    perItemReward: { stat: 'intelligence', amount: 1 },
    reward: { stat: 'intelligence', amount: 5, label: 'Интеллект +5' }
  },

  // ----- НОВЫЕ МУЗЕИ (v1.3.7): тот же режим осмотра, своя база на 100 экспонатов -----
  rail_museum: {
    name: '🚂 Музей железных дорог', bg: '#241a12', kind: 'browse',
    content: 'rail_museum', count: 12, energyCost: 5,
    perItem: '+1 интеллект за локомотив и станцию',
    perItemReward: { stat: 'intelligence', amount: 1 },
    reward: { stat: 'intelligence', amount: 5, label: 'Интеллект +5' }
  },
  navy_museum: {
    name: '⚓ Морской музей', bg: '#0d2438', kind: 'browse',
    content: 'navy_museum', count: 12, energyCost: 5,
    perItem: '+1 интеллект за корабль',
    perItemReward: { stat: 'intelligence', amount: 1 },
    reward: { stat: 'intelligence', amount: 5, label: 'Интеллект +5' }
  },
  tech_museum: {
    name: '💡 Музей науки и техники', bg: '#2b2410', kind: 'browse',
    content: 'tech_museum', count: 12, energyCost: 5,
    perItem: '+1 интеллект за изобретение',
    perItemReward: { stat: 'intelligence', amount: 1 },
    reward: { stat: 'intelligence', amount: 5, label: 'Интеллект +5' }
  },
  music_museum: {
    name: '🎼 Музей музыки и театра', bg: '#241430', kind: 'browse',
    content: 'music_museum', count: 12, energyCost: 5,
    perItem: '+1 интеллект за инструмент и спектакль',
    perItemReward: { stat: 'intelligence', amount: 1 },
    reward: { stat: 'intelligence', amount: 5, label: 'Интеллект +5' }
  },
  toy_museum: {
    name: '🧸 Музей игрушек', bg: '#2f1a14', kind: 'browse',
    content: 'toy_museum', count: 12, energyCost: 5,
    perItem: '+1 интеллект за игрушку',
    perItemReward: { stat: 'intelligence', amount: 1 },
    reward: { stat: 'intelligence', amount: 5, label: 'Интеллект +5' }
  },
  palace_museum: {
    name: '🏰 Дворцовый музей', bg: '#12281f', kind: 'browse',
    content: 'palace_museum', count: 12, energyCost: 5,
    perItem: '+1 интеллект за зал и сокровище',
    perItemReward: { stat: 'intelligence', amount: 1 },
    reward: { stat: 'intelligence', amount: 5, label: 'Интеллект +5' }
  },

  // ----- 40 новых музеев (v1.3.12): «музеев добавь до 50 разных» -----
  // Каждый — обычный «browse»: подборка из 12 экспонатов за 5 энергии, как у старых.
  ocean_museum: {
    name: '🌊 Океанариум', bg: '#0a2436', kind: 'browse', content: 'ocean_museum', count: 12, energyCost: 5,
    perItem: '+1 интеллект за обитателя', perItemReward: { stat: 'intelligence', amount: 1 },
    reward: { stat: 'intelligence', amount: 5, label: 'Интеллект +5' }
  },
  paleo_museum: {
    name: '🦴 Палеонтологический музей', bg: '#2b2118', kind: 'browse', content: 'paleo_museum', count: 12, energyCost: 5,
    perItem: '+1 интеллект за скелет', perItemReward: { stat: 'intelligence', amount: 1 },
    reward: { stat: 'intelligence', amount: 5, label: 'Интеллект +5' }
  },
  planetarium: {
    name: '🔭 Планетарий', bg: '#050518', kind: 'browse', content: 'planetarium', count: 12, energyCost: 5,
    perItem: '+1 интеллект за созвездие', perItemReward: { stat: 'intelligence', amount: 1 },
    reward: { stat: 'intelligence', amount: 5, label: 'Интеллект +5' }
  },
  gems_museum: {
    name: '💎 Музей камня', bg: '#101b2e', kind: 'browse', content: 'gems_museum', count: 12, energyCost: 5,
    perItem: '+1 интеллект за самоцвет', perItemReward: { stat: 'intelligence', amount: 1 },
    reward: { stat: 'intelligence', amount: 5, label: 'Интеллект +5' }
  },
  human_museum: {
    name: '🫀 Музей человека', bg: '#2e1418', kind: 'browse', content: 'human_museum', count: 12, energyCost: 5,
    perItem: '+1 интеллект за орган', perItemReward: { stat: 'intelligence', amount: 1 },
    reward: { stat: 'intelligence', amount: 5, label: 'Интеллект +5' }
  },
  botanic_museum: {
    name: '🌿 Ботанический сад', bg: '#16301c', kind: 'browse', content: 'botanic_museum', count: 12, energyCost: 5,
    perItem: '+1 интеллект за растение', perItemReward: { stat: 'intelligence', amount: 1 },
    reward: { stat: 'intelligence', amount: 5, label: 'Интеллект +5' }
  },
  insects_museum: {
    name: '🐛 Музей насекомых', bg: '#1d2a14', kind: 'browse', content: 'insects_museum', count: 12, energyCost: 5,
    perItem: '+1 интеллект за жучка', perItemReward: { stat: 'intelligence', amount: 1 },
    reward: { stat: 'intelligence', amount: 5, label: 'Интеллект +5' }
  },
  birds_museum: {
    name: '🦜 Музей птиц', bg: '#122436', kind: 'browse', content: 'birds_museum', count: 12, energyCost: 5,
    perItem: '+1 интеллект за птицу', perItemReward: { stat: 'intelligence', amount: 1 },
    reward: { stat: 'intelligence', amount: 5, label: 'Интеллект +5' }
  },
  cats_museum: {
    name: '🐈 Кошачий музей', bg: '#2e2410', kind: 'browse', content: 'cats_museum', count: 12, energyCost: 5,
    perItem: '+1 интеллект за кота', perItemReward: { stat: 'intelligence', amount: 1 },
    reward: { stat: 'intelligence', amount: 5, label: 'Интеллект +5' }
  },
  dogs_museum: {
    name: '🐕 Музей собак', bg: '#2a1c10', kind: 'browse', content: 'dogs_museum', count: 12, energyCost: 5,
    perItem: '+1 интеллект за породу', perItemReward: { stat: 'intelligence', amount: 1 },
    reward: { stat: 'intelligence', amount: 5, label: 'Интеллект +5' }
  },
  horses_museum: {
    name: '🐎 Конный музей', bg: '#1e2a12', kind: 'browse', content: 'horses_museum', count: 12, energyCost: 5, perItem: '+1 интеллект за экспонат',
    perItemReward: { stat: 'intelligence', amount: 1 }, reward: { stat: 'intelligence', amount: 5, label: 'Интеллект +5' }
  },
  farm_museum: {
    name: '🚜 Музей деревни', bg: '#22301a', kind: 'browse', content: 'farm_museum', count: 12, energyCost: 5, perItem: '+1 интеллект за экспонат',
    perItemReward: { stat: 'intelligence', amount: 1 }, reward: { stat: 'intelligence', amount: 5, label: 'Интеллект +5' }
  },
  bread_museum: {
    name: '🍞 Музей хлеба', bg: '#2e2416', kind: 'browse', content: 'bread_museum', count: 12, energyCost: 5, perItem: '+1 интеллект за экспонат',
    perItemReward: { stat: 'intelligence', amount: 1 }, reward: { stat: 'intelligence', amount: 5, label: 'Интеллект +5' }
  },
  tea_museum: {
    name: '🫖 Музей чая', bg: '#12281f', kind: 'browse', content: 'tea_museum', count: 12, energyCost: 5, perItem: '+1 интеллект за экспонат',
    perItemReward: { stat: 'intelligence', amount: 1 }, reward: { stat: 'intelligence', amount: 5, label: 'Интеллект +5' }
  },
  chocolate_museum: {
    name: '🍫 Шоколадный музей', bg: '#251609', kind: 'browse', content: 'chocolate_museum', count: 12, energyCost: 5, perItem: '+1 интеллект за экспонат',
    perItemReward: { stat: 'intelligence', amount: 1 }, reward: { stat: 'intelligence', amount: 5, label: 'Интеллект +5' }
  },
  cheese_museum: {
    name: '🧀 Сырный музей', bg: '#2e2a12', kind: 'browse', content: 'cheese_museum', count: 12, energyCost: 5, perItem: '+1 интеллект за экспонат',
    perItemReward: { stat: 'intelligence', amount: 1 }, reward: { stat: 'intelligence', amount: 5, label: 'Интеллект +5' }
  },
  icecream_museum: {
    name: '🍦 Музей мороженого', bg: '#2a1a22', kind: 'browse', content: 'icecream_museum', count: 12, energyCost: 5, perItem: '+1 интеллект за экспонат',
    perItemReward: { stat: 'intelligence', amount: 1 }, reward: { stat: 'intelligence', amount: 5, label: 'Интеллект +5' }
  },
  honey_museum: {
    name: '🍯 Музей мёда', bg: '#2e2410', kind: 'browse', content: 'honey_museum', count: 12, energyCost: 5, perItem: '+1 интеллект за экспонат',
    perItemReward: { stat: 'intelligence', amount: 1 }, reward: { stat: 'intelligence', amount: 5, label: 'Интеллект +5' }
  },
  robots_museum: {
    name: '🤖 Музей роботов', bg: '#1a2028', kind: 'browse', content: 'robots_museum', count: 12, energyCost: 5, perItem: '+1 интеллект за экспонат',
    perItemReward: { stat: 'intelligence', amount: 1 }, reward: { stat: 'intelligence', amount: 5, label: 'Интеллект +5' }
  },
  computers_museum: {
    name: '💾 Музей компьютеров', bg: '#151c26', kind: 'browse', content: 'computers_museum', count: 12, energyCost: 5, perItem: '+1 интеллект за экспонат',
    perItemReward: { stat: 'intelligence', amount: 1 }, reward: { stat: 'intelligence', amount: 5, label: 'Интеллект +5' }
  },
  clocks_museum: {
    name: '🕰️ Музей часов', bg: '#2a2216', kind: 'browse', content: 'clocks_museum', count: 12, energyCost: 5, perItem: '+1 интеллект за экспонат',
    perItemReward: { stat: 'intelligence', amount: 1 }, reward: { stat: 'intelligence', amount: 5, label: 'Интеллект +5' }
  },
  photo_museum: {
    name: '📷 Музей фотографии', bg: '#1c1c1c', kind: 'browse', content: 'photo_museum', count: 12, energyCost: 5, perItem: '+1 интеллект за экспонат',
    perItemReward: { stat: 'intelligence', amount: 1 }, reward: { stat: 'intelligence', amount: 5, label: 'Интеллект +5' }
  },
  planes_museum: {
    name: '✈️ Музей авиации', bg: '#122436', kind: 'browse', content: 'planes_museum', count: 12, energyCost: 5, perItem: '+1 интеллект за экспонат',
    perItemReward: { stat: 'intelligence', amount: 1 }, reward: { stat: 'intelligence', amount: 5, label: 'Интеллект +5' }
  },
  cars_museum: {
    name: '🚗 Музей автомобилей', bg: '#241a14', kind: 'browse', content: 'cars_museum', count: 12, energyCost: 5, perItem: '+1 интеллект за экспонат',
    perItemReward: { stat: 'intelligence', amount: 1 }, reward: { stat: 'intelligence', amount: 5, label: 'Интеллект +5' }
  },
  glass_museum: {
    name: '🫙 Музей стекла', bg: '#101c26', kind: 'browse', content: 'glass_museum', count: 12, energyCost: 5, perItem: '+1 интеллект за экспонат',
    perItemReward: { stat: 'intelligence', amount: 1 }, reward: { stat: 'intelligence', amount: 5, label: 'Интеллект +5' }
  },
  pottery_museum: {
    name: '⚱️ Гончарный музей', bg: '#2a1c10', kind: 'browse', content: 'pottery_museum', count: 12, energyCost: 5, perItem: '+1 интеллект за экспонат',
    perItemReward: { stat: 'intelligence', amount: 1 }, reward: { stat: 'intelligence', amount: 5, label: 'Интеллект +5' }
  },
  metal_museum: {
    name: '⚙️ Музей металла', bg: '#1c2026', kind: 'browse', content: 'metal_museum', count: 12, energyCost: 5, perItem: '+1 интеллект за экспонат',
    perItemReward: { stat: 'intelligence', amount: 1 }, reward: { stat: 'intelligence', amount: 5, label: 'Интеллект +5' }
  },
  wood_museum: {
    name: '🪵 Музей дерева', bg: '#241a10', kind: 'browse', content: 'wood_museum', count: 12, energyCost: 5, perItem: '+1 интеллект за экспонат',
    perItemReward: { stat: 'intelligence', amount: 1 }, reward: { stat: 'intelligence', amount: 5, label: 'Интеллект +5' }
  },
  textile_museum: {
    name: '🧵 Музей тканей', bg: '#2a1622', kind: 'browse', content: 'textile_museum', count: 12, energyCost: 5, perItem: '+1 интеллект за экспонат',
    perItemReward: { stat: 'intelligence', amount: 1 }, reward: { stat: 'intelligence', amount: 5, label: 'Интеллект +5' }
  },
  shoes_museum: {
    name: '👟 Музей обуви', bg: '#241a12', kind: 'browse', content: 'shoes_museum', count: 12, energyCost: 5, perItem: '+1 интеллект за экспонат',
    perItemReward: { stat: 'intelligence', amount: 1 }, reward: { stat: 'intelligence', amount: 5, label: 'Интеллект +5' }
  },
  hats_museum: {
    name: '🎩 Музей шляп', bg: '#1e1630', kind: 'browse', content: 'hats_museum', count: 12, energyCost: 5, perItem: '+1 интеллект за экспонат',
    perItemReward: { stat: 'intelligence', amount: 1 }, reward: { stat: 'intelligence', amount: 5, label: 'Интеллект +5' }
  },
  circus_museum: {
    name: '🎪 Музей цирка', bg: '#2e1020', kind: 'browse', content: 'circus_museum', count: 12, energyCost: 5, perItem: '+1 интеллект за экспонат',
    perItemReward: { stat: 'intelligence', amount: 1 }, reward: { stat: 'intelligence', amount: 5, label: 'Интеллект +5' }
  },
  puppets_museum: {
    name: '🎭 Театр кукол', bg: '#241430', kind: 'browse', content: 'puppets_museum', count: 12, energyCost: 5, perItem: '+1 интеллект за экспонат',
    perItemReward: { stat: 'intelligence', amount: 1 }, reward: { stat: 'intelligence', amount: 5, label: 'Интеллект +5' }
  },
  cartoons_museum: {
    name: '📺 Музей мультфильмов', bg: '#141c30', kind: 'browse', content: 'cartoons_museum', count: 12, energyCost: 5, perItem: '+1 интеллект за экспонат',
    perItemReward: { stat: 'intelligence', amount: 1 }, reward: { stat: 'intelligence', amount: 5, label: 'Интеллект +5' }
  },
  bricks_museum: {
    name: '🧱 Музей конструкторов', bg: '#2e2410', kind: 'browse', content: 'bricks_museum', count: 12, energyCost: 5, perItem: '+1 интеллект за экспонат',
    perItemReward: { stat: 'intelligence', amount: 1 }, reward: { stat: 'intelligence', amount: 5, label: 'Интеллект +5' }
  },
  puzzles_museum: {
    name: '🧩 Музей головоломок', bg: '#12282a', kind: 'browse', content: 'puzzles_museum', count: 12, energyCost: 5, perItem: '+1 интеллект за экспонат',
    perItemReward: { stat: 'intelligence', amount: 1 }, reward: { stat: 'intelligence', amount: 5, label: 'Интеллект +5' }
  },
  chess_museum: {
    name: '♟️ Музей шахмат', bg: '#1c1c26', kind: 'browse', content: 'chess_museum', count: 12, energyCost: 5, perItem: '+1 интеллект за экспонат',
    perItemReward: { stat: 'intelligence', amount: 1 }, reward: { stat: 'intelligence', amount: 5, label: 'Интеллект +5' }
  },
  sport_museum: {
    name: '🏅 Музей спорта', bg: '#142430', kind: 'browse', content: 'sport_museum', count: 12, energyCost: 5, perItem: '+1 интеллект за экспонат',
    perItemReward: { stat: 'intelligence', amount: 1 }, reward: { stat: 'intelligence', amount: 5, label: 'Интеллект +5' }
  },
  post_museum: {
    name: '✉️ Музей почты', bg: '#12243a', kind: 'browse', content: 'post_museum', count: 12, energyCost: 5, perItem: '+1 интеллект за экспонат',
    perItemReward: { stat: 'intelligence', amount: 1 }, reward: { stat: 'intelligence', amount: 5, label: 'Интеллект +5' }
  },
  fire_museum: {
    name: '🚒 Пожарный музей', bg: '#2e1208', kind: 'browse', content: 'fire_museum', count: 12, energyCost: 5, perItem: '+1 интеллект за экспонат',
    perItemReward: { stat: 'intelligence', amount: 1 }, reward: { stat: 'intelligence', amount: 5, label: 'Интеллект +5' }
  },

  // ----- БИБЛИОТЕКА -----
  library: {
    name: '📚 Библиотека', bg: '#152a1b', kind: 'browse',
    content: 'library', count: 12, energyCost: 8,
    perItem: '+1 интеллект за книгу',
    perItemReward: { stat: 'intelligence', amount: 1 },
    reward: { stat: 'intelligence', amount: 8, label: 'Интеллект +8' }
  },

  // ----- РАБОТА -----
  work: {
    name: '💼 Работа', bg: '#1d2338', kind: 'work',
    content: 'work', count: 6, energyCost: 25,
    perItem: 'задание приносит монеты',
    // Смена растит рабочий навык: без этого «Профессионал» (навык 80) был
    // недостижим вообще — навык нигде не увеличивался.
    reward: { stat: 'workSkill', amount: 3, label: 'Рабочий навык +3' },
    xp: 12
  },

  // ----- УЧЁБА -----
  school: {
    name: '🎓 Учёба', bg: '#26224a', kind: 'browse',
    content: 'school', count: 12, energyCost: 20,
    perItem: '+1 интеллект за тему',
    perItemReward: { stat: 'intelligence', amount: 1 },
    reward: { stat: 'schoolSkill', amount: 4, label: 'Учебный навык +4' }
  },

  // ----- РЕСТОРАН -----
  restaurant: {
    name: '🍽️ Ресторан', bg: '#2a1616', kind: 'eat',
    content: 'restaurant', count: 9,
    perItem: 'блюдо утоляет голод',
    perItemReward: { stat: 'hunger', amount: 5 },
    reward: { stat: 'hunger', amount: 25, label: 'Сытость +25' }
  },

  // ----- ПАРК -----
  park: {
    name: '🎢 Парк', bg: '#1b3a20', kind: 'browse',
    content: 'park', count: 12, energyCost: 18,
    perItem: '+1 счастье за аттракцион',
    perItemReward: { stat: 'happiness', amount: 1 },
    reward: { stat: 'happiness', amount: 15, label: 'Счастье +15' }
  },

  // ----- КИНО -----
  cinema: {
    name: '🎬 Кинотеатр', bg: '#0a0a18', kind: 'browse',
    content: 'cinema', count: 9, energyCost: 10,
    perItem: '+1 счастье за фильм',
    perItemReward: { stat: 'happiness', amount: 1 },
    reward: { stat: 'happiness', amount: 15, label: 'Счастье +15' }
  },

  // ----- БАССЕЙН -----
  pool: {
    name: '🏊 Бассейн', bg: '#0b2a3a', kind: 'browse',
    content: 'pool', count: 12, energyCost: 15,
    perItem: '+2 чистоты за занятие',
    perItemReward: { stat: 'cleanliness', amount: 2 },
    reward: { stat: 'cleanliness', amount: 20, label: 'Чистота +20' }
  },

  // ----- СПОРТЗАЛ -----
  gym: {
    name: '🏋️ Спортзал', bg: '#22222a', kind: 'browse',
    content: 'gym', count: 12, energyCost: 20,
    perItem: '+1 здоровье за упражнение',
    perItemReward: { stat: 'health', amount: 1 },
    reward: { stat: 'health', amount: 10, label: 'Здоровье +10' }
  }
};

class VisitScene {
  constructor(game) {
    this.game = game;
    this.buttons = [];
    this.state = 'browse';       // 'hub' | 'browse' | 'fact'
    this.locationId = null;
    this.data = null;
    this.items = [];
    this.viewed = [];
    this.selected = null;
    this.rewardClaimed = false;
    this.animTime = 0;
    this.toast = '';
    this.toastTimer = 0;
    this.backTarget = 'map';
    this.totalInBase = 0;
    this.freshCount = 0;
    this.page = 0;
  }

  init(locationKey) {
    this.buttons = [];
    this.locationId = locationKey;
    // Музыка знает, куда пришли: в музее и библиотеке звучит спокойная мелодия,
    // в парке и бассейне — игровая (v1.3.5)
    if (typeof AudioSys !== 'undefined' && AudioSys.setScene) AudioSys.setScene('visit:' + locationKey);
    this.data = VISIT_DATA[locationKey] || null;
    this.items = [];
    this.viewed = [];
    this.selected = null;
    this.rewardClaimed = false;
    this.animTime = 0;
    this.toast = '';
    this.toastTimer = 0;
    this.page = 0;
    this.hubPage = 0;          // листание сетки музеев в хабе (v1.3.7)
    this.jobLeft = 0;
    this.jobKey = '';
    this.jobMsg = '';

    if (!this.data) {
      this.data = {
        name: '📍 Локация', bg: '#242438', kind: 'browse', count: 0, content: null,
        reward: { stat: 'happiness', amount: 3, label: 'Счастье +3' }
      };
    }

    // Куда вернёмся по «Назад»: из музея — в хаб, из хаба и прочих — на карту
    const isMuseum = MUSEUM_KEYS.indexOf(locationKey) !== -1;
    const isTheater = (typeof THEATER_IDS !== 'undefined') && THEATER_IDS.indexOf(locationKey) !== -1;
    this.backTarget = isMuseum ? 'museums' : (isTheater ? 'theaters' : 'map');

    if (this.data.kind === 'hub') {
      this.state = 'hub';
      return;
    }

    this.state = 'browse';
    this.loadItems();

    // Оплата энергией за посещение (один раз при входе)
    if (this.data.energyCost) {
      System.stats.energy = Math.max(0, System.stats.energy - this.data.energyCost);
      System.saveGame();
    }
  }

  // Загрузить случайную подборку предметов для этой локации
  loadItems() {
    const d = this.data;
    if (!d.content) { this.items = []; return; }
    this.totalInBase = (typeof contentSize === 'function') ? contentSize(d.content) : 0;
    const seen = System.getSeen(d.content);
    const picked = (typeof getRandomItems === 'function') ? getRandomItems(d.content, d.count || 12, seen) : [];
    this.items = picked;
    this.page = 0;
    this.freshCount = picked.filter(it => !System.hasSeen(d.content, it.id)).length;
  }

  // Работа начинается при открытии карточки. «Понятно» её закрывает.
  // Если уйти раньше пяти секунд, монет нет.
  beginWork(item) {
    this.jobLeft = 0;
    this.jobKey = '';
    this.jobMsg = '';
    if (!item) return;
    const key = item.id || item.name;
    if (System.workJobDone(key)) {
      this.jobMsg = 'Это задание уже сделано дважды';
      return;
    }
    if (System.workDayCount() >= System.WORK_DAY_MAX) {
      this.jobMsg = 'На сегодня хватит заданий';
      return;
    }
    if ((System.stats.energy || 0) < System.WORK_ENERGY) {
      this.jobMsg = 'Сил мало. Сначала отдохни';
      return;
    }
    this.jobKey = key;
    this.jobLeft = System.WORK_JOB_MS;
    this.jobMsg = 'Работаю…';
  }

  finishWork() {
    const item = this.items[this.selected];
    if (!item || (item.id || item.name) !== this.jobKey) {
      this.jobLeft = 0;
      return;
    }
    const pay = System.takeWorkJob(this.jobKey, item.coins);
    this.jobLeft = 0;
    if (pay.paid > 0) {
      System.addXP(3);
      const left = System.WORK_PER_JOB - pay.times;
      this.jobMsg = '+' + pay.paid + ' монет' + (left > 0 ? '. Можно ещё раз' : '');
    } else if (pay.reason === 'rest') {
      this.jobMsg = 'На сегодня хватит заданий';
    } else if (pay.reason === 'energy') {
      this.jobMsg = 'Сил мало. Сначала отдохни';
    } else {
      this.jobMsg = 'Это задание уже сделано дважды';
    }
    this.setToast(this.jobMsg);
    System.saveGame();
  }

  setToast(msg) {
    this.toast = msg;
    this.toastTimer = 1.8;
  }

  update(dt) {
    this.animTime += dt;
    if (this.jobLeft > 0) {
      this.jobLeft -= dt;
      if (this.jobLeft <= 0) this.finishWork();
    }
    if (this.toastTimer > 0) {
      this.toastTimer -= dt / 1000;
      if (this.toastTimer <= 0) this.toast = '';
    }
  }

  // Системная кнопка «Назад»: сначала закрываем карточку предмета, а потом уже
  // уходим на карту (v1.3.6: «Назад» всегда делает один понятный шаг назад).
  handleBack() {
    if (this.state === 'fact' || this.selected !== null) {
      this.jobLeft = 0;
      this.jobKey = '';
      this.state = 'browse';
      this.selected = null;
      return true;
    }
    return false;
  }

  // ================= ОТРИСОВКА =================
  draw(ctx) {
    const W = this.game.width, H = this.game.height;
    this.buttons = [];
    const d = this.data;

    ctx.fillStyle = d.bg || '#242438';
    ctx.fillRect(0, 0, W, H);

    // Фоновая полоса «пола»
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fillRect(0, H * 0.78, W, H * 0.22);

    const title = (d.name || 'Локация').replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '').trim();
    ctx.fillStyle = '#FFD93D';
    ctx.font = `bold ${Math.min(W * 0.048, 21)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(title, W / 2, 34);

    this.buttons.push(createButton(ctx, 10, 10, 78, 32, '← Назад', {
      bgColor: 'rgba(255,255,255,0.15)', fgColor: '#fff', fontSize: 13, radius: 8
    }));

    if (this.state === 'hub') {
      this.drawHub(ctx, W, H);
      return;
    }

    if (this.state === 'fact' && this.selected !== null) {
      this.drawGrid(ctx, W, H);
      this.drawFactOverlay(ctx, W, H);
      return;
    }

    this.drawGrid(ctx, W, H);
  }

  // ----- Хаб музеев -----
  // Музеев стало десять (v1.3.7), поэтому вместо длинного списка — сетка по две
  // карточки в ряд с листанием: на телефоне всё видно и легко попасть пальцем.
  drawHub(ctx, W, H) {
    const d = this.data;
    const subs = d.sub || [];
    const seenTotal = subs.reduce((s, m) => s + System.seenCount(m.id), 0);
    const itemsTotal = subs.reduce((s, m) => s + ((typeof contentSize === 'function') ? contentSize(m.id) : 0), 0);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#b9c3ff';
    ctx.font = `${Math.min(W * 0.036, 15)}px Arial`;
    ctx.fillText(d.intro || 'Выбери:', W / 2, 58);

    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.font = `${Math.min(W * 0.03, 12.5)}px Arial`;
    const hubNoun = this.locationId === 'theaters' ? 'Театров' : 'Музеев';
    const hubItem = this.locationId === 'theaters' ? 'спектаклей' : 'экспонатов';
    ctx.fillText(hubNoun + ': ' + subs.length + ' · изучено ' + seenTotal + ' из ' + itemsTotal + ' ' + hubItem, W / 2, 78);

    const cols = 2;
    const perPage = 6;                     // три ряда — влезает даже на маленький экран
    const pages = Math.max(1, Math.ceil(subs.length / perPage));
    if (!this.hubPage || this.hubPage >= pages) this.hubPage = 0;
    const from = this.hubPage * perPage;
    const pageItems = subs.slice(from, from + perPage);

    const top = 96;
    const bottom = H - (pages > 1 ? 64 : 24);
    const gap = 10;
    const rows = Math.ceil(pageItems.length / cols);
    const cardW = Math.min((W - 24 - (cols - 1) * gap) / cols, 210);
    const cardH = Math.min((bottom - top - (rows - 1) * gap) / Math.max(rows, 1), 98);
    const gridW = cols * cardW + (cols - 1) * gap;
    const startX = (W - gridW) / 2;
    // Карточки не «липнут» к шапке: сетка центрируется в свободной высоте
    const gridH = rows * cardH + (rows - 1) * gap;
    const gridY0 = top + Math.max(0, (bottom - top - gridH) / 2);

    pageItems.forEach((m, i) => {
      const col = i % cols, row = Math.floor(i / cols);
      const x = startX + col * (cardW + gap);
      const y = gridY0 + row * (cardH + gap);

      ctx.fillStyle = m.color || '#39406a';
      roundRect(ctx, x, y, cardW, cardH, 14);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 2;
      roundRect(ctx, x, y, cardW, cardH, 14);
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `${Math.min(cardH * 0.32, 28)}px Arial`;
      ctx.fillStyle = '#fff';
      ctx.fillText(m.emoji, x + cardW / 2, y + cardH * 0.28);

      const nameSize = fitFontSize(ctx, m.name, cardW - 14, Math.min(cardW * 0.115, 13.5), 8.5, false);
      ctx.font = `bold ${nameSize}px Arial`;
      ctx.fillStyle = '#fff';
      ctx.fillText(this.truncate(ctx, m.name, cardW - 12), x + cardW / 2, y + cardH * 0.56);

      const seen = System.seenCount(m.id);
      const total = (typeof contentSize === 'function') ? contentSize(m.id) : 0;
      const done = total > 0 && seen >= total;
      ctx.font = `${Math.min(cardW * 0.095, 11)}px Arial`;
      ctx.fillStyle = done ? '#C8F7C5' : 'rgba(255,255,255,0.85)';
      ctx.fillText((done ? '✅ ' : '') + seen + '/' + total, x + cardW / 2, y + cardH * 0.82);

      const prefix = this.locationId === 'theaters' ? 'theater_' : 'museum_';
      this.buttons.push({ x, y, w: cardW, h: cardH, text: prefix + m.id });
    });

    // Листание: музеев больше, чем помещается на экран
    if (pages > 1) {
      const bw = 46, bh = 32, by = H - 48;
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      roundRect(ctx, 16, by, bw, bh, 9);
      ctx.fill();
      roundRect(ctx, W - 16 - bw, by, bw, bh, 9);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '15px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('◀', 16 + bw / 2, by + bh / 2);
      ctx.fillText('▶', W - 16 - bw / 2, by + bh / 2);
      ctx.font = `bold ${Math.min(W * 0.03, 12.5)}px Arial`;
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      const pageWord = this.locationId === 'theaters' ? 'Театры' : 'Музеи';
      ctx.fillText(pageWord + ' ' + (from + 1) + '–' + (from + pageItems.length) + ' из ' + subs.length, W / 2, by + bh / 2);
      this.buttons.push({ x: 16, y: by, w: bw, h: bh, text: 'hub_prev' });
      this.buttons.push({ x: W - 16 - bw, y: by, w: bw, h: bh, text: 'hub_next' });
    }
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }

  // ----- Сетка экспонатов/заданий -----
  drawGrid(ctx, W, H) {
    const d = this.data;
    const n = this.items.length;
    const viewed = this.viewed.length;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    if (this.totalInBase > 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.62)';
      ctx.font = `${Math.min(W * 0.028, 12)}px Arial`;
      ctx.fillText(`Новые: ${this.freshCount} · Всего в базе: ${this.totalInBase}`, W / 2, 50);
    }
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.min(W * 0.03, 13)}px Arial`;
    ctx.fillText(`Изучено: ${viewed}/${n}`, W / 2, 67);

    // ---- Сцена локации: гофер в правильном виде ----
    const stageTop = 76;
    const stageH = Math.min(H * 0.23, 152);
    if (typeof LocationStage !== 'undefined') {
      LocationStage.draw(ctx, { x: 0, y: stageTop, w: W, h: stageH }, this.locationId, this.game.gopher, this.animTime);
    }

    if (n === 0) {
      ctx.fillStyle = '#9aa';
      ctx.font = `${Math.min(W * 0.034, 14)}px Arial`;
      ctx.fillText('Здесь пока нечего смотреть', W / 2, stageTop + stageH + 50);
      return;
    }

    const perPage = 6;
    const pages = Math.max(1, Math.ceil(n / perPage));
    if (this.page >= pages) this.page = 0;
    const from = this.page * perPage;
    const pageItems = this.items.slice(from, from + perPage);

    const cols = 3;
    const rows = Math.ceil(pageItems.length / cols);
    const gap = 8;
    // Спортивные тренировки этой локации: спортзал — кольца и полотна,
    // бассейн — заплыв, парк — спринт с барьерами. Список общий
    // (SPORT_DISCIPLINES в game_aerial.js), поэтому новая дисциплина
    // появляется в своей локации сама (v1.3.7).
    const sports = (typeof sportListFor === 'function') ? sportListFor(this.locationId) : [];
    const poolLink = this.locationId === 'gym';
    const sportH = (sports.length + (poolLink ? 1 : 0)) * 36;
    const gridTop = stageTop + stageH + 10 + sportH;
    // Внизу всегда живут кнопка награды, «другая подборка» и листание —
    // сетка не должна залезать на них (иначе клик открывает предмет вместо кнопки)
    const gridBottom = H - 140;
    const cellW = Math.min((W - 24 - (cols - 1) * gap) / cols, 130);
    // Не растягиваем карточки на весь экран и центрируем сетку по вертикали
    const cellH = Math.min((gridBottom - gridTop - (rows - 1) * gap) / Math.max(rows, 1), 132);
    const gridH = rows * cellH + (rows - 1) * gap;
    const gridY = gridTop + Math.max(0, (gridBottom - gridTop - gridH) / 2);
    const gridW = cols * cellW + (cols - 1) * gap;
    const startX = (W - gridW) / 2;

    // Кнопки тренировок — над сеткой предметов
    sports.forEach((d, i) => {
      const aw = Math.min(W - 32, 320), ah = 30;
      const ax = (W - aw) / 2, ay = stageTop + stageH + 8 + i * 36;
      createButton(ctx, ax, ay, aw, ah, d.title, {
        bgColor: d.accent, fgColor: '#fff', fontSize: 12.5, radius: 10
      });
      this.buttons.push({ x: ax, y: ay, w: aw, h: ah, text: 'sport_' + d.id });
    });
    if (poolLink) {
      const aw = Math.min(W - 32, 320), ah = 30;
      const ax = (W - aw) / 2, ay = stageTop + stageH + 8 + sports.length * 36;
      createButton(ctx, ax, ay, aw, ah, '🏊 Бассейн', {
        bgColor: '#00BCD4', fgColor: '#fff', fontSize: 12.5, radius: 10
      });
      this.buttons.push({ x: ax, y: ay, w: aw, h: ah, text: 'goto_pool' });
    }

    pageItems.forEach((item, i) => {
      const gi = from + i;
      const col = i % cols, row = Math.floor(i / cols);
      const cx = startX + col * (cellW + gap);
      const cy = gridY + row * (cellH + gap);
      const isViewed = this.viewed.indexOf(gi) !== -1;
      const isNew = !System.hasSeen(d.content, item.id);

      ctx.fillStyle = isViewed ? 'rgba(107,203,119,0.22)' : 'rgba(255,255,255,0.10)';
      roundRect(ctx, cx, cy, cellW, cellH, 12);
      ctx.fill();
      ctx.strokeStyle = isViewed ? '#6BCB77' : 'rgba(255,255,255,0.18)';
      ctx.lineWidth = isViewed ? 2 : 1;
      roundRect(ctx, cx, cy, cellW, cellH, 12);
      ctx.stroke();

      if (isNew && d.kind === 'browse') {
        ctx.fillStyle = 'rgba(255,217,61,0.9)';
        roundRect(ctx, cx + 5, cy + 5, 22, 13, 6);
        ctx.fill();
        ctx.fillStyle = '#333';
        ctx.font = 'bold 9px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('NEW', cx + 8, cy + 15);
      }

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff';
      ctx.font = `${Math.min(cellW * 0.34, 30)}px Arial`;
      ctx.fillText(item.emoji, cx + cellW / 2, cy + cellH * 0.32);

      const nameSize = fitFontSize(ctx, item.name, cellW - 10, Math.min(cellW * 0.115, 12), 8, false);
      ctx.font = `${nameSize}px Arial`;
      ctx.fillStyle = isViewed ? '#9BE3A5' : '#fff';
      const lines = wrapLines(ctx, item.name, cellW - 10, 2);
      const firstLine = cy + cellH * (lines.length > 1 ? 0.58 : 0.64);
      lines.forEach((ln, li) => ctx.fillText(ln, cx + cellW / 2, firstLine + li * (nameSize + 1)));

      let sub = null;
      if (d.kind === 'work') sub = '🪙' + (item.coins || 12);
      if (sub) {
        ctx.fillStyle = '#FFD93D';
        ctx.font = `bold ${Math.min(cellW * 0.1, 11)}px Arial`;
        ctx.fillText(sub, cx + cellW / 2, cy + cellH - 12);
      }

      if (isViewed) {
        ctx.fillStyle = '#6BCB77';
        ctx.font = '13px Arial';
        ctx.textAlign = 'right';
        ctx.fillText('✓', cx + cellW - 7, cy + cellH - 10);
      }

      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      this.buttons.push({ x: cx, y: cy, w: cellW, h: cellH, text: 'item_' + gi });
    });

    // Итоговая награда
    if (viewed >= n && !this.rewardClaimed) {
      const label = '🎁 ' + (d.reward && d.reward.label ? d.reward.label : 'Награда');
      this.buttons.push(createButton(ctx, W / 2 - 100, H - 84, 200, 38, label, {
        bgColor: '#FFD93D', fgColor: '#1a1a2e', fontSize: 14, radius: 12
      }));
    } else if (this.rewardClaimed) {
      ctx.fillStyle = '#6BCB77';
      ctx.font = `${Math.min(W * 0.033, 13)}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText('✅ Награда получена', W / 2, H - 62);
    }

    // Листание подборки
    if (pages > 1) {
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font = `bold ${Math.min(W * 0.031, 13)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Подборка ' + (this.page + 1) + ' / ' + pages, W / 2, H - 20);
      ctx.textBaseline = 'alphabetic';
      this.buttons.push(createButton(ctx, 14, H - 36, 48, 32, '◀', {
        bgColor: 'rgba(255,255,255,0.18)', fgColor: '#fff', fontSize: 15, radius: 9
      }));
      this.buttons.push(createButton(ctx, W - 62, H - 36, 48, 32, '▶', {
        bgColor: 'rgba(255,255,255,0.18)', fgColor: '#fff', fontSize: 15, radius: 9
      }));
    }

    // Всё посмотрели — можно взять другую подборку
    if (viewed >= n) {
      this.buttons.push(createButton(ctx, W / 2 - 92, H - 130, 184, 32,
        '🔄 Другая подборка', { bgColor: 'rgba(255,255,255,0.18)', fgColor: '#fff', fontSize: 12, radius: 10 }));
    }

    if (this.toast) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      roundRect(ctx, W / 2 - 130, 40, 260, 26, 13);
      ctx.fill();
      ctx.fillStyle = '#FFD93D';
      ctx.font = `bold ${Math.min(W * 0.03, 13)}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText(this.toast, W / 2, 58);
    }
  }

  drawFactOverlay(ctx, W, H) {
    const item = this.items[this.selected];
    if (!item) return;
    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    ctx.fillRect(0, 0, W, H);
    const panelW = Math.min(W * 0.86, 310);
    const panelH = 230;
    const px = (W - panelW) / 2, py = (H - panelH) / 2;
    ctx.fillStyle = '#1e2a4a';
    roundRect(ctx, px, py, panelW, panelH, 16);
    ctx.fill();
    ctx.strokeStyle = '#FFD93D';
    ctx.lineWidth = 2;
    roundRect(ctx, px, py, panelW, panelH, 16);
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${Math.min(panelW * 0.16, 44)}px Arial`;
    ctx.fillText(item.emoji, W / 2, py + 44);

    ctx.fillStyle = '#FFD93D';
    ctx.font = `bold ${Math.min(panelW * 0.058, 17)}px Arial`;
    const title = this.truncate(ctx, item.name, panelW - 30);
    ctx.fillText(title, W / 2, py + 82);

    ctx.fillStyle = '#e6e6f0';
    ctx.font = `${Math.min(panelW * 0.042, 13.5)}px Arial`;
    ctx.textBaseline = 'alphabetic';
    this.wrapText(ctx, item.fact || '', W / 2, py + 108, panelW - 34, 17);

    const d = this.data;
    if (d.kind === 'work') {
      ctx.fillStyle = '#6BCB77';
      ctx.font = `bold ${Math.min(panelW * 0.045, 13)}px Arial`;
      ctx.textAlign = 'center';
      const busy = this.jobLeft > 0 && this.jobKey === (item.id || item.name);
      const payLine = busy
        ? ('Работаю ' + Math.max(1, Math.ceil(this.jobLeft / 1000)) + ' с')
        : (this.jobMsg || ('Оплата 🪙' + (item.coins || 12)));
      ctx.fillText(this.truncate(ctx, payLine, panelW - 36), W / 2, py + panelH - 78);
      if (busy) {
        const bw = panelW - 40;
        const bx = px + 20;
        const by = py + panelH - 70;
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        roundRect(ctx, bx, by, bw, 8, 4);
        ctx.fill();
        const donePart = 1 - (this.jobLeft / System.WORK_JOB_MS);
        ctx.fillStyle = '#6BCB77';
        roundRect(ctx, bx, by, Math.max(8, bw * donePart), 8, 4);
        ctx.fill();
      }
    }

    this.buttons.push(createButton(ctx, px + 20, py + panelH - 48, panelW - 40, 38,
      'Понятно!',
      { bgColor: '#6BCB77', fgColor: '#fff', fontSize: 14, radius: 10 }));
  }

  wrapText(ctx, text, x, y, maxW, lineH) {
    const words = String(text).split(' ');
    let line = '', cy = y;
    for (const word of words) {
      const test = line + word + ' ';
      if (ctx.measureText(test).width > maxW && line.length > 0) {
        ctx.fillText(line.trim(), x, cy);
        line = word + ' ';
        cy += lineH;
      } else {
        line = test;
      }
    }
    ctx.fillText(line.trim(), x, cy);
  }

  truncate(ctx, text, maxW) {
    let t = String(text == null ? '' : text);
    if (ctx.measureText(t).width <= maxW) return t;
    while (t.length > 1 && ctx.measureText(t + '…').width > maxW) {
      t = t.slice(0, -1);
    }
    return t + '…';
  }

  // ================= ОБРАБОТКА НАЖАТИЙ =================
  handleClick(mx, my) {
    // Карточка экспоната перекрывает сетку: пока она открыта, сетка не кликается
    if (this.state === 'fact') {
      for (const b of this.buttons) {
        const bt = b.text || '';
        if (bt !== 'Понятно!' && bt.indexOf('Взять задание') === -1) continue;
        if (!isPointInRect(mx, my, b.x, b.y, b.w, b.h)) continue;
        AudioSys.play('click');
        this.jobLeft = 0;
        this.state = 'browse';
        this.selected = null;
        return true;
      }
      return true;
    }

    for (const btn of this.buttons) {
      if (!isPointInRect(mx, my, btn.x, btn.y, btn.w, btn.h)) continue;
      const t = btn.text || '';

      if (t === '← Назад') {
        AudioSys.play('click');
        if (this.backTarget === 'museums' || this.backTarget === 'theaters') this.game.transitionTo('visit', this.backTarget);
        else this.game.transitionTo('map');
        return true;
      }

      // Спортивная тренировка (кольца, полотна, заплыв, барьеры)
      if (t === 'goto_pool') {
        AudioSys.play('click');
        System.saveGame();
        this.game.transitionTo('visit', 'pool');
        return true;
      }

      if (t.indexOf('sport_') === 0) {
        AudioSys.play('click');
        System.saveGame();
        this.game.transitionTo('sport', t.slice(6));
        return true;
      }

      // Старое имя той же кнопки: воздушная гимнастика в спортзале
      if (t === 'aerial') {
        AudioSys.play('click');
        System.saveGame();
        this.game.transitionTo('aerial');
        return true;
      }

      // Выбор музея в хабе
      if (t.indexOf('museum_') === 0 || t.indexOf('theater_') === 0) {
        AudioSys.play('click');
        this.game.transitionTo('visit', t.slice(t.indexOf('_') + 1));
        return true;
      }

      // Листание сетки музеев (в хабе музеев теперь десять карточек)
      if (t === 'hub_prev' || t === 'hub_next') {
        AudioSys.play('click');
        const pages = Math.max(1, Math.ceil((this.data.sub || []).length / 6));
        this.hubPage = t === 'hub_prev' ? Math.max(0, this.hubPage - 1) : Math.min(pages - 1, this.hubPage + 1);
        return true;
      }

      // Листание подборок
      if (t === '◀' || t === '▶') {
        AudioSys.play('click');
        const pages = Math.max(1, Math.ceil(this.items.length / 6));
        this.page = t === '◀' ? Math.max(0, this.page - 1) : Math.min(pages - 1, this.page + 1);
        return true;
      }

      // Новая подборка
      if (t === '🔄 Другая подборка') {
        AudioSys.play('click');
        this.viewed = [];
        this.rewardClaimed = false;
        this.loadItems();
        System.saveGame();
        return true;
      }

      // Открыть предмет
      if (t.indexOf('item_') === 0) {
        const idx = parseInt(t.split('_')[1], 10);
        if (!isNaN(idx) && this.items[idx]) {
          this.selected = idx;
          this.state = 'fact';
          AudioSys.play('click');
          if (this.viewed.indexOf(idx) === -1) this.viewed.push(idx);
          // Награда за сам предмет
          const item = this.items[idx];
          const d = this.data;
          if (d.kind !== 'work' && d.perItemReward) {
            const r = System.applyReward(d.perItemReward);
            if (r) this.setToast(r);
          }
          if (d.content && item.id) System.markSeen(d.content, item.id);
          if (d.kind === 'work' && item.coins) this.beginWork(item);
          System.saveGame();
        }
        return true;
      }

      // Закрыть карточку
      if (t === 'Понятно!' || t.indexOf('Взять задание') !== -1) {
        AudioSys.play('click');
        this.state = 'browse';
        this.selected = null;
        return true;
      }

      // Получить итоговую награду
      if (t.indexOf('🎁') === 0) {
        AudioSys.play('success');
        this.rewardClaimed = true;
        const d = this.data;
        const r = System.applyReward(d.reward);
        System.addXP(d.xp || 10);
        System.showAchievement(d.reward && d.reward.label ? '🎁' : '✅', r || (d.reward ? d.reward.label : 'Готово!'));
        System.saveGame();
        return true;
      }

      return true;
    }
    return false;
  }
}

window.VisitScene = VisitScene;
window.VISIT_DATA = VISIT_DATA;
window.MUSEUM_KEYS = MUSEUM_KEYS;

// Хаб театров ставится после загрузки каталога (game_content.js идёт раньше этой сцены).
(function installTheaters() {
  if (typeof THEATER_LIST === 'undefined') return;
  VISIT_DATA.theaters = {
    name: '🎭 Театры', bg: '#1a1030', kind: 'hub',
    intro: 'Какой театр посетим?',
    sub: THEATER_LIST.map(function (t) {
      return { id: t.id, emoji: t.emoji, name: t.name, desc: t.city, color: t.color };
    })
  };
  THEATER_LIST.forEach(function (t) {
    VISIT_DATA[t.id] = {
      name: t.emoji + ' ' + t.name, bg: '#1a1030', kind: 'browse',
      content: t.id, count: 6, energyCost: 4,
      perItem: 'спектакль',
      perItemReward: { stat: 'happiness', amount: 1 },
      reward: { stat: 'happiness', amount: 4, label: 'Радость +4' }
    };
    if (typeof STAGE_DATA !== 'undefined') {
      STAGE_DATA[t.id] = { sky: ['#1a1030', '#3a2460'], outfit: null, held: '🎭', floor: '#3a2848', kind: 'gallery', tint: t.color };
    }
  });
})();
