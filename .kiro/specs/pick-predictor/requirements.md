# Requirements Document

## Introduction

Пикем-предиктор — это функция, которая позволяет пользователям предсказывать результаты драфта команд в киберспортивных матчах (Dota 2, CS2). Пользователи могут делать ставки на то, какие герои/агенты будут выбраны или забанены командами, и получать награды за правильные предсказания.

## Glossary

- **Pick Predictor System**: Система предсказания драфта, которая управляет созданием предсказаний, приемом ставок и распределением наград
- **User**: Зарегистрированный пользователь платформы, который может делать предсказания
- **Match**: Киберспортивный матч между двумя командами
- **Draft Phase**: Фаза выбора и банов героев/агентов перед началом матча
- **Prediction**: Предсказание пользователя о результатах драфта
- **Bet**: Ставка пользователя (в виртуальной валюте) на конкретное предсказание
- **Hero/Agent**: Игровой персонаж в Dota 2 или CS2
- **Ban**: Запрет на выбор определенного героя/агента в матче
- **Pick**: Выбор героя/агента командой
- **Reward Pool**: Общий пул наград, распределяемый между победителями

## Requirements

### Requirement 1

**User Story:** Как пользователь, я хочу видеть доступные матчи для предсказаний, чтобы выбрать интересующий меня матч

#### Acceptance Criteria

1. WHEN User открывает страницу пикем-предиктора, THE Pick Predictor System SHALL отобразить список предстоящих матчей с активными предсказаниями
2. THE Pick Predictor System SHALL отображать для каждого Match следующую информацию: названия команд, время начала, игру (Dota 2 или CS2), статус предсказания
3. THE Pick Predictor System SHALL сортировать Match по времени начала в порядке возрастания
4. WHEN время до начала Match составляет менее 10 минут, THE Pick Predictor System SHALL отметить Match как "Скоро начнется"
5. THE Pick Predictor System SHALL отображать только те Match, для которых Draft Phase еще не началась

### Requirement 2

**User Story:** Как пользователь, я хочу делать предсказания на конкретные события драфта, чтобы проверить свои знания и получить награды

#### Acceptance Criteria

1. WHEN User выбирает Match, THE Pick Predictor System SHALL отобразить доступные типы предсказаний для этого Match
2. THE Pick Predictor System SHALL предоставить следующие типы Prediction: первый бан команды, первый пик команды, наиболее забаненный герой/агент, конкретные пики по позициям
3. WHEN User выбирает тип Prediction, THE Pick Predictor System SHALL отобразить список доступных вариантов (героев/агентов)
4. THE Pick Predictor System SHALL позволить User выбрать один вариант для каждого типа Prediction
5. WHEN User подтверждает Prediction, THE Pick Predictor System SHALL сохранить выбор User с временной меткой

### Requirement 3

**User Story:** Как пользователь, я хочу делать ставки виртуальной валютой на свои предсказания, чтобы увеличить потенциальную награду

#### Acceptance Criteria

1. THE Pick Predictor System SHALL позволить User указать размер Bet от 10 до 10000 виртуальных монет
2. WHEN User размещает Bet, THE Pick Predictor System SHALL проверить достаточность баланса User
3. IF баланс User недостаточен для размещения Bet, THEN THE Pick Predictor System SHALL отобразить сообщение об ошибке и не принять Bet
4. WHEN Bet принята, THE Pick Predictor System SHALL списать сумму Bet с баланса User
5. THE Pick Predictor System SHALL отобразить текущий размер Reward Pool для каждого типа Prediction

### Requirement 4

**User Story:** Как пользователь, я хочу видеть статистику и коэффициенты предсказаний, чтобы принимать обоснованные решения

#### Acceptance Criteria

1. THE Pick Predictor System SHALL отображать процентное распределение ставок между различными вариантами для каждого типа Prediction
2. THE Pick Predictor System SHALL рассчитывать и отображать потенциальный коэффициент выигрыша для каждого варианта
3. THE Pick Predictor System SHALL обновлять статистику в режиме реального времени при размещении новых Bet
4. THE Pick Predictor System SHALL отображать общее количество участников для каждого типа Prediction
5. THE Pick Predictor System SHALL отображать текущий баланс виртуальной валюты User

### Requirement 5

**User Story:** Как пользователь, я хочу видеть результаты своих предсказаний после завершения драфта, чтобы узнать, выиграл ли я

#### Acceptance Criteria

1. WHEN Draft Phase завершена, THE Pick Predictor System SHALL автоматически проверить все Prediction для этого Match
2. THE Pick Predictor System SHALL сравнить Prediction каждого User с фактическими результатами Draft Phase
3. WHEN Prediction User совпадает с фактическим результатом, THE Pick Predictor System SHALL отметить Prediction как выигрышное
4. THE Pick Predictor System SHALL рассчитать награду для каждого победителя пропорционально размеру их Bet и общему Reward Pool
5. THE Pick Predictor System SHALL начислить награды на баланс User в течение 5 минут после завершения Draft Phase

### Requirement 6

**User Story:** Как пользователь, я хочу видеть историю своих предсказаний, чтобы отслеживать свою статистику и успешность

#### Acceptance Criteria

1. THE Pick Predictor System SHALL предоставить раздел истории Prediction для каждого User
2. THE Pick Predictor System SHALL отображать все прошлые Prediction User с указанием Match, типа Prediction, размера Bet, результата
3. THE Pick Predictor System SHALL рассчитывать и отображать общую статистику User: процент успешных Prediction, общий выигрыш, общий проигрыш
4. THE Pick Predictor System SHALL позволить User фильтровать историю по игре (Dota 2 или CS2), дате, статусу (выигрыш/проигрыш)
5. THE Pick Predictor System SHALL отображать историю Prediction в порядке убывания даты

### Requirement 7

**User Story:** Как администратор, я хочу создавать и управлять предсказаниями для матчей, чтобы пользователи могли участвовать

#### Acceptance Criteria

1. THE Pick Predictor System SHALL предоставить административный интерфейс для создания новых Prediction для Match
2. WHEN администратор создает Prediction, THE Pick Predictor System SHALL запросить следующие данные: Match ID, типы Prediction, время закрытия приема ставок
3. THE Pick Predictor System SHALL позволить администратору указать список доступных героев/агентов для каждого типа Prediction
4. WHEN Draft Phase завершена, THE Pick Predictor System SHALL позволить администратору ввести фактические результаты Draft Phase
5. THE Pick Predictor System SHALL автоматически закрыть прием ставок за 5 минут до начала Match

### Requirement 8

**User Story:** Как администратор, я хочу загружать логотипы команд через файлы, чтобы они отображались в интерфейсе предсказаний

#### Acceptance Criteria

1. THE Pick Predictor System SHALL предоставить функцию загрузки файла логотипа для каждой команды
2. THE Pick Predictor System SHALL принимать файлы изображений в форматах PNG, JPG, JPEG, SVG размером до 2 МБ
3. WHEN администратор загружает файл логотипа, THE Pick Predictor System SHALL проверить формат и размер файла
4. IF файл не соответствует требованиям, THEN THE Pick Predictor System SHALL отобразить сообщение об ошибке с указанием причины
5. WHEN файл успешно загружен, THE Pick Predictor System SHALL сохранить изображение на сервере и связать его с командой
6. THE Pick Predictor System SHALL отображать загруженные логотипы команд в списке матчей и на странице предсказаний
7. THE Pick Predictor System SHALL позволить администратору заменить существующий логотип команды новым файлом

### Requirement 9

**User Story:** Как пользователь, я хочу получать уведомления о статусе моих предсказаний, чтобы быть в курсе результатов

#### Acceptance Criteria

1. WHEN Match с активными Prediction User скоро начнется (за 10 минут), THE Pick Predictor System SHALL отправить уведомление User
2. WHEN Draft Phase завершена и результаты Prediction обработаны, THE Pick Predictor System SHALL отправить уведомление User о результатах
3. WHEN User выиграл Prediction, THE Pick Predictor System SHALL отобразить размер выигрыша в уведомлении
4. THE Pick Predictor System SHALL отображать уведомления в интерфейсе приложения
5. THE Pick Predictor System SHALL сохранять историю уведомлений для User на срок до 30 дней
