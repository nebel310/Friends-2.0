// src/components/Register.js
import React, { useState } from 'react';
import './Register.css';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    passwordConfirm: '',
    rememberMe: false
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Введите имя пользователя';
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Введите корректный email';
    }

    if (formData.password.trim().length < 6) {
      newErrors.password = 'Пароль должен быть не менее 6 символов';
    }

    if (formData.passwordConfirm.trim() !== formData.password.trim()) {
      newErrors.passwordConfirm = 'Пароли не совпадают';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
  e.preventDefault(); // 
  e.stopPropagation();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      console.log('📝 Отправляем запрос на регистрацию...');
      
      const response = await fetch('http://localhost:3001/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username.trim(),
          email: formData.email.trim(),
          password: formData.password.trim(),
          password_confirm: formData.passwordConfirm.trim()
        })
      });

      console.log('📨 Статус ответа:', response.status);
      
      const result = await response.json();
      console.log('📄 Ответ сервера:', result);

      if (response.ok) {
        alert('✅ Регистрация прошла успешно!');
        console.log('🔄 Переходим на страницу логина...');
        
        // Редирект на логин после регистрации
        window.location.href = '/login';
      } else {
        alert(`❌ Ошибка: ${result.detail || 'Неизвестная ошибка сервера'}`);
      }
    } catch (error) {
      console.error('❌ Ошибка сети:', error);
      alert('❌ Ошибка сети. Проверьте подключение к интернету.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="wrapper">
      <form onSubmit={handleSubmit} className="register-form">
        <h1>Создать аккаунт</h1>
        
        <div className="form-group">
          <p>Имя пользователя</p>
          <div className="input-box">
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Логин"
              required
              className={errors.username ? 'error' : ''}
              autoComplete="username"  // ← ДОБАВИЛ autocomplete
            />
          </div>
          {errors.username && <div className="error-text">{errors.username}</div>}
        </div>

        <div className="form-group">
          <p>Email</p>
          <div className="input-box">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Введите ваш email"
              required
              className={errors.email ? 'error' : ''}
              autoComplete="email"  // ← ДОБАВИЛ autocomplete
            />
          </div>
          {errors.email && <div className="error-text">{errors.email}</div>}
        </div>

        <div className="form-group">
          <p>Пароль</p>
          <div className="input-box">
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Пароль"
              required
              className={errors.password ? 'error' : ''}
              autoComplete="new-password"  // ← ДОБАВИЛ autocomplete
            />
          </div>
          {errors.password && <div className="error-text">{errors.password}</div>}
        </div>

        <div className="form-group">
          <p>Подтверждение пароля</p>
          <div className="input-box">
            <input
              type="password"
              name="passwordConfirm"
              value={formData.passwordConfirm}
              onChange={handleChange}
              placeholder="Подтвердите пароль"
              required
              className={errors.passwordConfirm ? 'error' : ''}
              autoComplete="new-password"  // ← ДОБАВИЛ autocomplete
            />
          </div>
          {errors.passwordConfirm && <div className="error-text">{errors.passwordConfirm}</div>}
        </div>

       

        <button type="submit" className="btn" disabled={loading}>
          {loading ? 'Создание...' : 'Создать аккаунт'}
        </button>

        <div className="registerlink">
          <p>Уже есть аккаунт? <a href="/login">Войти</a></p>
        </div>
      </form>
    </div>
  );
};

export default Register;