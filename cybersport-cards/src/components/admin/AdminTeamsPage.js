import React, { useState, useEffect } from 'react';
import { useNotification } from '../../context/NotificationContext';
import AdminLogoUpload from './AdminLogoUpload';
import api from '../../services/api';
import '../../styles/AdminTeamsPage.css';

const AdminTeamsPage = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeams, setSelectedTeams] = useState(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const { showNotification } = useNotification();

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/teams/logos');
      setTeams(response.data.teams || []);
    } catch (error) {
      console.error('Error fetching teams:', error);
      showNotification(
        error.response?.data?.error?.message || 'Ошибка при загрузке команд',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpdate = (teamId, logoData) => {
    setTeams(prevTeams => 
      prevTeams.map(team => 
        team._id === teamId 
          ? { ...team, logo: logoData }
          : team
      )
    );
  };

  const handleTeamSelect = (teamId) => {
    const newSelected = new Set(selectedTeams);
    if (newSelected.has(teamId)) {
      newSelected.delete(teamId);
    } else {
      newSelected.add(teamId);
    }
    setSelectedTeams(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedTeams.size === filteredTeams.length) {
      setSelectedTeams(new Set());
    } else {
      setSelectedTeams(new Set(filteredTeams.map(team => team._id)));
    }
  };

  const handleBulkDeleteLogos = async () => {
    if (selectedTeams.size === 0) {
      showNotification('Выберите команды для удаления логотипов', 'warning');
      return;
    }

    if (!window.confirm(`Вы уверены, что хотите удалить логотипы у ${selectedTeams.size} команд?`)) {
      return;
    }

    setBulkActionLoading(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      const promises = Array.from(selectedTeams).map(async (teamId) => {
        try {
          await api.delete(`/api/admin/teams/${teamId}/logo`);
          successCount++;
          return { teamId, success: true };
        } catch (error) {
          errorCount++;
          return { teamId, success: false, error };
        }
      });

      const results = await Promise.all(promises);
      
      // Update teams state
      results.forEach(result => {
        if (result.success) {
          handleLogoUpdate(result.teamId, null);
        }
      });

      if (successCount > 0) {
        showNotification(`Успешно удалено логотипов: ${successCount}`, 'success');
      }
      if (errorCount > 0) {
        showNotification(`Ошибок при удалении: ${errorCount}`, 'error');
      }

      setSelectedTeams(new Set());
    } catch (error) {
      showNotification('Ошибка при массовом удалении логотипов', 'error');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const teamsWithLogos = filteredTeams.filter(team => team.logo);
  const teamsWithoutLogos = filteredTeams.filter(team => !team.logo);

  if (loading) {
    return (
      <div className="admin-teams-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Загрузка команд...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-teams-page">
      <div className="page-header">
        <h2>Управление логотипами команд</h2>
        <div className="teams-stats">
          <span className="stat-item">
            Всего команд: <strong>{teams.length}</strong>
          </span>
          <span className="stat-item">
            С логотипами: <strong>{teamsWithLogos.length}</strong>
          </span>
          <span className="stat-item">
            Без логотипов: <strong>{teamsWithoutLogos.length}</strong>
          </span>
        </div>
      </div>

      <div className="controls-section">
        <div className="search-controls">
          <input
            type="text"
            placeholder="Поиск команд..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="bulk-controls">
          <label className="select-all-checkbox">
            <input
              type="checkbox"
              checked={selectedTeams.size === filteredTeams.length && filteredTeams.length > 0}
              onChange={handleSelectAll}
            />
            Выбрать все ({selectedTeams.size})
          </label>
          
          {selectedTeams.size > 0 && (
            <button
              onClick={handleBulkDeleteLogos}
              disabled={bulkActionLoading}
              className="bulk-delete-btn"
            >
              {bulkActionLoading ? 'Удаление...' : `Удалить логотипы (${selectedTeams.size})`}
            </button>
          )}
        </div>
      </div>

      <div className="teams-grid">
        {filteredTeams.length === 0 ? (
          <div className="no-teams-message">
            {searchTerm ? 'Команды не найдены' : 'Нет команд для отображения'}
          </div>
        ) : (
          filteredTeams.map(team => (
            <div key={team._id} className="team-card">
              <div className="team-card-header">
                <label className="team-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedTeams.has(team._id)}
                    onChange={() => handleTeamSelect(team._id)}
                  />
                </label>
                <div className="team-info">
                  <h3 className="team-name">{team.name}</h3>
                  <div className="team-meta">
                    ID: {team._id}
                  </div>
                </div>
              </div>
              
              <AdminLogoUpload
                teamId={team._id}
                teamName={team.name}
                currentLogo={team.logo}
                onLogoUpdate={(logoData) => handleLogoUpdate(team._id, logoData)}
              />
            </div>
          ))
        )}
      </div>

      {filteredTeams.length > 0 && (
        <div className="pagination-info">
          Показано команд: {filteredTeams.length} из {teams.length}
        </div>
      )}
    </div>
  );
};

export default AdminTeamsPage;