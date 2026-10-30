import React from 'react';

const Footer = () => {
    return (
        <footer className="landing-footer">
            <div className="footer-content">
                <div className="footer-section">
                    <h3>My Media Tracker</h3>
                    <p>Твій особистий простір для відстеження фільмів, серіалів та аніме. Зберігай прогрес, став оцінки та ніколи не забувай, на якій серії зупинився.</p>
                </div>
                
                <div className="footer-section">
                    <h3>Навігація</h3>
                    <ul>
                        <li><a href="#features">Можливості</a></li>
                        <li><a href="#about">Про проєкт</a></li>
                        <li><a href="https://github.com/Retr0SE/MediaTracker" target="_blank" rel="noreferrer">GitHub репозиторій</a></li>
                    </ul>
                </div>
                
                <div className="footer-section">
                    <h3>Розробка</h3>
                    <p>Дипломний проєкт зі спеціальності</p>
                    <p>"Інженерія програмного забезпечення"</p>
                    <p>Створено у 2026 році</p>
                </div>
            </div>
            
            <div className="footer-bottom">
                <p>&copy; {new Date().getFullYear()} My Media Tracker. Всі права захищено.</p>
            </div>
        </footer>
    );
};

export default Footer;