// src/components/CoinPurchasePanel.js
import React from 'react';
import '../styles/CoinPurchasePanel.css'; // Создадим этот CSS файл

const coinPackages = [
  { amount: 1000, price: '100₽' },
  { amount: 5500, price: '500₽' },
  { amount: 12000, price: '1000₽' },
];

const CoinPurchasePanel = ({ onAddCoins }) => {
  return (
    <div className="coin-purchase-panel">
      <h2>Пополнить баланс</h2>
      <div className="coin-packages-container">
        {coinPackages.map((pkg) => (
          <div key={pkg.amount} className="coin-package">
            <div className="package-amount">{pkg.amount.toLocaleString('ru-RU')} коинов</div>
            <div className="package-price">{pkg.price}</div>
            <button
              className="buy-coins-btn"
              onClick={() => onAddCoins(pkg.amount)}
            >
              Купить
            </button>
          </div>
        ))}
      </div>
      <p className="payment-notice">
        Это симуляция покупки. В будущем здесь будут доступны методы оплаты, такие как YooMoney, банковские карты и другие.
      </p>
    </div>
  );
};

export default CoinPurchasePanel;