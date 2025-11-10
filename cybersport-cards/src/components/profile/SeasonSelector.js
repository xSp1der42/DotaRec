import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SeasonSelector.css';

const SeasonSelector = ({ currentSeason, onSeasonChange }) => {
    const [seasons, setSeasons] = useState([]);
    const [selectedSeason, setSelectedSeason] = useState(currentSeason);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSeasons();
    }, []);

    useEffect(() => {
        setSelectedSeason(currentSeason);
    }, [currentSeason]);

    const fetchSeasons = async () => {
        try {
            const { data } = await axios.get('http://localhost:5001/api/seasons');
            setSeasons(data);
        } catch (error) {
            console.error('Ошибка при загрузке сезонов:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSeasonClick = (seasonNumber) => {
        setSelectedSeason(seasonNumber);
        if (onSeasonChange) {
            onSeasonChange(seasonNumber);
        }
    };

    if (loading) {
        return <div className="season-selector-loading">Загрузка сезонов...</div>;
    }

    return (
        <div className="season-selector">
            <h3>Выберите сезон</h3>
            <div className="season-list">
                {seasons.map((season) => (
                    <div
                        key={season._id}
                        className={`season-item ${selectedSeason === season.seasonNumber ? 'active' : ''} ${season.isActive ? 'current' : 'archived'}`}
                        onClick={() => handleSeasonClick(season.seasonNumber)}
                    >
                        <div className="season-number">Сезон {season.seasonNumber}</div>
                        <div className="season-name">{season.name}</div>
                        {season.isActive && <span className="season-badge">Текущий</span>}
                        {selectedSeason === season.seasonNumber && !season.isActive && (
                            <span className="season-badge archived-badge">Архив</span>
                        )}
                    </div>
                ))}
            </div>
            {selectedSeason !== currentSeason && (
                <div className="season-warning">
                    ⚠️ Вы просматриваете архивный сезон. Эти карточки нельзя использовать.
                </div>
            )}
        </div>
    );
};

export default SeasonSelector;
