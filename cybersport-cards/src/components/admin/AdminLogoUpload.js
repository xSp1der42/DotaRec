import React, { useState, useRef } from 'react';
import { useNotification } from '../../context/NotificationContext';
import api from '../../services/api';
import '../../styles/AdminLogoUpload.css';

const AdminLogoUpload = ({ teamId, teamName, currentLogo, onLogoUpdate }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  const { showNotification } = useNotification();

  const validateFile = (file) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    const maxSize = 2 * 1024 * 1024; // 2MB

    if (!allowedTypes.includes(file.type)) {
      showNotification('Поддерживаются только файлы PNG, JPG и SVG', 'error');
      return false;
    }

    if (file.size > maxSize) {
      showNotification('Размер файла не должен превышать 2MB', 'error');
      return false;
    }

    return true;
  };

  const handleFileSelect = (file) => {
    if (!validateFile(file)) {
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      showNotification('Выберите файл для загрузки', 'error');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('logo', selectedFile);

      const response = await api.post(`/api/admin/teams/${teamId}/logo`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        },
      });

      if (response.data.success) {
        showNotification('Логотип успешно загружен', 'success');
        onLogoUpdate(response.data);
        setSelectedFile(null);
        setPreviewUrl(null);
        setUploadProgress(0);
      }
    } catch (error) {
      console.error('Upload error:', error);
      showNotification(
        error.response?.data?.error?.message || 'Ошибка при загрузке логотипа',
        'error'
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentLogo) return;

    if (!window.confirm('Вы уверены, что хотите удалить логотип?')) {
      return;
    }

    try {
      await api.delete(`/api/admin/teams/${teamId}/logo`);
      showNotification('Логотип успешно удален', 'success');
      onLogoUpdate(null);
    } catch (error) {
      console.error('Delete error:', error);
      showNotification(
        error.response?.data?.error?.message || 'Ошибка при удалении логотипа',
        'error'
      );
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="admin-logo-upload">
      <div className="logo-upload-header">
        <h4>{teamName}</h4>
      </div>

      {/* Current Logo Display */}
      {currentLogo && !previewUrl && (
        <div className="current-logo-section">
          <div className="current-logo-preview">
            <img 
              src={currentLogo.sizes?.medium || currentLogo.originalUrl} 
              alt={`${teamName} logo`}
              className="current-logo-image"
            />
          </div>
          <button 
            onClick={handleDelete}
            className="delete-logo-btn"
            type="button"
          >
            Удалить логотип
          </button>
        </div>
      )}

      {/* File Upload Area */}
      <div 
        className={`upload-area ${isDragOver ? 'drag-over' : ''} ${isUploading ? 'uploading' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/svg+xml"
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
        />

        {previewUrl ? (
          <div className="preview-section">
            <img src={previewUrl} alt="Preview" className="preview-image" />
            <p className="preview-filename">{selectedFile?.name}</p>
          </div>
        ) : (
          <div className="upload-placeholder">
            <div className="upload-icon">📁</div>
            <p>Перетащите файл сюда или нажмите для выбора</p>
            <p className="upload-hint">PNG, JPG, SVG до 2MB</p>
          </div>
        )}

        {isUploading && (
          <div className="upload-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <span className="progress-text">{uploadProgress}%</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {selectedFile && !isUploading && (
        <div className="upload-actions">
          <button 
            onClick={handleUpload}
            className="upload-btn"
            type="button"
          >
            {currentLogo ? 'Заменить логотип' : 'Загрузить логотип'}
          </button>
          <button 
            onClick={handleCancel}
            className="cancel-btn"
            type="button"
          >
            Отмена
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminLogoUpload;