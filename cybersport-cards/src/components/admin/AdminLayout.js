// cybersport-cards/src/components/admin/AdminLayout.js

import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
// --- ИСПРАВЛЕНИЕ ЗДЕСЬ ---
// Меняем неправильный путь на правильный, ведущий в папку /src/styles/
import '../../styles/AdminPanel.css'; 

const AdminLayout = () => {
    const getAdminNavLinkClass = ({ isActive }) => "admin-nav-link" + (isActive ? " active" : "");

    return (
        <div className="admin-layout">
            <h1 className="admin-main-header">Панель Администратора</h1>
            <nav className="admin-nav">
                <NavLink to="/admin/cards" className={getAdminNavLinkClass}>Карточки</NavLink>
                <NavLink to="/admin/packs" className={getAdminNavLinkClass}>Паки</NavLink>
                <NavLink to="/admin/pickem" className={getAdminNavLinkClass}>Pick'em</NavLink>
                <NavLink to="/admin/fantasy" className={getAdminNavLinkClass}>Фэнтези</NavLink>
                <NavLink to="/admin/predictor" className={getAdminNavLinkClass}>Предсказания</NavLink>
                <NavLink to="/admin/teams" className={getAdminNavLinkClass}>Логотипы команд</NavLink>
            </nav>
            <div className="admin-content">
                <Outlet />
            </div>
        </div>
    );
};

export default AdminLayout;