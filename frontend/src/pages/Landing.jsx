import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useEffect, useRef } from 'react';
import Footer from '../components/Footer';

const MOVIE_LIST = [
    { id: 1, title: 'Dune: Part Two', year: '2024', genre: 'Фантастика', status: 'Переглянуто', statusClass: 'watched', img: '/dune.jpg' },
    { id: 2, title: 'The Batman', year: '2022', genre: 'Бойовик', status: 'У планах', statusClass: 'planned', img: '/batman.jpg' },
    { id: 3, title: 'Spider-Man', year: '2021', genre: 'Пригоди', status: 'Дивлюсь', statusClass: 'watching', img: '/spiderman.jpg' }
];

const FEATURES = [
    { num: '01', title: 'Нічого не загубиться', text: 'Додавай знайдені фільми до свого списку та повертайся до них у будь-який час.' },
    { num: '02', title: 'Зрозумілі статуси', text: 'Відстежуй переглянуте, заплановане та контент, який зараз дивишся.' },
    { num: '03', title: 'Усе організовано', text: 'Не доведеться шукати назви фільмів у нотатках або повідомленнях.' }
];

export default function Landing() {
    const { isAuthenticated } = useAuth();
    const pageRef = useRef(null);

    useEffect(() => {
        if (!pageRef.current || !('IntersectionObserver' in window)) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('ml-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

        const elements = pageRef.current.querySelectorAll('.ml-reveal');
        elements.forEach(el => observer.observe(el));

        return () => observer.disconnect();
    }, []);

    return (
        <main className="media-landing" ref={pageRef}>
            
            <nav className="ml-glass-nav ml-reveal">
                <div className="ml-nav-logo">MEDIATRACKER</div>
                <div className="ml-nav-links">
                    {isAuthenticated ? (
                        <Link to="/list" className="ml-button ml-button-small">Моя колекція</Link>
                    ) : (
                        <Link to="/login" className="ml-login">Увійти в акаунт</Link>
                    )}
                </div>
            </nav>

            {/* СЕКЦІЯ 1: HERO */}
            <section className="ml-hero">
                <div className="ml-container">
                    <div className="ml-hero-layout">
                        
                        <div className="ml-hero-copy ml-reveal">
                            <div className="ml-eyebrow">
                                <span></span> ТВОЯ ІСТОРІЯ ПЕРЕГЛЯДУ
                            </div>
                            <h1>
                                Знаходь.<br />
                                Дивись.<br />
                                <span>Зберігай.</span>
                            </h1>
                            <p>
                                Улюблені фільми, серіали та нові відкриття. Створи власну колекцію, стеж за переглядом і зберігай враження від кожної історії.
                            </p>
                            <div className="ml-hero-actions">
                                {isAuthenticated ? (
                                    <Link to="/list" className="ml-button">Відкрити медіатеку <span>↗</span></Link>
                                ) : (
                                    <>
                                        <Link to="/register" className="ml-button">Створити акаунт <span>↗</span></Link>
                                        <Link to="/login" className="ml-login">Вже є акаунт?</Link>
                                    </>
                                )}
                            </div>
                            <div className="ml-hero-bottom">
                                <span>ФІЛЬМИ</span>
                                <span>СЕРІАЛИ</span>
                                <span>ОЦІНКИ</span>
                            </div>
                        </div>

                        <div className="ml-hero-art ml-reveal">
                            <div className="ml-art-heading">
                                <span>ВИБРАНЕ З КОЛЕКЦІЇ</span>
                                <span>№ 001 — 003</span>
                            </div>
                            <div className="ml-poster-stage">
                                <div className="ml-poster ml-poster-back">
                                    <img src="/batman.jpg" alt="The Batman" />
                                </div>
                                <div className="ml-poster ml-poster-main">
                                    <img src="/dune.jpg" alt="Dune" />
                                    <div className="ml-poster-label">
                                        <span>01 / FEATURED</span>
                                        <h2>DUNE</h2>
                                    </div>
                                </div>
                                <div className="ml-poster ml-poster-side">
                                    <img src="/spiderman.jpg" alt="Spider-Man" />
                                </div>
                            </div>
                            <div className="ml-art-footer">
                                <span>КАДР ЗА КАДРОМ.</span>
                                <span>ІСТОРІЯ ЗА ІСТОРІЄЮ.</span>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* СЕКЦІЯ 2: TICKER */}
            <section className="ml-ticker ml-reveal">
                <div className="ml-ticker-track">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} style={{ display: 'contents' }}>
                            <span>ТВОЇ ФІЛЬМИ</span><i>✳</i>
                            <span>ТВОЇ СПИСКИ</span><i>✳</i>
                            <span>ТВОЇ ОЦІНКИ</span><i>✳</i>
                            <span>ТВОЯ КОЛЕКЦІЯ</span><i>✳</i>
                        </div>
                    ))}
                </div>
            </section>

            {/* СЕКЦІЯ 3: БІБЛІОТЕКА */}
            <section className="ml-library">
                <div className="ml-container">
                    <div className="ml-library-intro ml-reveal">
                        <div className="ml-section-label">01 / ОСОБИСТА МЕДІАТЕКА</div>
                        <h2>
                            Більше не потрібно<br />
                            <span>запам'ятовувати все.</span>
                        </h2>
                        <p>Усі фільми, які ти хочеш подивитися, переглянув або відклав на потім, тепер в одному місці.</p>
                    </div>

                    <div className="ml-library-layout">
                        
                        <div className="ml-library-preview ml-reveal">
                            <div className="ml-library-head">
                                <div>
                                    <span className="ml-library-small">PERSONAL COLLECTION</span>
                                    <h3>Моя медіатека</h3>
                                </div>
                                <span className="ml-library-count">03 ITEMS</span>
                            </div>
                            <div className="ml-library-tabs">
                                <span className="active">Усі</span>
                                <span>У планах</span>
                                <span>Переглянуто</span>
                            </div>
                            <div className="ml-movie-list">
                                {MOVIE_LIST.map((movie) => (
                                    <div key={movie.id} className="ml-movie-row">
                                        <img src={movie.img} alt={movie.title} />
                                        <div className="ml-movie-details">
                                            <h4>{movie.title}</h4>
                                            <span>{movie.year} · {movie.genre}</span>
                                        </div>
                                        <div className={`ml-movie-status ${movie.statusClass}`}>{movie.status}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="ml-library-info">
                            {FEATURES.map((feat) => (
                                <div key={feat.num} className="ml-info-item ml-reveal">
                                    <span>{feat.num}</span>
                                    <div>
                                        <h3>{feat.title}</h3>
                                        <p>{feat.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                    </div>
                </div>
            </section>

            {/* СЕКЦІЯ 4: ВІДГУКИ */}
            <section className="ml-reviews">
                <div className="ml-container">
                    <div className="ml-reviews-layout">
                        
                        <div className="ml-reviews-copy ml-reveal">
                            <div className="ml-section-label">02 / ТВОЇ ВРАЖЕННЯ</div>
                            <h2>
                                Не просто<br />
                                <span>переглянути.</span><br />
                                Запам'ятати.
                            </h2>
                            <p>Кожен фільм залишає свої враження. Зберігай власні оцінки та нотатки, щоб пам'ятати, що саме тобі сподобалося.</p>
                            <div className="ml-review-points">
                                <span>01 / Оцінки від 1 до 10</span>
                                <span>02 / Особисті відгуки</span>
                                <span>03 / Історія перегляду</span>
                            </div>
                        </div>

                        <div className="ml-review-example ml-reveal">
                            <div className="ml-review-card-top">
                                <span>ПРИКЛАД ВЛАСНОЇ ОЦІНКИ</span>
                                <span>01 / 001</span>
                            </div>
                            <div className="ml-review-card-body">
                                <div className="ml-review-cover">
                                    <img src="/dune.jpg" alt="Dune" />
                                </div>
                                <div className="ml-review-details">
                                    <span className="ml-review-type">FILM / 2021</span>
                                    <h3>Dune</h3>
                                    <div className="ml-score">
                                        <strong>9</strong><span>/ 10</span>
                                    </div>
                                    <div className="ml-score-line"><span></span></div>
                                    <div className="ml-review-text">
                                        <span>МОЯ НОТАТКА</span>
                                        <p>Вражаюча атмосфера та візуальна складова. Обов'язково переглянути ще раз.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* СЕКЦІЯ 5: НОВА - АНАЛІТИКА */}
            <section className="ml-analytics">
                <div className="ml-container">
                    <div className="ml-analytics-layout">
                        
                        <div className="ml-analytics-visual ml-reveal">
                            <div className="ml-stat-card">
                                <div className="ml-stat-header">
                                    <span>THIS MONTH</span>
                                    <h4>Твоя активність</h4>
                                </div>
                                <div className="ml-stat-body">
                                    <div className="ml-stat-circle">
                                        <span>34</span>
                                        <small>Години</small>
                                    </div>
                                    <div className="ml-stat-bars">
                                        <div className="ml-bar-group">
                                            <span className="ml-bar-label">Sci-Fi</span>
                                            <div className="ml-bar-track"><div className="ml-bar-fill" style={{width: '85%'}}></div></div>
                                        </div>
                                        <div className="ml-bar-group">
                                            <span className="ml-bar-label">Drama</span>
                                            <div className="ml-bar-track"><div className="ml-bar-fill" style={{width: '60%'}}></div></div>
                                        </div>
                                        <div className="ml-bar-group">
                                            <span className="ml-bar-label">Action</span>
                                            <div className="ml-bar-track"><div className="ml-bar-fill" style={{width: '40%'}}></div></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="ml-analytics-copy ml-reveal">
                            <div className="ml-section-label">03 / АНАЛІТИКА</div>
                            <h2>
                                Пізнавай свої<br />
                                <span>смаки краще.</span>
                            </h2>
                            <p>Трекай витрачений час та улюблені жанри. Детальна статистика допоможе зрозуміти, які саме історії резонують з тобою найбільше.</p>
                        </div>

                    </div>
                </div>
            </section>

            {/* СЕКЦІЯ 6: НОВА - ЦИТАТА/БАНЕР */}
            <section className="ml-quote-banner ml-reveal">
                <div className="ml-container">
                    <div className="ml-quote-inner">
                        <h3>"Кіно — це життя, з якого вирізали найнудніші сцени."</h3>
                        <span>— Альфред Хічкок</span>
                    </div>
                </div>
            </section>

            <Footer />

        </main>
    );
}