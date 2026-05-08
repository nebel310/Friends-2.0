import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <>
      <div className="header">
        <h1>Friends 2.0</h1>
        <nav>
          <a href="#about" className="landing-nav-link">О проекте</a>
          <a href="#features" className="landing-nav-link">Возможности</a>
          <a href="#pages" className="landing-nav-link">Страницы</a>
          <a href="#start" className="landing-nav-link">Начать</a>
        </nav>
        <div className="header-auth">
          <Link to="/login" className="btn btn-small">Войти</Link>
          <Link to="/register" className="btn btn-success btn-small">Регистрация</Link>
        </div>
      </div>

      <div className="page landing-page">
        <section className="hero-section section">
          <div className="hero-content">
            <h1 className="hero-title">Друзья + Челленджи = <span className="gradient-text">Friends 2.0</span></h1>
            <p className="hero-subtitle">Платформа, где можно находить новых друзей и бросать друг другу интересные вызовы!</p>
            <div className="hero-actions">
              <Link to="/register" className="btn btn-large">
                <i className="fas fa-user-plus"></i> Начать бесплатно
              </Link>
              <Link to="/login" className="btn btn-large btn-secondary">
                <i className="fas fa-sign-in-alt"></i> Войти в аккаунт
              </Link>
            </div>
          </div>
          <div className="hero-image">
            <div className="hero-illustration">
              <i className="fas fa-users"></i>
              <i className="fas fa-trophy"></i>
            </div>
          </div>
        </section>

        <section id="about" className="section">
          <h2>Что такое Friends 2.0?</h2>
          <div className="about-content">
            <div className="about-card">
              <div className="about-icon"><i className="fas fa-handshake"></i></div>
              <h3>Новые друзья</h3>
              <p>Находите единомышленников, общайтесь и расширяйте свой круг общения</p>
            </div>
            <div className="about-card">
              <div className="about-icon"><i className="fas fa-bullseye"></i></div>
              <h3>Челленджи</h3>
              <p>Создавайте и принимайте вызовы для саморазвития и развлечения</p>
            </div>
            <div className="about-card">
              <div className="about-icon"><i className="fas fa-shield-alt"></i></div>
              <h3>Безопасность</h3>
              <p>Сильная вера в эффект плацебо добавила этот пункт сюда</p>
            </div>
          </div>
        </section>

        <section id="features" className="section">
          <h2>Как это работает?</h2>
          <div className="steps">
            {[
              { n: 1, title: 'Регистрация', text: 'Создайте аккаунт и подтвердите email (проверьте почту, включая спам!)' },
              { n: 2, title: 'Найдите друзей', text: 'Ищите пользователей, отправляйте и принимайте заявки в друзья' },
              { n: 3, title: 'Бросайте вызовы', text: 'Создавайте челленджи для друзей или принимайте их вызовы' },
              { n: 4, title: 'Доказывайте и побеждайте', text: 'Выполняйте задания, загружайте доказательства и получайте одобрение' },
            ].map(s => (
              <div key={s.n} className="step">
                <div className="step-number">{s.n}</div>
                <div className="step-content">
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="pages" className="section">
          <h2>Что внутри платформы?</h2>
          <p className="section-subtitle">Краткий обзор всех страниц сайта</p>
          <div className="pages-grid">
            {[
              { icon: 'fa-user-plus', title: 'Регистрация / Вход', desc: 'Первые шаги: Создайте аккаунт или войдите', items: ['📧 Подтверждение email', '🔐 Безопасное хранение паролей', '⚡ Быстрая авторизация'] },
              { icon: 'fa-user', title: 'Профиль', desc: 'Ваша визитная карточка: Настройте и персонализируйте', items: ['🖼️ Загрузка аватарок', '📝 Изменение информации', '🔑 Смена пароля'] },
              { icon: 'fa-users', title: 'Друзья', desc: 'Социальная сеть: Общайтесь и находите друзей', items: ['👥 Поиск пользователей', '📨 Отправка заявок', '✅ Принятие/отклонение заявок'] },
              { icon: 'fa-trophy', title: 'Челленджи', desc: 'Вызовы и достижения: Бросайте и принимайте', items: ['🎯 Создание челленджей', '📊 Отслеживание статусов', '📸 Загрузка доказательств'] },
              { icon: 'fa-search', title: 'Все пользователи', desc: 'Поиск и открытие: Найдите интересных людей', items: ['🔍 Расширенный поиск', '⚙️ Фильтры по полу, возрасту', '📊 Статистика платформы'] },
              { icon: 'fa-cog', title: 'Админ-панель', desc: 'Для администраторов: Управление платформой', items: ['🛡️ Управление ролями', '👁️ Модерация', '⚖️ Бан/разбан пользователей'] },
            ].map(card => (
              <div key={card.title} className="page-card">
                <div className="page-card-header">
                  <i className={`fas ${card.icon}`}></i>
                  <h3>{card.title}</h3>
                </div>
                <div className="page-card-content">
                  <p><strong>{card.desc}</strong></p>
                  <ul>{card.items.map(item => <li key={item}>{item}</li>)}</ul>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="start" className="section cta-section">
          <div className="cta-content">
            <h2>Готовы начать?</h2>
            <p>Присоединяйтесь к сообществу уже сегодня и начните бросать вызовы друзьям!</p>
            <div className="cta-actions">
              <Link to="/register" className="btn btn-large btn-success">
                <i className="fas fa-rocket"></i> Зарегистрироваться
              </Link>
              <Link to="/login" className="btn btn-large">
                <i className="fas fa-sign-in-alt"></i> Войти
              </Link>
            </div>
            <p className="cta-note">
              <i className="fas fa-envelope"></i> Не забудьте подтвердить email после регистрации!
            </p>
          </div>
        </section>
      </div>

      <div className="footer">
        <div className="footer-content">
          <div className="footer-logo">
            <h3>Friends 2.0</h3>
            <p>Платформа для друзей и челленджей</p>
          </div>
          <div className="footer-links">
            <a href="#about">О проекте</a>
            <a href="#features">Как работает</a>
            <Link to="/login">Вход</Link>
            <Link to="/register">Регистрация</Link>
          </div>
          <div className="footer-info">
            <p>Все права защищены © 2024</p>
          </div>
        </div>
      </div>
    </>
  )
}
