import React from 'react';
import '../../styles/FilterControls.css';

const FilterControls = ({ searchQuery, setSearchQuery, sortBy, setSortBy, filterByTeam, setFilterByTeam, uniqueTeams }) => {
  return (
    <div className="filter-container">
      <div className="search-wrapper">
        <input 
          type="text" 
          placeholder="Поиск по нику или команде..." 
          className="search-input" 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)} 
        />
      </div>
      <div className="filter-group">
        <span className="filter-label">Сортировать:</span>
        <button onClick={() => setSortBy('popularity')} className={`sort-button ${sortBy === 'popularity' ? 'active' : ''}`}>Популярность</button>
        <button onClick={() => setSortBy('rating_desc')} className={`sort-button ${sortBy === 'rating_desc' ? 'active' : ''}`}>Рейтинг ↓</button>
        <button onClick={() => setSortBy('rating_asc')} className={`sort-button ${sortBy === 'rating_asc' ? 'active' : ''}`}>Рейтинг ↑</button>
      </div>
      <div className="filter-group">
        <label htmlFor="team-select" className="filter-label">Команда:</label>
        <select id="team-select" className="team-select" value={filterByTeam} onChange={(e) => setFilterByTeam(e.target.value)}>
          {uniqueTeams.map(team => (<option key={team} value={team}>{team}</option>))}
        </select>
      </div>
    </div>
  );
};

export default FilterControls;