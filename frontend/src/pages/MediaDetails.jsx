import { useState, useCallback, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../AuthContext";

function MediaDetails(){
    const { id } = useParams()
    const navigate = useNavigate()

    const [currentItem, setCurrentItem] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [toast, setToast] = useState(null)

    const [isEditingReview, setIsEditingReview] = useState(false)
    const [reviewInput, setReviewInput] = useState('')

    const {authFetch} = useAuth()

    const showToast = useCallback((text, type = 'success') => {
        setToast({ text, type })
        setTimeout(() => { setToast(null) }, 3500)
    }, [])

    useEffect(() => {
        const fetchMedia = async () => {
            try {
                const response = await authFetch('/api/media/my-list/')

                if (!response.ok) {
                    throw new Error('Не вдалося завантажити список')
                }   

                const data = await response.json()
                const selectedItem = data.find(item => String(item.id) === id)
                setCurrentItem(selectedItem || null)
                if (selectedItem && selectedItem.review){
                    setReviewInput(selectedItem.review)
                }
            } catch (error) {
                showToast('Помилка завантаження фільму', 'error')
            } finally {
                setIsLoading(false)
            }
        }
        fetchMedia()
    }, [id, showToast, authFetch])

    const handleUpdateMedia = async (newStatus, newScore, newReview = undefined) => {
        const bodyData = { status: newStatus, score: newScore }
        if (newReview !== undefined) bodyData.review = newReview

        try {
            const response = await authFetch(`/api/media/update/${id}/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(bodyData),
            })

            if (response.ok) {
                setCurrentItem(prev => {
                    if (!prev) return prev
                    const updatedItem = { ...prev, status: newStatus, score: newScore }
                    if (newReview !== undefined) updatedItem.review = newReview
                    return updatedItem
                })
                if (newReview !== undefined) showToast('Нотатку збережено!', 'success')
            } else {
                showToast('Помилка оновлення', 'error')
            }
        } catch (error) {
            showToast("Помилка з'єднання з сервером", 'error')
        }
    }

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

    if (!currentItem) {
        return (
            <div className="app-container">
                <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>Фільм не знайдено у вашому списку.</p>
                <button className="btn nav btn-nav-primary" onClick={() => navigate('/')}>
                    Назад до списку
                </button>
            </div>
        )
    }

    const media = currentItem.media_item
    const displayType = media?.media_type === 'series' ? '📺 Серіал' : '🎬 Фільм'

    const hasReview = Boolean(currentItem.review && currentItem.review.trim() !== "")

    return (
        <div className="app-container">
            <button className="btn-back" onClick={() => navigate('/')}>
                ← Назад до списку
            </button>

            <div className="details-layout">
                
                {/* ЛІВА КОЛОНКА: Постер */}
                <div className="details-poster-wrapper">
                    <img
                        className="details-poster"
                        src={media?.poster_url && media.poster_url !== 'N/A' ? media.poster_url : 'https://placehold.co/400x600?text=No+Poster'}
                        alt={media?.title || 'Постер'}
                        onError={(e) => {
                            e.currentTarget.onerror = null
                            e.currentTarget.src = 'https://placehold.co/400x600?text=No+Poster'
                        }}
                    />
                </div>

                {/* ПРАВА КОЛОНКА: Інформація */}
                <div className="details-info">
                    <div className="media-type" style={{ fontSize: '0.9rem' }}>{displayType}</div>
                    
                    <h1 className="details-title">{media?.title}</h1>

                    {/* Бейджі */}
                    <div className="details-badges">
                        {media?.release_year && <span className="badge">{media.release_year}</span>}
                        {media?.duration && <span className="badge">⏱ {media.duration} хв</span>}
                        {media?.seasons && <span className="badge">Сезонів: {media.seasons}</span>}
                        {media?.imdb_rating && media.imdb_rating !== 'N/A' && (
                            <span className="badge badge-accent">★ IMDb {media.imdb_rating}</span>
                        )}
                    </div>

                    {/* Сітка метаданих */}
                    <div className="details-grid">
                        {media?.genre && (
                            <div className="grid-item">
                                <span>Жанри</span>
                                <strong>{media.genre}</strong>
                            </div>
                        )}
                        {media?.director && media.director !== 'N/A' && (
                            <div className="grid-item">
                                <span>Режисер</span>
                                <strong>{media.director}</strong>
                            </div>
                        )}
                        {media?.country && (
                            <div className="grid-item">
                                <span>Країна</span>
                                <strong>{media.country}</strong>
                            </div>
                        )}
                        {media?.language && (
                            <div className="grid-item">
                                <span>Мова</span>
                                <strong>{media.language}</strong>
                            </div>
                        )}
                        {media?.awards && media.awards !== 'N/A' && (
                            <div className="grid-item" style={{ gridColumn: '1 / -1' }}>
                                <span>Нагороди</span>
                                <strong>🏆 {media.awards}</strong>
                            </div>
                        )}
                        {media?.actors && media.actors !== 'N/A' && (
                            <div className="grid-item" style={{ gridColumn: '1 / -1' }}>
                                <span>Актори</span>
                                <strong>{media.actors}</strong>
                            </div>
                        )}
                    </div>

                    {/* Сюжет */}
                    {media?.description && media.description !== 'N/A' && (
                        <div className="details-plot">
                            <h3>Сюжет</h3>
                            <p>{media.description}</p>
                        </div>
                    )}

                    {/* Панель користувача (Прогрес) */}
                    <div className="user-panel">
                        <h3>Мій прогрес</h3>

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
                        

                        {/* === БЛОК РЕЦЕНЗІЇ === */}
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

export default MediaDetails