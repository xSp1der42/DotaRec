// cybersport-cards/src/components/fantasy/EditPlayerModal.js

import React, { useState, useEffect } from 'react';
import PlayerCard from '../cards/PlayerCard';
import '../../styles/EditPlayerModal.css'; // Создадим эти стили ниже

const EditPlayerModal = ({ isOpen, onClose, playerSlot, fantasySettings, onSave, remainingTokens }) => {
    const [localSlot, setLocalSlot] = useState(null);
    const [tokensUsed, setTokensUsed] = useState(0);

    useEffect(() => {
        if (playerSlot) {
            // Создаем локальную копию для редактирования, чтобы не менять состояние "вживую"
            setLocalSlot(JSON.parse(JSON.stringify(playerSlot)));
            setTokensUsed(0); // Сбрасываем счетчик при открытии
        }
    }, [playerSlot, isOpen]);

    if (!isOpen || !localSlot || !fantasySettings) {
        return null;
    }

    const handleTitleReroll = () => {
        if (remainingTokens - tokensUsed < 1) {
            alert("Недостаточно жетонов!");
            return;
        }
        const { adjectives, nouns } = fantasySettings.titles;
        const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
        const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
        
        setLocalSlot(prev => ({
            ...prev,
            title: { adjective: randomAdjective, noun: randomNoun }
        }));
        setTokensUsed(prev => prev + 1);
    };
    
    const handleEmblemStatReroll = (bannerIndex) => {
       if (remainingTokens - tokensUsed < 1) {
            alert("Недостаточно жетонов!");
            return;
       }
       alert(`Рандомизация статы для эмблемы #${bannerIndex + 1}. Потрачено 1 жетон.`);
       setTokensUsed(prev => prev + 1);
    }
    
    const handleEmblemPropertyReroll = (bannerIndex) => {
       if (remainingTokens - tokensUsed < 1) {
            alert("Недостаточно жетонов!");
            return;
       }
       alert(`Рандомизация свойства для эмблемы #${bannerIndex + 1}. Потрачено 1 жетон.`);
       setTokensUsed(prev => prev + 1);
    }

    const handleSaveChanges = () => {
        if (tokensUsed > remainingTokens) {
            alert("Ошибка: потрачено больше жетонов, чем доступно!");
            return;
        }
        onSave(localSlot, tokensUsed);
        onClose();
    };
    
    const { player, title, banner } = localSlot;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content edit-player-modal" onClick={e => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={onClose}>×</button>
                <h2>Настройка: {player.nickname}</h2>

                <div className="token-counter">
                    Жетонов осталось: <span>{remainingTokens - tokensUsed}</span> / {remainingTokens}
                </div>

                {/* Отображение карточки игрока */}
                <div className="player-card-section">
                    <PlayerCard player={player} isClickable={false} />
                </div>

                <div className="edit-section">
                    <h3>Титул</h3>
                    <div className="title-display">
                        <span className="current-title">
                            {title.adjective || '???'} {title.noun || '???'}
                        </span>
                        <button className="reroll-btn" onClick={handleTitleReroll}>
                            Сменить (1 жетон)
                        </button>
                    </div>
                </div>

                <div className="edit-section">
                    <h3>Знамя (Эмблемы)</h3>
                    <div className="banner-display">
                        {banner && banner.map((emblem, index) => (
                            <div key={index} className={`emblem-card quality-${emblem.quality}`}>
                                <div className="emblem-header">
                                    <span className={`emblem-color-dot ${emblem.color}`}></span>
                                    {emblem.property}
                                </div>
                                <div className="emblem-body">
                                    <p className="emblem-stat">{emblem.stat}</p>
                                    <p className="emblem-quality">Разряд: {emblem.quality}</p>
                                </div>
                                <div className="emblem-footer">
                                    <button onClick={() => handleEmblemStatReroll(index)}>Сменить стат (1)</button>
                                    <button onClick={() => handleEmblemPropertyReroll(index)}>Сменить свойство (1)</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="save-changes-footer">
                    <button className="fantasy-button primary" onClick={handleSaveChanges}>
                        Сохранить изменения ({tokensUsed} жетонов)
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditPlayerModal;