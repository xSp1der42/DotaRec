// Скрипт для проверки паков в базе данных
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const Pack = require('./models/packModel');
const Player = require('./models/playerModel');

async function checkPacks() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Подключено к MongoDB');

    const packs = await Pack.find({});
    console.log(`\n📦 Найдено паков: ${packs.length}`);

    for (const pack of packs) {
      console.log(`\n--- Пак: ${pack.name} ---`);
      console.log(`ID: ${pack._id}`);
      console.log(`Цена: ${pack.price} коинов`);
      console.log(`Карт в паке: ${pack.cards_in_pack}`);
      console.log(`Карт в пуле: ${pack.player_pool ? pack.player_pool.length : 0}`);
      
      if (!pack.player_pool || pack.player_pool.length === 0) {
        console.log('❌ ПРОБЛЕМА: player_pool пустой!');
      } else if (pack.player_pool.length < pack.cards_in_pack) {
        console.log(`❌ ПРОБЛЕМА: В пуле (${pack.player_pool.length}) меньше карт, чем должно выпасть (${pack.cards_in_pack})`);
      } else {
        console.log('✅ Пак настроен правильно');
      }
    }

    const players = await Player.find({});
    console.log(`\n👥 Всего игроков в базе: ${players.length}`);

    await mongoose.connection.close();
    console.log('\n✅ Проверка завершена');
  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }
}

checkPacks();
