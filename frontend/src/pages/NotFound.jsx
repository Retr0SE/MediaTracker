import { useNavigate } from 'react-router-dom';

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div className="app-container not-found-container">
            <h1 className="not-found-title">404</h1>
            <h2>Ой! Сторінку не знайдено</h2>
            <p className="not-found-text">
                Схоже, ти заблукав. Такого посилання в нашому трекері не існує, або сторінку було видалено.
            </p>
            <button className="btn nav btn-nav-primary" onClick={() => navigate('/')}>
                ← Повернутися на головну
            </button>
        </div>
    );
};

export default NotFound;