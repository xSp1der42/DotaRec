import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import '../../styles/AdminPanel.css'; // Используем стили от админ-панели

const AdminLayout = () => {
    const getAdminNavLinkClass = ({ isActive }) => "admin-nav-link" + (isActive ? " active" : "");

    return (
        <div className="admin-layout">
            <h1 className="admin-main-header">Панель Администратора</h1>
            <nav className="admin-nav">
                <NavLink to="/admin/cards" className={getAdminNavLinkClass}>Карточки</NavLink>
                <NavLink to="/admin/packs" className={getAdminNavLinkClass}>Паки</NavLink>
                <NavLink to="/admin/pickem" className={getAdminNavLinkClass}>Pick'em</NavLink>
            </nav>
            <div className="admin-content">
                <Outlet /> {/* Здесь будут отображаться дочерние страницы (карточки, паки и т.д.) */}
            </div>
        </div>
    );
};

export default AdminLayout;