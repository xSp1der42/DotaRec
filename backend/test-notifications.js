// Скрипт для проверки API уведомлений
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const Notification = require('./models/notificationModel');
const User = require('./models/userModel');

async function testNotifications() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Подключено к MongoDB');

    // Находим первого пользователя для тестирования
    const user = await User.findOne({});
    if (!user) {
      console.log('❌ Пользователь не найден. Создайте пользователя сначала.');
      await mongoose.connection.close();
      return;
    }

    console.log(`\n👤 Тестируем с пользователем: ${user.username} (ID: ${user._id})`);

    // Создаем тестовое уведомление
    const testNotification = new Notification({
      userId: user._id,
      type: 'match_starting',
      title: 'Матч скоро начнется',
      message: 'Ваш матч Team A vs Team B начнется через 10 минут',
      data: {
        reward: 0,
      },
      read: false,
    });

    await testNotification.save();
    console.log('✅ Тестовое уведомление создано:', testNotification._id);

    // Получаем все уведомления пользователя
    const allNotifications = await Notification.find({ userId: user._id })
      .sort({ createdAt: -1 });
    console.log(`\n📬 Всего уведомлений пользователя: ${allNotifications.length}`);

    // Получаем непрочитанные уведомления
    const unreadNotifications = await Notification.find({ 
      userId: user._id, 
      read: false 
    });
    console.log(`📭 Непрочитанных уведомлений: ${unreadNotifications.length}`);

    // Тестируем пагинацию
    const page1 = await Notification.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .skip(0);
    console.log(`\n📄 Страница 1 (лимит 50): ${page1.length} уведомлений`);

    // Отмечаем тестовое уведомление как прочитанное
    testNotification.read = true;
    await testNotification.save();
    console.log('✅ Тестовое уведомление отмечено как прочитанное');

    // Проверяем обновление
    const updatedUnreadCount = await Notification.countDocuments({ 
      userId: user._id, 
      read: false 
    });
    console.log(`📭 Непрочитанных уведомлений после обновления: ${updatedUnreadCount}`);

    // Удаляем тестовое уведомление
    await Notification.findByIdAndDelete(testNotification._id);
    console.log('🗑️  Тестовое уведомление удалено');

    await mongoose.connection.close();
    console.log('\n✅ Тест завершен успешно');
  } catch (error) {
    console.error('❌ Ошибка:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

testNotifications();
