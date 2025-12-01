// src/components/Login.js
import React, { useState } from 'react';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🚀 НАЧАЛО: Процесс логина запущен');
    
    if (!formData.email || !formData.password) {
      alert('❌ Заполните все поля!');
      return;
    }

    setLoading(true);

    try {
      console.log('📤 Отправляем запрос на /auth/login');
      
      const response = await fetch('http://localhost:3001/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      console.log('✅ Запрос отправлен, статус:', response.status);
      
      const result = await response.json();
      console.log('📄 Полный ответ сервера:', result);

      if (response.ok) {
        console.log('🎉 УСПЕХ: Логин прошел успешно!');
        
        // ПРАВИЛЬНОЕ СОХРАНЕНИЕ ТОКЕНА
        const token = result.token || result.access_token;
        console.log('🔑 Токен для сохранения:', token);
        
        if (!token) {
          console.log('❌ Токен не найден в ответе!');
          alert('Ошибка: токен не получен от сервера');
          return;
        }
        
        // Сохраняем токен
        localStorage.setItem('token', token);
        console.log('💾 Токен сохранен в localStorage');
        
        // Проверяем сохранение
        const savedToken = localStorage.getItem('token');
        console.log('🔍 Проверка сохранения:', savedToken);
        console.log('🔍 Тип сохраненного токена:', typeof savedToken);
        
        if (savedToken && savedToken !== 'undefined') {
          console.log('🔄 Переходим на дашборд...');
          window.location.href = '/dashboard';
        } else {
          console.log('❌ Токен не сохранился правильно!');
          alert('Ошибка сохранения токена');
        }
        
      } else {
        console.log('❌ ОШИБКА СЕРВЕРА:', result.detail);
        alert(`Ошибка: ${result.detail || 'Неверные данные'}`);
      }
    } catch (error) {
      console.error('💥 ОШИБКА:', error);
      alert('Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="wrapper">
      <form onSubmit={handleSubmit} className="login-form">
        <h1>Войти в аккаунт</h1>
        
        <div className="form-group">
          <label className="form-label">Email</label>
          <div className="input-box">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Введите ваш email"
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Пароль</label>
          <div className="input-box">
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Пароль"
              required
            />
          </div>
        </div>

        
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Вход...' : 'Войти'}
        </button>

        <div className="registerlink">
          <p>Нет аккаунта? <a href="/register">Зарегистрироваться</a></p>
        </div>
      </form>
    </div>
  );
};

export default Login;