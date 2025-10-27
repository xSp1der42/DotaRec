// src/components/shared/Loader.js

import React from 'react';
import '../../styles/Loader.css'; // Мы создадим этот файл на следующем шаге

const Loader = () => {
  return (
    <div className="loader-container">
      <div className="loader-spinner"></div>
      <p>Загрузка данных...</p>
    </div>
  );
};

export default Loader;