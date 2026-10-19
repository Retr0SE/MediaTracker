import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext'; 

export default function Landing() {
    const { isAuthenticated } = useAuth();

    return (
        <div className="landing-wrapper">
            
            {/* 1. ГОЛОВНИЙ ЕКРАН */}
            <div className="landing-container">
                <section className="hero-section hero-centered">
                    <div className="hero-text">
                        <h1 className="hero-title">
                             Трекер<br />
                            <span>для твоїх фільмів.</span>
                        </h1>
                        <p className="hero-subtitle">
                            Зберігай те, що хочеш подивитися, відмічай переглянуте та став власні оцінки. Нічого зайвого — тільки ти і твоя колекція.
                        </p>
                        
                        <div className="hero-actions hero-actions-centered">
                            {isAuthenticated ? (
                                <Link 
                                    to="/list" 
                                    className="btn-primary" 
                                    style={{ padding: '12px 24px', fontSize: '1rem', height: 'auto' }}
                                >
                                    Перейти до списку
                                </Link>
                            ) : (
                                <>
                                    <Link 
                                        to="/register" 
                                        className="btn-primary"
                                        style={{ padding: '12px 24px', fontSize: '1rem', height: 'auto' }}
                                    >
                                        Створити акаунт
                                    </Link>
                                    <Link 
                                        to="/login" 
                                        className="btn-secondary"
                                        style={{ padding: '12px 24px', fontSize: '1rem', height: 'auto' }}
                                    >
                                        Увійти
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Широкий мокап по центру */}
                    <div className="hero-visual-centered">
                        <div className="mockup-window glass-card">
                            <div className="mockup-header">
                                <span className="mockup-dot red"></span>
                                <span className="mockup-dot yellow"></span>
                                <span className="mockup-dot green"></span>

                            </div>
                            
                            {/* Якщо в тебе в CSS стоїть 4 колонки, а картинки лише 3, можеш змінити в CSS grid-template-columns: repeat(3, 1fr) */}
                            <div className="mockup-movies mockup-movies-wide" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                                <div className="mockup-movie">
                                    <img src="/dune.jpg" alt="Dune" />
                                    <div className="mockup-rating">★★★★★</div>
                                </div>
                                <div className="mockup-movie">
                                    <img src="/batman.jpg" alt="Batman" />
                                    <div className="mockup-rating">★★★★☆</div>
                                </div>
                                <div className="mockup-movie">
                                    <img src="/spiderman.jpg" alt="Spider-man" />
                                    <div className="mockup-rating">★★★★★</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {/* 2. СЕКЦІЯ ПЕРЕВАГ */}
            <section className="features-section">
                <div className="landing-container">
                    <h2 className="section-title">Що вміє трекер</h2>
                    <div className="features-grid">
                        <div className="feature-card glass-card">
                            <div className="feature-icon-wrapper">📂</div>
                            <h3>Зрозумілі списки</h3>
                            <p>Зберігай фільми у статусах: «Дивлюсь», «У планах», «Переглянуто» чи «Покинуто», щоб нічого не загубити.</p>
                        </div>
                        <div className="feature-card glass-card">
                            <div className="feature-icon-wrapper">📊</div>
                            <h3>Проста статистика</h3>
                            <p>Слідкуй за тим, скільки часу ти витратив на серіали та які жанри дивишся найчастіше.</p>
                        </div>
                        <div className="feature-card glass-card">
                            <div className="feature-icon-wrapper">✍️</div>
                            <h3>Власні враження</h3>
                            <p>Став оцінки від 1 до 10 та пиши короткі нотатки, щоб не забути, про що був фільм.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. СЕКЦІЯ "ЯК ЦЕ ПРАЦЮЄ" */}
            <section className="steps-section">
                <div className="landing-container">
                    <h2 className="section-title">Як це працює</h2>
                    <div className="steps-grid-horizontal">
                        <div className="step-item glass-card">
                            <div className="step-number">01</div>
                            <div className="step-content">
                                <h3>Знайди фільм</h3>
                                <p>Введи назву в пошук — база автоматично підтягне постер, рік випуску та жанри.</p>
                            </div>
                        </div>
                        <div className="step-connector"></div>
                        <div className="step-item glass-card">
                            <div className="step-number">02</div>
                            <div className="step-content">
                                <h3>Додай у профіль</h3>
                                <p>Обери статус перегляду, і фільм миттєво з'явиться у твоїй особистій колекції.</p>
                            </div>
                        </div>
                        <div className="step-connector"></div>
                        <div className="step-item glass-card">
                            <div className="step-number">03</div>
                            <div className="step-content">
                                <h3>Оновлюй статуси</h3>
                                <p>Змінюй оцінки та переміщуй фільми між списками. Твоя статистика оновиться сама.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 4. FOOTER */}
            <footer className="landing-footer">
                <div className="landing-container">
                    <div className="footer-content">
                        <p>© {new Date().getFullYear()} Дипломний проєкт.</p>
                    </div>
                </div>
            </footer>

        </div>
    );
}