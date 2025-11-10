// cybersport-cards/src/components/admin/AdminFantasyPanel.js

import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import Loader from '../shared/Loader';
import '../../styles/AdminFantasyPanel.css'; // Новые красивые стили

const AdminFantasyPanel = () => {
    const [events, setEvents] = useState([]);
    const [eventForm, setEventForm] = useState({ title: '', rosterLockDate: '', endDate: '' });
    const [settings, setSettings] = useState(null);
    const [emblems, setEmblems] = useState([]);
    const [emblemForm, setEmblemForm] = useState({
        name: '',
        description: '',
        color: 'red',
        stat: '',
        quality: 1,
        property: 'nesgibaemaya',
        rarity: 'common',
        isActive: true
    });
    const [editingEmblem, setEditingEmblem] = useState(null);
    const [emblemIcon, setEmblemIcon] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [eventsRes, settingsRes, emblemsRes] = await Promise.all([
                api.get('/api/fantasy/events'),
                api.get('/api/fantasy-settings'),
                api.get('/api/emblems/admin/all')
            ]);
            setEvents(eventsRes.data);
            setSettings(settingsRes.data);
            setEmblems(emblemsRes.data);
        } catch (error) {
            console.error("Failed to fetch admin fantasy data", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleEventSubmit = async (e) => {
        e.preventDefault();
        await api.post('/api/fantasy/events', eventForm);
        setEventForm({ title: '', rosterLockDate: '', endDate: '' });
        fetchData();
    };
    
    const handleDeleteEvent = async (id) => {
        if (window.confirm('Вы уверены?')) {
            await api.delete(`/api/fantasy/events/${id}`);
            fetchData();
        }
    };

    const handleSettingsChange = (category, key, value) => {
        setSettings(prev => ({
            ...prev,
            [category]: {
                ...prev[category],
                [key]: value
            }
        }));
    };
    
    const handleTextAreaChange = (category, key, value) => {
        setSettings(prev => ({
            ...prev,
            [category]: {
                ...prev[category],
                [key]: value.split('\n')
            }
        }));
    };

    const handleSaveSettings = async () => {
        try {
            await api.put('/api/fantasy-settings', settings);
            alert('Настройки успешно сохранены!');
        } catch (error) {
            alert('Не удалось сохранить настройки.');
        }
    };

    // Эмблемы
    const handleEmblemSubmit = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            Object.keys(emblemForm).forEach(key => {
                if (key !== 'isActive') {
                    formData.append(key, emblemForm[key]);
                } else {
                    formData.append(key, emblemForm[key].toString());
                }
            });
            if (emblemIcon) {
                formData.append('icon', emblemIcon);
            }

            if (editingEmblem) {
                await api.put(`/api/emblems/${editingEmblem._id}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                await api.post('/api/emblems', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            
            setEmblemForm({
                name: '',
                description: '',
                color: 'red',
                stat: '',
                quality: 1,
                property: 'nesgibaemaya',
                rarity: 'common',
                isActive: true
            });
            setEditingEmblem(null);
            setEmblemIcon(null);
            fetchData();
        } catch (error) {
            console.error('Error saving emblem:', error);
            alert('Не удалось сохранить эмблему.');
        }
    };

    const handleEditEmblem = (emblem) => {
        setEditingEmblem(emblem);
        setEmblemForm({
            name: emblem.name,
            description: emblem.description || '',
            color: emblem.color,
            stat: emblem.stat,
            quality: emblem.quality,
            property: emblem.property,
            rarity: emblem.rarity || 'common',
            isActive: emblem.isActive
        });
        setEmblemIcon(null);
    };

    const handleDeleteEmblem = async (id) => {
        if (window.confirm('Вы уверены, что хотите удалить эту эмблему?')) {
            try {
                await api.delete(`/api/emblems/${id}`);
                fetchData();
            } catch (error) {
                alert('Не удалось удалить эмблему.');
            }
        }
    };

    const cancelEdit = () => {
        setEditingEmblem(null);
        setEmblemForm({
            name: '',
            description: '',
            color: 'red',
            stat: '',
            quality: 1,
            property: 'nesgibaemaya',
            rarity: 'common',
            isActive: true
        });
        setEmblemIcon(null);
    };

    const getAvailableStats = () => {
        if (!settings) return [];
        const colorMap = {
            red: settings.emblemStats?.red || [],
            green: settings.emblemStats?.green || [],
            blue: settings.emblemStats?.blue || []
        };
        return colorMap[emblemForm.color] || [];
    };
    
    if (loading) return <Loader />;

    return (
        <div className="admin-fantasy-panel">
            <div className="fantasy-instructions">
                <h2>📖 Инструкция по фэнтези-системе</h2>
                <div className="instructions-content">
                    <div className="instruction-section">
                        <h3>🎯 Что такое фэнтези?</h3>
                        <p>Фэнтези-система позволяет игрокам создавать команды из своих карточек и зарабатывать очки на основе реальных результатов игроков в турнирах.</p>
                    </div>
                    
                    <div className="instruction-section">
                        <h3>📋 Как это работает:</h3>
                        <ol>
                            <li><strong>Создание события:</strong> Администратор создает фэнтези-событие с датой ростер-лока (когда игроки больше не могут менять команду).</li>
                            <li><strong>Сбор команды:</strong> Игроки выбирают 3 игроков из своей коллекции (Core, Mid, Support) и добавляют эмблемы.</li>
                            <li><strong>Эмблемы:</strong> Эмблемы дают бонусы к очкам за определенные статы. Есть 3 цвета:
                                <ul>
                                    <li><span className="emblem-color-indicator red"></span> <strong>Красные</strong> - для соло-статов (kills, gpm, creeps)</li>
                                    <li><span className="emblem-color-indicator green"></span> <strong>Зеленые</strong> - для командных статов (teamfights, assists)</li>
                                    <li><span className="emblem-color-indicator blue"></span> <strong>Синие</strong> - для саппорт-статов (wards, camps stacked)</li>
                                </ul>
                            </li>
                            <li><strong>Качество эмблем:</strong> От 1 до 5. Чем выше качество, тем больше бонус.</li>
                            <li><strong>Свойства эмблем:</strong> Дополнительные бонусы (Несгибаемая, Уникальная, Благотворная, Вампирическая, Дружелюбная).</li>
                            <li><strong>Подсчет очков:</strong> После турнира система автоматически подсчитывает очки на основе правил начисления.</li>
                        </ol>
                    </div>
                    
                    <div className="instruction-section">
                        <h3>⚙️ Настройки для администратора:</h3>
                        <ul>
                            <li><strong>Правила очков:</strong> Определяют, сколько очков дается за каждый стат (kills, deaths, creeps и т.д.)</li>
                            <li><strong>Титулы:</strong> Списки прилагательных и существительных для генерации случайных титулов игроков</li>
                            <li><strong>Статы эмблем:</strong> Какие статы доступны для каждого цвета эмблем</li>
                            <li><strong>Бонусы:</strong> Процентные бонусы от качества и свойств эмблем</li>
                        </ul>
                    </div>
                    
                    <div className="instruction-section">
                        <h3>🎨 Управление эмблемами:</h3>
                        <p>В разделе "Управление эмблемами" вы можете:</p>
                        <ul>
                            <li>Создавать новые эмблемы с разными характеристиками</li>
                            <li>Загружать иконки для эмблем</li>
                            <li>Редактировать существующие эмблемы</li>
                            <li>Активировать/деактивировать эмблемы</li>
                        </ul>
                    </div>
                </div>
            </div>
            
            <h2>Управление Фэнтези-лигой</h2>

            <div className="admin-section">
                <h3>Фэнтези-события</h3>
                <form onSubmit={handleEventSubmit} className="admin-form">
                    <input type="text" placeholder="Название события" value={eventForm.title} onChange={e => setEventForm({...eventForm, title: e.target.value})} required />
                    <label>Дата ростер-лока:</label>
                    <input type="datetime-local" value={eventForm.rosterLockDate} onChange={e => setEventForm({...eventForm, rosterLockDate: e.target.value})} required />
                    <button type="submit">Создать событие</button>
                </form>
                <ul className="admin-list">
                    {events.map(event => (
                        <li key={event._id}>
                            {event.title} (Лок: {new Date(event.rosterLockDate).toLocaleString()})
                            <button className="delete-btn" onClick={() => handleDeleteEvent(event._id)}>Удалить</button>
                        </li>
                    ))}
                </ul>
            </div>
            
            {settings && (
                <div className="admin-section">
                    <h3>Глобальные настройки фэнтези</h3>
                    <div className="settings-form">
                        <div className="settings-tabs">
                            <button 
                                className={`settings-tab ${!settings.activeTab || settings.activeTab === 'scoring' ? 'active' : ''}`}
                                onClick={() => setSettings({...settings, activeTab: 'scoring'})}
                            >
                                Правила очков
                            </button>
                            <button 
                                className={`settings-tab ${settings.activeTab === 'titles' ? 'active' : ''}`}
                                onClick={() => setSettings({...settings, activeTab: 'titles'})}
                            >
                                Титулы
                            </button>
                            <button 
                                className={`settings-tab ${settings.activeTab === 'emblems' ? 'active' : ''}`}
                                onClick={() => setSettings({...settings, activeTab: 'emblems'})}
                            >
                                Статы эмблем
                            </button>
                            <button 
                                className={`settings-tab ${settings.activeTab === 'bonuses' ? 'active' : ''}`}
                                onClick={() => setSettings({...settings, activeTab: 'bonuses'})}
                            >
                                Бонусы
                            </button>
                        </div>

                        {(!settings.activeTab || settings.activeTab === 'scoring') && (
                            <div className="settings-tab-content">
                                <h4>Правила начисления очков</h4>
                                <div className="form-grid">
                                    {Object.entries(settings.scoringRules).map(([key, value]) => (
                                        <div className="form-group" key={key}>
                                            <label htmlFor={key}>
                                                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                            </label>
                                            <input
                                              type="number"
                                              id={key}
                                              value={value}
                                              onChange={(e) => handleSettingsChange('scoringRules', key, Number(e.target.value))}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {settings.activeTab === 'titles' && (
                            <div className="settings-tab-content">
                                <h4>Составные части титулов</h4>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Прилагательные</label>
                                        <textarea
                                            value={settings.titles.adjectives.join('\n')}
                                            onChange={(e) => handleTextAreaChange('titles', 'adjectives', e.target.value)}
                                            placeholder="зверский&#10;могучий&#10;стремительный"
                                        />
                                        <small>Каждое слово с новой строки</small>
                                    </div>
                                    <div className="form-group">
                                        <label>Существительные</label>
                                        <textarea
                                            value={settings.titles.nouns.join('\n')}
                                            onChange={(e) => handleTextAreaChange('titles', 'nouns', e.target.value)}
                                            placeholder="служитель Муравья&#10;охотник&#10;воин"
                                        />
                                        <small>Каждое слово с новой строки</small>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {settings.activeTab === 'emblems' && (
                            <div className="settings-tab-content">
                                <h4>Доступные статы для эмблем</h4>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>
                                            <span className="emblem-color-indicator red"></span>
                                            Красные (соло)
                                        </label>
                                        <textarea
                                            value={settings.emblemStats.red.join('\n')}
                                            onChange={(e) => handleTextAreaChange('emblemStats', 'red', e.target.value)}
                                            placeholder="kills&#10;gpm&#10;creeps"
                                        />
                                        <small>Каждый стат с новой строки</small>
                                    </div>
                                    <div className="form-group">
                                        <label>
                                            <span className="emblem-color-indicator green"></span>
                                            Зеленые (командные)
                                        </label>
                                        <textarea
                                            value={settings.emblemStats.green.join('\n')}
                                            onChange={(e) => handleTextAreaChange('emblemStats', 'green', e.target.value)}
                                            placeholder="teamfights&#10;stuns&#10;assists"
                                        />
                                        <small>Каждый стат с новой строки</small>
                                    </div>
                                    <div className="form-group">
                                        <label>
                                            <span className="emblem-color-indicator blue"></span>
                                            Синие (саппорт)
                                        </label>
                                        <textarea
                                            value={settings.emblemStats.blue.join('\n')}
                                            onChange={(e) => handleTextAreaChange('emblemStats', 'blue', e.target.value)}
                                            placeholder="wards_placed&#10;camps_stacked&#10;dewards"
                                        />
                                        <small>Каждый стат с новой строки</small>
                                    </div>
                                </div>
                            </div>
                        )}

                        {settings.activeTab === 'bonuses' && (
                            <div className="settings-tab-content">
                                <h4>Бонусы от качества и свойств</h4>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Бонусы от качества (в процентах)</label>
                                        {Object.entries(settings.qualityBonuses || {}).map(([quality, bonus]) => (
                                            <div key={quality} className="bonus-row">
                                                <label>Качество {quality}:</label>
                                                <input
                                                    type="number"
                                                    value={bonus}
                                                    onChange={(e) => {
                                                        const newBonuses = {...settings.qualityBonuses};
                                                        newBonuses[quality] = Number(e.target.value);
                                                        setSettings({...settings, qualityBonuses: newBonuses});
                                                    }}
                                                />
                                                <span>%</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="form-group">
                                        <label>Бонусы от свойств (в процентах)</label>
                                        {Object.entries(settings.propertyBonuses || {}).map(([property, bonus]) => (
                                            <div key={property} className="bonus-row">
                                                <label>{property.replace(/_/g, ' ')}:</label>
                                                <input
                                                    type="number"
                                                    value={bonus}
                                                    onChange={(e) => {
                                                        const newBonuses = {...settings.propertyBonuses};
                                                        newBonuses[property] = Number(e.target.value);
                                                        setSettings({...settings, propertyBonuses: newBonuses});
                                                    }}
                                                />
                                                <span>%</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="settings-actions">
                            <button className="save-settings-btn" onClick={handleSaveSettings}>
                                Сохранить все настройки
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Секция управления эмблемами */}
            <div className="admin-section">
                <h3>Управление эмблемами</h3>
                
                <form onSubmit={handleEmblemSubmit} className="emblem-form">
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Название эмблемы *</label>
                            <input
                                type="text"
                                value={emblemForm.name}
                                onChange={(e) => setEmblemForm({...emblemForm, name: e.target.value})}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Описание</label>
                            <input
                                type="text"
                                value={emblemForm.description}
                                onChange={(e) => setEmblemForm({...emblemForm, description: e.target.value})}
                            />
                        </div>
                        <div className="form-group">
                            <label>Цвет *</label>
                            <select
                                value={emblemForm.color}
                                onChange={(e) => setEmblemForm({...emblemForm, color: e.target.value, stat: ''})}
                                required
                            >
                                <option value="red">Красный (соло)</option>
                                <option value="green">Зеленый (командный)</option>
                                <option value="blue">Синий (саппорт)</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Стат *</label>
                            <select
                                value={emblemForm.stat}
                                onChange={(e) => setEmblemForm({...emblemForm, stat: e.target.value})}
                                required
                            >
                                <option value="">Выберите стат</option>
                                {getAvailableStats().map(stat => (
                                    <option key={stat} value={stat}>{stat}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Качество (1-5) *</label>
                            <input
                                type="number"
                                min="1"
                                max="5"
                                value={emblemForm.quality}
                                onChange={(e) => setEmblemForm({...emblemForm, quality: parseInt(e.target.value)})}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Свойство *</label>
                            <select
                                value={emblemForm.property}
                                onChange={(e) => setEmblemForm({...emblemForm, property: e.target.value})}
                                required
                            >
                                <option value="nesgibaemaya">Несгибаемая</option>
                                <option value="unikalnaya">Уникальная</option>
                                <option value="blagotvornaya">Благотворная</option>
                                <option value="vampiricheskaya">Вампирическая</option>
                                <option value="druzhelyubnaya">Дружелюбная</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Редкость</label>
                            <select
                                value={emblemForm.rarity}
                                onChange={(e) => setEmblemForm({...emblemForm, rarity: e.target.value})}
                            >
                                <option value="common">Обычная</option>
                                <option value="uncommon">Необычная</option>
                                <option value="rare">Редкая</option>
                                <option value="epic">Эпическая</option>
                                <option value="legendary">Легендарная</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Иконка</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setEmblemIcon(e.target.files[0])}
                            />
                            {editingEmblem && editingEmblem.iconUrl && !emblemIcon && (
                                <small>Текущая иконка: {editingEmblem.iconUrl}</small>
                            )}
                        </div>
                        <div className="form-group">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={emblemForm.isActive}
                                    onChange={(e) => setEmblemForm({...emblemForm, isActive: e.target.checked})}
                                />
                                Активна
                            </label>
                        </div>
                    </div>
                    <div className="form-actions">
                        <button type="submit" className="save-settings-btn">
                            {editingEmblem ? 'Обновить эмблему' : 'Создать эмблему'}
                        </button>
                        {editingEmblem && (
                            <button type="button" onClick={cancelEdit} className="cancel-btn">
                                Отмена
                            </button>
                        )}
                    </div>
                </form>

                <div className="emblems-list">
                    <h4>Список эмблем ({emblems.length})</h4>
                    <div className="emblems-grid">
                        {emblems.map(emblem => (
                            <div key={emblem._id} className={`emblem-card ${!emblem.isActive ? 'inactive' : ''}`}>
                                <div className="emblem-header">
                                    <span className={`emblem-color ${emblem.color}`}></span>
                                    <h5>{emblem.name}</h5>
                                    {emblem.iconUrl && (
                                        <img src={`${process.env.REACT_APP_API_URL || 'http://localhost:5001'}${emblem.iconUrl}`} alt={emblem.name} className="emblem-icon" />
                                    )}
                                </div>
                                <div className="emblem-details">
                                    <p><strong>Стат:</strong> {emblem.stat}</p>
                                    <p><strong>Качество:</strong> {emblem.quality}</p>
                                    <p><strong>Свойство:</strong> {emblem.property}</p>
                                    <p><strong>Редкость:</strong> {emblem.rarity}</p>
                                    <p><strong>Статус:</strong> {emblem.isActive ? 'Активна' : 'Неактивна'}</p>
                                </div>
                                <div className="emblem-actions">
                                    <button onClick={() => handleEditEmblem(emblem)} className="edit-btn">
                                        Редактировать
                                    </button>
                                    <button onClick={() => handleDeleteEmblem(emblem._id)} className="delete-btn">
                                        Удалить
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminFantasyPanel;