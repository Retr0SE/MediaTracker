import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../config'

export default function ProfilePage() {
    const navigate = useNavigate()
    const { token, authFetch } = useAuth()
    const { showToast } = useToast()
    const fileInputRef = useRef(null)

    const [loading, setLoading] = useState(true)
    const [userData, setUserData] = useState(null)
    const [statsData, setStatsData] = useState(null)

    const handleAvatarClick = () => fileInputRef.current.click()

    const getAvatarUrl = (avatarPath) => {
        if (!avatarPath) return '/default-avatar.png'
        if (avatarPath.startsWith('http')) return avatarPath
        return `${API_BASE_URL}${avatarPath}`
    }

    const getPosterUrl = (url) => {
        if (!url || url === 'N/A') return 'https://placehold.co/400x600?text=No+Poster'
        if (url.startsWith('file://') || url.includes(':\\')) return 'https://placehold.co/400x600?text=Path+Error'
        if (url.startsWith('/')) return `${API_BASE_URL}${url}`
        if (!url.startsWith('http') && url.startsWith('MV5')) return `https://m.media-amazon.com/images/M/${url}`
        return url
    }

    const handleFileChange = async (event) => {
        const file = event.target.files[0]
        if (!file) return

        if (file.size > 5 * 1024 * 1024) {
            showToast('Файл занадто великий. Максимум 5 MB.', 'error')
            return
        }

        const formData = new FormData()
        formData.append('avatar', file)

        try {
            const response = await fetch(`${API_BASE_URL}/api/users/profile/`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            })

            if (response.ok) {
                const updatedUser = await response.json()
                setUserData(prev => ({ ...prev, avatar: updatedUser.avatar }))
                showToast('Аватарку успішно оновлено!', 'success')
            } else {
                showToast('Не вдалося оновити аватарку. Перевірте формат файлу.', 'error')
            }
        } catch (error) {
            showToast('Помилка з\'єднання з сервером', 'error')
        }
    }

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                const [userRes, statsRes] = await Promise.all([
                    authFetch('/api/users/profile/'),
                    authFetch('/api/users/profile/stats/')
                ])

                if (userRes.ok && statsRes.ok) {
                    setUserData(await userRes.json())
                    setStatsData(await statsRes.json())
                }
            } catch (error) {
                console.error("Помилка завантаження даних", error)
                showToast('Не вдалося завантажити статистику', 'error')
            } finally {
                setLoading(false)
            }
        }
        fetchProfileData()
    }, [authFetch])

    if (loading) {
        return (
            <div className="profile-wrapper">
                <div className="profile-dashboard app-container">
                    <h2 style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Аналізуємо ваш профіль...</h2>
                </div>
            </div>
        )
    }

    const { stats, achievements_data: achData, chart_data: chartData, total_genre_tags, records } = statsData || {}
    
    const achievements = [
        { id: 'retro', icon: '📼', title: 'Ретроград', desc: 'Переглянуто 5+ ретро-фільмів (до 1990)', unlocked: achData?.retro_count >= 5 },
        { id: 'world', icon: '🌍', title: 'Громадянин світу', desc: 'Фільми з 5+ різних країн', unlocked: achData?.unique_countries >= 5 },
        { id: 'horror', icon: '🔪', title: 'Сталеві нерви', desc: 'Здолано 3+ фільми жахів', unlocked: achData?.horror_count >= 3 },
        { id: 'snob', icon: '🧐', title: 'Кіно-Сноб', desc: 'Середня оцінка профілю нижче 5.0', unlocked: (stats?.avg_score > 0 && stats?.avg_score < 5.0) },
        { id: 'series', icon: '🍿', title: 'Серіальний маніяк', desc: 'Повністю завершено 3+ серіали', unlocked: achData?.series_completed >= 3 },
        { id: 'ruthless', icon: '🗑️', title: 'Безжалісний', desc: 'Покинуто 3+ нудних тайтли', unlocked: achData?.dropped_count >= 3 },
        { id: 'reviewer', icon: '✍️', title: 'Золоте перо', desc: 'Написано 5+ рецензій', unlocked: achData?.written_reviews >= 5 },
        { id: 'masterpiece', icon: '🏆', title: 'Шукач шедеврів', desc: 'Поставлено п\'ять оцінок 10/10', unlocked: achData?.tens_count >= 5 },
        { id: 'dreamer', icon: '☁️', title: 'Мрійник', desc: 'Додано 10+ тайтлів у плани', unlocked: achData?.planned_count >= 10 },
        { id: 'hype', icon: '🔥', title: 'На хайпі', desc: 'Переглянуто 3+ свіжих новинки', unlocked: achData?.fresh_count >= 3 }
    ]

    const radius = 42
    const circumference = 2 * Math.PI * radius
    let cumulativePercent = 0

    return (
        <div className="profile-wrapper">
            <div className="profile-dashboard app-container" style={{ position: 'relative', zIndex: 1 }}>
                
                <div className="profile-header-card glass-card">
                    {records?.masterpieces?.length > 0 && (
                        <div className="dynamic-bg">
                            {records.masterpieces.map(item => (
                                <img key={item.id} src={getPosterUrl(item.poster_url)} alt="bg" />
                            ))}
                        </div>
                    )}
                    
                    <div className="profile-avatar-large" onClick={handleAvatarClick} style={{ position: 'relative', zIndex: 2 }}>
                        {userData?.avatar ? (
                            <img src={getAvatarUrl(userData?.avatar)} alt="Avatar" className="profile-avatar-image" />
                        ) : (
                            userData?.username ? userData.username.charAt(0).toUpperCase() : '?'
                        )}
                        <div className="avatar-overlay">📷</div>
                        <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} />
                    </div>
                    
                    <div className="profile-info" style={{ position: 'relative', zIndex: 2 }}>
                        <h1 style={{ marginBottom: '8px' }}>{userData?.username || 'Користувач'}</h1>
                        <p style={{ color: 'var(--text-muted)' }}>
                            Користувач &bull; {userData?.year_joined || new Date().getFullYear()}
                        </p>
                    </div>
                </div>

                {total_genre_tags > 0 && (
                    <div className="chart-container glass-card">
                        <h3 className="chart-title">Аналітика жанрів</h3>
                        <div className="donut-layout">
                            <div className="donut-wrapper">
                                <svg viewBox="0 0 100 100" className="donut-svg">
                                    <circle cx="50" cy="50" r={radius} className="donut-bg" />
                                    {chartData.map((item) => {
                                        const percent = item.value / total_genre_tags;
                                        const strokeLength = percent * circumference;
                                        const offset = cumulativePercent * circumference;
                                        cumulativePercent += percent;
                                        const renderLength = strokeLength > 3 ? strokeLength - 3 : strokeLength;

                                        return (
                                            <circle
                                                key={item.id} cx="50" cy="50" r={radius}
                                                className="donut-segment" stroke={item.color}
                                                strokeDasharray={`${renderLength} ${circumference}`}
                                                strokeDashoffset={-offset} title={`${item.label}: ${item.value}`}
                                            />
                                        );
                                    })}
                                </svg>
                                <div className="donut-center">
                                    <span className="donut-center-value" style={{fontSize: chartData[0]?.label.length > 8 ? '1.2rem' : '1.5rem', color: chartData[0]?.color}}>
                                        {chartData[0]?.label || '-'}
                                    </span>
                                    <span className="donut-center-label">Топ Жанр</span>
                                </div>
                            </div>
                            
                            <div className="donut-legend">
                                {chartData.map(item => (
                                    <div key={item.id} className="legend-item">
                                        <span className="legend-dot" style={{ backgroundColor: item.color, boxShadow: `0 0 8px ${item.color}` }}></span>
                                        <div style={{display: 'flex', flexDirection: 'column'}}>
                                            <span>{item.label}</span>
                                            <span style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>{item.value} тайтлів</span>
                                        </div>
                                        <strong style={{ color: 'white', marginLeft: 'auto', paddingLeft: '24px', fontSize: '1.1rem' }}>
                                            {Math.round((item.value / total_genre_tags) * 100)}%
                                        </strong>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <h2 className="section-title">Нагороди профілю</h2>
                <div className="achievements-grid">
                    {achievements.map(ach => (
                        <div key={ach.id} className={`achievement-card glass-card ${ach.unlocked ? 'unlocked' : 'locked'}`}>
                            <div className="achievement-icon">{ach.icon}</div>
                            <div className="achievement-title">{ach.title}</div>
                            <div className="achievement-desc">
                                {ach.unlocked ? <span style={{ color: 'var(--accent-blue)', fontWeight: '600' }}>Розблоковано!</span> : ach.desc}
                            </div>
                        </div>
                    ))}
                </div>

                {(records?.oldest || records?.worst) && (
                    <>
                        <h2 className="section-title">Мої кіно-рекорди</h2>
                        <div className="records-grid">
                            
                            {records.oldest && (
                                <div className="record-card glass-card" style={{ display: 'flex', flexDirection: 'row', padding: 0, cursor: 'pointer' }}
                                     onClick={() => navigate(`/title/${records.oldest.id}`)}>
                                    <img src={getPosterUrl(records.oldest.poster_url)} alt="poster" className="record-poster" />
                                    <div className="record-info">
                                        <div className="record-label">Найдревніший тайтл</div>
                                        <div className="record-title">{records.oldest.title}</div>
                                        <div className="record-value">Рік випуску: <strong>{records.oldest.release_year}</strong></div>
                                    </div>
                                </div>
                            )}

                            {records.longest && (
                                <div className="record-card glass-card" style={{ display: 'flex', flexDirection: 'row', padding: 0, cursor: 'pointer' }}
                                     onClick={() => navigate(`/title/${records.longest.id}`)}>
                                    <img src={getPosterUrl(records.longest.poster_url)} alt="poster" className="record-poster" />
                                    <div className="record-info">
                                        <div className="record-label">Найдовший тайтл</div>
                                        <div className="record-title">{records.longest.title}</div>
                                        <div className="record-value">Тривалість: <strong>{records.longest.runtime}</strong></div>
                                    </div>
                                </div>
                            )}

                            {records.epic_series && (
                                <div className="record-card glass-card" style={{ display: 'flex', flexDirection: 'row', padding: 0, cursor: 'pointer' }}
                                     onClick={() => navigate(`/title/${records.epic_series.id}`)}>
                                    <img src={getPosterUrl(records.epic_series.poster_url)} alt="poster" className="record-poster" />
                                    <div className="record-info">
                                        <div className="record-label" style={{ color: 'var(--accent-blue)' }}>Серіальний епік</div>
                                        <div className="record-title">{records.epic_series.title}</div>
                                        <div className="record-value">Сезонів: <strong>{records.epic_series.total_seasons}</strong></div>
                                    </div>
                                </div>
                            )}

                            {records.top_imdb && (
                                <div className="record-card glass-card" style={{ display: 'flex', flexDirection: 'row', padding: 0, cursor: 'pointer' }}
                                     onClick={() => navigate(`/title/${records.top_imdb.id}`)}>
                                    <img src={getPosterUrl(records.top_imdb.poster_url)} alt="poster" className="record-poster" />
                                    <div className="record-info">
                                        <div className="record-label" style={{ color: 'var(--accent-star, #fbbf24)' }}>Фаворит IMDb</div>
                                        <div className="record-title">{records.top_imdb.title}</div>
                                        <div className="record-value">Рейтинг IMDb: <strong style={{ color: 'var(--accent-star, #fbbf24)' }}>{records.top_imdb.imdb_rating} ⭐</strong></div>
                                    </div>
                                </div>
                            )}

                            {records.worst && (
                                <div className="record-card glass-card" style={{ display: 'flex', flexDirection: 'row', padding: 0, cursor: 'pointer' }}
                                     onClick={() => navigate(`/title/${records.worst.id}`)}>
                                    <img src={getPosterUrl(records.worst.poster_url)} alt="poster" className="record-poster" />
                                    <div className="record-info">
                                        <div className="record-label" style={{ color: 'var(--danger)' }}>Найбільше розчарування</div>
                                        <div className="record-title">{records.worst.title}</div>
                                        <div className="record-value">Оцінка: <strong style={{ color: 'var(--danger)' }}>{records.worst.score} / 10</strong></div>
                                    </div>
                                </div>
                            )}

                        </div>
                    </>
                )}
            </div>
        </div>
    )
}