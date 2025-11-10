import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // НОВОЕ: состояние для никнейма
  const [nickname, setNickname] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (isLogin) {
        await login(email, password);
        navigate('/');
      } else {
        // ИЗМЕНЕНИЕ: передаем никнейм в функцию регистрации
        await register(email, password, nickname);
        setMessage('Регистрация прошла успешно! Теперь вы можете войти.');
        setIsLogin(true); // Переключаем на форму входа
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-container">
      <form onSubmit={handleAuth} className="login-form">
        <h2>{isLogin ? 'Вход' : 'Регистрация'}</h2>

        {error && <p className="login-error">{error}</p>}
        {message && <p className="login-message">{message}</p>}

        {/* НОВОЕ: Поле для никнейма, отображается только при регистрации */}
        {!isLogin && (
          <input
            type="text"
            placeholder="Ваш никнейм"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            required
            minLength="3"
          />
        )}
        
        <input
          type="email"
          placeholder="Ваш email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Ваш пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength="6"
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Загрузка...' : (isLogin ? 'Войти' : 'Зарегистрироваться')}
        </button>

        <p className="auth-toggle" onClick={() => { setIsLogin(!isLogin); setError(''); setMessage(''); }}>
          {isLogin ? 'Нет аккаунта? Зарегистрируйтесь' : 'Уже есть аккаунт? Войдите'}
        </p>
      </form>
    </div>
  );
}

export default LoginPage;