import React, { useState, useRef } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { getFullImageUrl } from '../../utils/imageUtils';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import '../../styles/ProfileSettings.css';
import '../../styles/AvatarCropModal.css'; // Импортируем стили модального окна

// Вспомогательная функция для создания начальной области обрезки
function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
    return centerCrop(
        makeAspectCrop({ unit: '%', width: 90 }, aspect, mediaWidth, mediaHeight),
        mediaWidth,
        mediaHeight,
    );
}

const ProfileSettings = ({ userProfile }) => {
    const { updateUser } = useAuth();
    const [formData, setFormData] = useState({
        nickname: userProfile.nickname || '',
        email: userProfile.email || '',
    });
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [isPrivate, setIsPrivate] = useState(userProfile.isProfilePrivate || false);
    
    // Состояния для обрезки аватара
    const [imgSrc, setImgSrc] = useState('');
    const [crop, setCrop] = useState();
    const [completedCrop, setCompletedCrop] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const imgRef = useRef(null);
    const previewCanvasRef = useRef(null);

    const [avatarPreview, setAvatarPreview] = useState(getFullImageUrl(userProfile.avatarUrl));
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const showMessage = (msg, isError = false) => {
        if (isError) setError(msg); else setMessage(msg);
        setTimeout(() => { setMessage(''); setError(''); }, 3000);
    };

    const handleInfoChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handlePasswordChange = (e) => setPasswordData({ ...passwordData, [e.target.name]: e.target.value });

    function onSelectFile(e) {
        if (e.target.files && e.target.files.length > 0) {
            setCrop(undefined); // Сбрасываем предыдущую обрезку
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                setImgSrc(reader.result?.toString() || '');
                setIsModalOpen(true);
            });
            reader.readAsDataURL(e.target.files[0]);
        }
    }

    function onImageLoad(e) {
        const { width, height } = e.currentTarget;
        setCrop(centerAspectCrop(width, height, 1)); // 1 is for 1:1 aspect ratio
    }

    const handleAvatarUpload = async () => {
        if (!completedCrop || !previewCanvasRef.current || !imgRef.current) {
            showMessage('Область для аватара не выбрана.', true);
            return;
        }

        // Создаем холст для обрезанного изображения
        const image = imgRef.current;
        const canvas = previewCanvasRef.current;
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        canvas.width = completedCrop.width * scaleX;
        canvas.height = completedCrop.height * scaleY;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(
            image,
            completedCrop.x * scaleX, completedCrop.y * scaleY,
            completedCrop.width * scaleX, completedCrop.height * scaleY,
            0, 0, canvas.width, canvas.height
        );

        canvas.toBlob(async (blob) => {
            if (!blob) {
                showMessage('Не удалось создать изображение.', true);
                return;
            }
            const formData = new FormData();
            formData.append('avatar', blob, 'avatar.jpeg');

            try {
                const { data } = await api.post('/api/profile/avatar', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                await updateUser({ avatarUrl: data.avatarUrl });
                setAvatarPreview(data.avatarUrl);
                showMessage('Аватар успешно обновлен!');
                setIsModalOpen(false);
            } catch (err) {
                showMessage(err.response?.data?.message || 'Ошибка загрузки аватара.', true);
            }
        }, 'image/jpeg', 0.9); // Качество 90%
    };

    const handleSettingsUpdate = async (e) => {
        e.preventDefault();
        try {
            const { data } = await api.put('/api/profile/settings', {
                nickname: formData.nickname,
                email: formData.email,
                isProfilePrivate: isPrivate,
            });
            await updateUser(data);
            showMessage('Настройки успешно обновлены!');
        } catch (err) {
            showMessage(err.response?.data?.message || 'Ошибка обновления настроек.', true);
        }
    };

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            showMessage('Новые пароли не совпадают.', true);
            return;
        }
        try {
            await api.put('/api/profile/settings', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword,
            });
            showMessage('Пароль успешно изменен!');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            showMessage(err.response?.data?.message || 'Ошибка смены пароля.', true);
        }
    };

    return (
        <>
            {isModalOpen && (
                <div className="crop-modal-overlay">
                    <div className="crop-modal-content">
                        <h3>Обрежьте ваш аватар</h3>
                        <ReactCrop
                            crop={crop}
                            onChange={(_, percentCrop) => setCrop(percentCrop)}
                            onComplete={(c) => setCompletedCrop(c)}
                            aspect={1}
                            circularCrop
                        >
                            <img ref={imgRef} alt="Crop me" src={imgSrc} onLoad={onImageLoad} />
                        </ReactCrop>
                        <div className="crop-modal-actions">
                            <button onClick={() => setIsModalOpen(false)} className="cancel-btn">Отмена</button>
                            <button onClick={handleAvatarUpload} className="save-btn">Сохранить</button>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="profile-settings-container">
                {message && <div className="settings-message success">{message}</div>}
                {error && <div className="settings-message error">{error}</div>}

                <div className="settings-form">
                    <h3>Аватар профиля</h3>
                    <div className="avatar-upload-section">
                        <img src={avatarPreview} alt="Предпросмотр аватара" className="avatar-preview" />
                        <input type="file" id="avatar-input" accept="image/*" onChange={onSelectFile} />
                        <label htmlFor="avatar-input" className="custom-file-upload">Выбрать файл</label>
                    </div>
                </div>
                
                {/* Скрытый canvas для отрисовки обрезанного изображения */}
                <canvas ref={previewCanvasRef} style={{ display: 'none' }} />

                <form onSubmit={handleSettingsUpdate} className="settings-form">
                    <h3>Основные данные</h3>
                    <label>Никнейм</label>
                    <input type="text" name="nickname" value={formData.nickname} onChange={handleInfoChange} />
                    <label>Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleInfoChange} />
                    <div className="privacy-toggle">
                        <label>
                            <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} />
                            Сделать профиль приватным
                        </label>
                    </div>
                    <button type="submit">Сохранить изменения</button>
                </form>

                <form onSubmit={handlePasswordUpdate} className="settings-form">
                    <h3>Смена пароля</h3>
                    <input type="password" name="currentPassword" placeholder="Текущий пароль" value={passwordData.currentPassword} onChange={handlePasswordChange} required />
                    <input type="password" name="newPassword" placeholder="Новый пароль" value={passwordData.newPassword} onChange={handlePasswordChange} required />
                    <input type="password" name="confirmPassword" placeholder="Подтвердите новый пароль" value={passwordData.confirmPassword} onChange={handlePasswordChange} required />
                    <button type="submit">Сменить пароль</button>
                </form>
            </div>
        </>
    );
};

export default ProfileSettings;