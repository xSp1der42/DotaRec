import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true); // Состояние для переключения
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (isLogin) {
        // Логика входа
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/');
      } else {
        // Логика регистрации
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage('Проверьте вашу почту для подтверждения регистрации!');
      }
    } catch (error) {
      setError(error.message || 'Произошла ошибка');
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