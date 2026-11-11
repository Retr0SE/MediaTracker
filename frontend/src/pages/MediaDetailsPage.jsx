import { useState, useCallback, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { API_BASE_URL } from "../config";

function MediaDetailsPage(){
    const { id } = useParams()
    const navigate = useNavigate()

    const [movie, setMovie] = useState(null)
    const [currentItem, setCurrentItem] = useState(null)
    const [reviews, setReviews] = useState([])
    const [nextReviewsUrl, setNextReviewsUrl] = useState(null)

    const [isLoading, setIsLoading] = useState(true)
    const [isFetchingMore, setIsFetchingMore] = useState(false)
    const [isAdding, setIsAdding] = useState(false)
    const [toast, setToast] = useState(null)

    const [isEditingReview, setIsEditingReview] = useState(false)
    const [reviewInput, setReviewInput] = useState('')

    const {authFetch} = useAuth()

    const showToast = useCallback((text, type = 'success') => {
        setToast({ text, type })
        setTimeout(() => { setToast(null) }, 3500)
    }, [])

    const getAvatarUrl = (avatarPath) => {
        if (!avatarPath) return 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
        if (avatarPath.startsWith('http')) return avatarPath;
        return `${API_BASE_URL}${avatarPath}`;
    };

    const fetchReviews = async () => {
        try {
            const reviewsRes = await authFetch(`/api/media/catalog/${id}/reviews/`);
            if (reviewsRes.ok) {
                const reviewsData = await reviewsRes.json();
                setReviews(reviewsData.results || []);
                setNextReviewsUrl(reviewsData.next);
            }
        } catch (error) {
            console.error("Помилка фонового оновлення відгуків:", error);
        }
    };

    const fetchMediaData = useCallback(async () => {
        setIsLoading(true)
        try {
            const response = await authFetch(`/api/media/catalog/${id}/`)
            if (response.ok) {
                const data = await response.json()
                setMovie(data)
                setCurrentItem(data.user_record)
                if (data.user_record?.review){
                    setReviewInput(data.user_record.review)
                }
            } else if (response.status === 404) {
                setMovie(null)
            }

            const reviewsRes = await authFetch(`/api/media/catalog/${id}/reviews/`)
            if (reviewsRes.ok) {
                const reviewsData = await reviewsRes.json()
                setReviews(reviewsData.results || [])
                setNextReviewsUrl(reviewsData.next)
            }
        } catch (error) {
            showToast('Помилка завантаження фільму', 'error')
        } finally {
            setIsLoading(false)
        }
    }, [id, authFetch, showToast])

    useEffect(() => {
        fetchMediaData()
    }, [fetchMediaData])

    const loadMoreReviews = async () => {
        if (!nextReviewsUrl) return;
        setIsFetchingMore(true);
        try {
            const response = await authFetch(nextReviewsUrl);
            if (response.ok) {
                const data = await response.json();
                setReviews(prev => [...prev, ...(data.results || [])]);
                setNextReviewsUrl(data.next);
            }
        } catch (error) {
            console.error('Помилка пагінації:', error);
        } finally {
            setIsFetchingMore(false);
        }
    };

    const handleAddToList = async () => {
        if (!movie) return;
        setIsAdding(true);
        try {
            const response = await authFetch('/api/media/add/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: movie.title,
                    imdb_id: movie.imdb_id,
                    media_type: movie.media_type
                })
            });

            if (response.ok) {
                showToast('Успішно додано у ваші плани!', 'success');
                fetchMediaData(); // Перезавантажуємо, щоб отримати currentItem
            } else {
                showToast('Помилка при додаванні', 'error');
            }
        } catch (error) {
            showToast("Помилка з'єднання", 'error');
        } finally {
            setIsAdding(false);
        }
    };

    const handleUpdateMedia = async (newStatus, newScore, newReview = undefined) => {
        if (!currentItem) return;
        const bodyData = { status: newStatus, score: newScore }
        if (newReview !== undefined) bodyData.review = newReview

        try {
            const response = await authFetch(`/api/media/update/${currentItem.id}/`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyData),
            })

            if (response.ok) {
                setCurrentItem(prev => {
                    const updatedItem = { ...prev, status: newStatus, score: newScore }
                    if (newReview !== undefined) updatedItem.review = newReview
                    return updatedItem
                })
                if (newReview !== undefined) showToast('Нотатку збережено!', 'success')
                fetchReviews()
            } else {
                showToast('Помилка оновлення', 'error')
            }
        } catch (error) {
            showToast("Помилка з'єднання з сервером", 'error')
        }
    }

    const handleDeleteMedia = async () => {
        if (!currentItem || !window.confirm('Ви впевнені, що хочете видалити цей тайтл зі свого списку?')) return;
        try {
            const response = await authFetch(`/api/media/${currentItem.id}/delete/`, { method: 'DELETE' });
            if (response.ok) {
                showToast('Тайтл видалено', 'info');
                setCurrentItem(null);
                setReviewInput("");
            }
        } catch (error) {
            showToast("Помилка видалення", 'error');
        }
    };

    const handleSaveReview = () => {
        handleUpdateMedia(currentItem.status, currentItem.score, reviewInput)
        setIsEditingReview(false)
    }

    const handleDeleteReview = () => {
        if (window.confirm('Ви впевнені, що хочете видалити цей відгук?')){
            setReviewInput("")
            setIsEditingReview(false)
            handleUpdateMedia(currentItem.status, currentItem.score, "")
        }
    }

    const handleCancelEdit = () => {
        setReviewInput(currentItem.review || "")
        setIsEditingReview(false)
    }

    if (isLoading) {
        return <div className="app-container"><h2 style={{ color: 'var(--text-muted)' }}>Завантаження деталей...</h2></div>
    }

    if (!movie) {
        return (
            <div className="app-container">
                <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>Фільм не знайдено.</p>
                <button className="btn nav btn-nav-primary" onClick={() => navigate('/')}>
                    Назад до списку
                </button>
            </div>
        )
    }

    const displayType = movie.media_type === 'series' ? '📺 Серіал' : '🎬 Фільм'
    const hasReview = Boolean(currentItem?.review && currentItem.review.trim() !== "")

    return (
        <div className="home-wrapper">
            <div className="app-container">
                <button className="btn-back-modern" onClick={() => navigate(-1)}>
                    ← Назад
                </button>

                <div className="details-layout">
                
                <div className="details-poster-wrapper">
                    <img
                        className="details-poster"
                        src={movie.poster_url && movie.poster_url !== 'N/A' ? movie.poster_url : 'https://placehold.co/400x600?text=No+Poster'}
                        alt={movie.title || 'Постер'}
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                            e.currentTarget.onerror = null
                            e.currentTarget.src = 'https://placehold.co/400x600?text=No+Poster'
                        }}
                    />
                </div>

                {/* ПРАВА КОЛОНКА: Інформація */}
                <div className="details-info">
                    <div className="media-type" style={{ fontSize: '0.9rem' }}>{displayType}</div>
                    
                    <h1 className="details-title">{movie.title}</h1>

                    <div className="details-badges">
                        {movie.release_year && <span className="badge">{movie.release_year}</span>}
                        {movie.runtime && <span className="badge">⏱ {movie.runtime} хв</span>}
                        {movie.seasons && <span className="badge">Сезонів: {movie.seasons}</span>}
                        {movie.imdb_rating && movie.imdb_rating !== 'N/A' && (
                            <span className="badge badge-accent">★ IMDb {movie.imdb_rating}</span>
                        )}
                    </div>

                    <div className="details-grid">
                        {movie.genre && (
                            <div className="grid-item">
                                <span>Жанри</span>
                                <strong>{movie.genre}</strong>
                            </div>
                        )}
                        {movie.director && movie.director !== 'N/A' && (
                            <div className="grid-item">
                                <span>Режисер</span>
                                <strong>{movie.director}</strong>
                            </div>
                        )}
                        {movie.country && (
                            <div className="grid-item">
                                <span>Країна</span>
                                <strong>{movie.country}</strong>
                            </div>
                        )}
                        {movie.language && (
                            <div className="grid-item">
                                <span>Мова</span>
                                <strong>{movie.language}</strong>
                            </div>
                        )}
                        {movie.awards && movie.awards !== 'N/A' && (
                            <div className="grid-item" style={{ gridColumn: '1 / -1' }}>
                                <span>Нагороди</span>
                                <strong>🏆 {movie.awards}</strong>
                            </div>
                        )}
                        {movie.actors && movie.actors !== 'N/A' && (
                            <div className="grid-item" style={{ gridColumn: '1 / -1' }}>
                                <span>Актори</span>
                                <strong>{movie.actors}</strong>
                            </div>
                        )}
                    </div>

                    {movie.description && movie.description !== 'N/A' && (
                        <div className="details-plot">
                            <h3>Сюжет</h3>
                            <p>{movie.description}</p>
                        </div>
                    )}

                    {/* === ПАНЕЛЬ КОРИСТУВАЧА === */}
                    {!currentItem ? (
                        <div className="user-panel" style={{ textAlign: 'center', padding: '24px' }}>
                            <button 
                            onClick={handleAddToList}
                            disabled={isAdding}
                            className="btn-add-masterpiece"
                        >
                            {isAdding ? 'Додаємо...' : 'Додати у мій список'}
                        </button>
                        </div>
                    ) : (
                        <div className="user-panel">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3>Мій прогрес</h3>
                                <button className="review-btn delete" onClick={handleDeleteMedia} style={{ padding: '4px 12px', margin: 0 }}>
                                    Видалити тайтл
                                </button>
                            </div>

                            <label>Статус перегляду</label>
                            <select
                                className="status-select"
                                value={currentItem.status}
                                onChange={(e) => handleUpdateMedia(e.target.value, currentItem.score)}
                                style={{ marginBottom: '24px' }}
                            >
                                <option value="planned">Заплановано</option>
                                <option value="in_progress">Переглядаю</option>
                                <option value="completed">Переглянуто</option>
                                <option value="dropped">Покинуто</option>
                            </select>

                            <label>Моя оцінка: {currentItem.score || '—'}/10</label>
                            <div className="stars-container" style={{ justifyContent: 'flex-start', gap: '8px', marginBottom: '24px', marginTop: '10px' }}>
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                                    <span
                                        key={num}
                                        onClick={() => handleUpdateMedia(currentItem.status, currentItem.score === num ? null : num)}
                                        className={`star ${currentItem.score >= num ? 'active' : ''}`}
                                    >
                                        ★
                                    </span>
                                ))}
                            </div>
                            
                            {/* Блок рецензії */}
                            <div className="reviews-section">
                                <h3>Моя рецензія</h3>

                                {(!hasReview || isEditingReview) ? (
                                    <div className="review-form-container">
                                        <textarea
                                            className="review-textarea"
                                            placeholder="Напишіть свої враження від перегляду..."
                                            value={reviewInput}
                                            onChange={(e) => setReviewInput(e.target.value)}
                                            autoFocus={isEditingReview}
                                        />
                                        <div className="review-form-actions">
                                            {hasReview && (
                                                <button 
                                                    className="btn-secondary" 
                                                    onClick={handleCancelEdit}
                                                    style={{ padding: '8px 16px', width: 'auto', height: 'auto', fontSize: '0.9rem' }}
                                                >
                                                    Скасувати
                                                </button>
                                            )}
                                            <button 
                                                className="review-btn" 
                                                onClick={handleSaveReview}
                                                disabled={!reviewInput.trim() || reviewInput === currentItem.review}
                                            >
                                                {hasReview ? 'Зберегти зміни' : 'Зберегти нотатку'}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="review-card">
                                        <p className="review-text">{currentItem.review}</p>
                                        <div className="review-actions">
                                            <button className="review-btn" onClick={() => setIsEditingReview(true)}>
                                                Редагувати
                                            </button>
                                            <button className="review-btn delete" onClick={handleDeleteReview}>
                                                Видалити
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                </div>

                <div style={{ marginTop: '40px' }}>
                    <h2 style={{ color: 'white', marginBottom: '24px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '24px' }}>
                        Відгуки спільноти
                    </h2>

                    {reviews.length === 0 ? (
                        <div className="empty-state-glass">
                            <p>Поки що немає жодного відгуку. Станьте першим!</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {reviews.filter(r => r.review && r.review.trim() !== "").map(review => (
                                <div key={review.id} className="glass-card" style={{ padding: '20px', borderRadius: '16px', marginBottom: '20px' }}>
                                    <div style={{ display: 'flex', gap: '16px' }}>
                                        <img 
                                            src={getAvatarUrl(review.user_avatar)} 
                                            alt={review.username}
                                            onClick={() =>{
                                                if (!review.is_mine) navigate(`/user/${review.user_id}`)
                                            }}
                                            style={{ 
                                                width: '50px', 
                                                height: '50px', 
                                                borderRadius: '50%', 
                                                objectFit: 'cover', 
                                                flexShrink: 0,
                                                cursor: review.is_mine ? 'default':'pointer'
                                            }}
                                        />
                                        <div style={{ flexGrow: 1 }}>
                                            
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', flexWrap: 'wrap', gap: '10px' }}>
                                                
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                                    <h3 
                                                        onClick={() =>{
                                                            if(!review.is_mine) navigate(`/user/${review.user_id}`)
                                                        }}
                                                        style={{ 
                                                            margin: 0, 
                                                            color: 'white',
                                                            cursor: review.is_mine ? 'default':'pointer'
                                                        }}
                                                        className="review-author-name" 
                                                    >
                                                        {review.username}
                                                    </h3>
                                                    
                                                    {review.is_mine && (
                                                        <div className="priority-badge mine" style={{ position: 'static', margin: 0 }}>Твій відгук</div>
                                                    )}
                                                    {review.is_friend && (
                                                        <div className="priority-badge friend" style={{ position: 'static', margin: 0 }}>Відгук друга</div>
                                                    )}
                                                </div>

                                                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
                                                    {new Date(review.added_at).toLocaleDateString('uk-UA')}
                                                </span>
                                            </div>

                                            {review.score > 0 && (
                                                <div style={{ color: 'var(--accent-star, #fbbf24)', fontWeight: 'bold', marginBottom: '12px', fontSize: '0.95rem' }}>
                                                    Оцінка: {review.score}/10 ★
                                                </div>
                                            )}

                                            {review.review && review.review.trim() !== "" && (
                                                <p style={{ margin: 0, fontStyle: 'italic', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                                                    "{review.review}"
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {nextReviewsUrl && (
                                <button 
                                    onClick={loadMoreReviews} 
                                    disabled={isFetchingMore}
                                    className="btn-details"
                                    style={{ margin: '20px auto', width: '200px', display: 'block', textAlign: 'center' }}
                                >
                                    {isFetchingMore ? 'Завантаження...' : 'Показати ще'}
                                </button>
                            )}
                        </div>
                    )}
                </div>

            </div>
            {toast && (
                <div className="toast-container">
                    <div className={`toast ${toast.type}`}>
                        {toast.text}
                    </div>
                </div>
            )}
        </div>
    )
}

export default MediaDetailsPage;