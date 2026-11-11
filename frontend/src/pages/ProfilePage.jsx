import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../config'

export default function ProfilePage() {
    const navigate = useNavigate()

    const [mediaList, setMediaList] = useState([])
    const [loading, setLoading] = useState(true)
    const [userData, setUserData] = useState(null)

    const {token, authFetch} = useAuth()

    const { showToast }= useToast()

    const fileInputRef = useRef(null)

    const handleAvatarClick = () => {
        fileInputRef.current.click()
    }

    const getAvatarUrl = (avatarPath) => {
        if(!avatarPath) return '/default-avatar.png'
        if(avatarPath.startsWith('http')) return avatarPath
        return `${API_BASE_URL}${avatarPath}`
    }

    const handleFileChange = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    const MAX_FILE_SIZE = 5 * 1024 * 1024
    if (file.size > MAX_FILE_SIZE){
        showToast('Файл занадто великий. Максимум 5 MB.', 'error')
        return
    }

    const formData = new FormData()
    formData.append('avatar', file)

    try {
        const response = await fetch(`${API_BASE_URL}/api/users/profile/`, {
            method: 'PATCH',
            headers: {
                'Authorization' : `Bearer ${token}`
            },
            body: formData,
        })

        if (response.ok) {
            const updatedUser = await response.json()
            setUserData(prev => ({...prev, avatar: updatedUser.avatar}))
            showToast('Аватарку успішно оновлено!', 'success')
        } else {
            const errorData = await response.json()
            console.error('API Error:', errorData)
            showToast('Не вдалося оновити аватарку. Перевірте формат файлу.', 'error')
        }
    } catch (error) {
        console.error('Network Error:', error)
        showToast('Помилка з\'єднання з сервером', 'error')
    }
}

    useEffect(() => {
        const fetchMyList = async () => {
            try {
                const [listResponse, userResponse] = await Promise.all([
                    authFetch('/api/media/my-list/all/'),
                    authFetch('/api/users/profile/')
                ]);

                if (listResponse.ok && userResponse.ok){
                    const ListData = await listResponse.json()
                    const UserJson = await userResponse.json()

                    setMediaList(ListData);
                    setUserData(UserJson)
                }
            } catch (error) {
                console.error("Помилка завантаження даних", error); 
            } finally {
                setLoading(false);
            }
        };
        fetchMyList();

    }, [authFetch]);

    const completedItems = mediaList.filter(item => item.status === 'completed');

    const ratedItems = mediaList.filter(item => item.score > 0);
    const averageScore = ratedItems.length ? (ratedItems.reduce((acc, curr) => acc + curr.score, 0) / ratedItems.length).toFixed(1) : 0;

    const masterpieces = ratedItems.filter(item => item.score === 10).slice(0, 5)

    let oldestMedia = null
    let minYear = 9999

    let longestMedia = null
    let maxDuration = 0

    let epicSeries = null
    let maxSeasons = 0

    let topImdbMedia = null
    let maxImdbRating = 0

    const validForRecords = mediaList.filter(item => item.status === 'completed' || item.score > 0)
    validForRecords.forEach(item => {
        const media = item.media_item || item.media;
        if (!media) return

        const year = parseInt(media.release_year, 10)
        if (!isNaN(year)){
            minYear = year
            oldestMedia = item
        }

        const durationStr = String(media.runtime || "0").replace(/\D/g, '')
        const durationInt = parseInt(durationStr, 10)
        if (!isNaN(durationInt) && durationInt > maxDuration){
            maxDuration = durationInt
            longestMedia = item
        }

        if (media.media_type === "series"){
            const seasonsStr = String(media.total_seasons || media.seasons || "1").replace(/\D/g, '')
            const seasonsInt = parseInt(seasonsStr, 10)
            if (!isNaN(seasonsInt) && seasonsInt > maxSeasons){
                maxSeasons = seasonsInt
                epicSeries = item
            }
        }

        const imdbRating = parseFloat(media.imdb_rating || "0")
        if (!isNaN(imdbRating) && imdbRating > maxImdbRating){
            maxImdbRating = imdbRating
            topImdbMedia = item
        }

    })
    let worstMedia = null
    ratedItems.forEach(item => {
        if(!worstMedia || item.score < worstMedia.score){ 
            worstMedia = item
        }
    })

    const currentYear = new Date().getFullYear()
    const oldMoviesCount = completedItems.filter(item => {
        const year = parseInt((item.media_item || item.media)?.release_year, 10)
        return year && year < 1990
    }).length

    const uniqueCountries = new Set(
        completedItems
        .map(item => (item.media_item || item.media)?.country || "")
        .flatMap(c => c.split(',').map(s => s.trim()))
        .filter(c => c !== "" && c !== "N/A")
    ).size

    const horrorCount = completedItems.filter(item => {
        const genre = ((item.media_item || item.media)?.genre || "").toLowerCase();
        return genre.includes('horror')
    }).length

    const seriesCount = completedItems.filter(item => (item.media_item || item.media)?.media_type === 'series').length
    const droppedCount = mediaList.filter(item => item.status === "dropped").length
    const writtenReviewsCount = mediaList.filter(item => item.review && item.review.trim() !== "").length
    const plannedCount = mediaList.filter(item => item.status === "planned").length
    const tensCount = ratedItems.filter(item => item.score === 10).length
    const freshCount = completedItems.filter(item => {
        const year = parseInt((item.media_item || item.media)?.release_year, 10)
        return year && year >= currentYear - 1
    }).length

    const totalItems = mediaList.length
    const totalCompleted = completedItems.length

    const inProgressCount = mediaList.filter(item => item.status === "in_progress")

    const totalMinutes = completedItems.reduce((acc, item) => {
        const media = item.media_item || item.media
        const durationStr = String(media?.runtime || "0").replace(/\D/g, '')
        return acc + (parseInt(durationStr, 10) || 0)
    }, 0)
    const totalHours = Math.floor(totalMinutes / 60)
    const totalDays = (totalHours / 24).toFixed(1)

    const achievements = [
        {
            id: 'retro',
            icon: '📼',
            title: 'Ретроград',
            desc: 'Переглянуто 5+ ретро-фільмів (до 1990)',
            unlocked: oldMoviesCount >= 5
        },
        {
            id: 'world',
            icon: '🌍',
            title: 'Громадянин світу',
            desc: 'Фільми з 5+ різних країн',
            unlocked: uniqueCountries >= 5
        },
        {
            id: 'horror',
            icon: '🔪',
            title: 'Сталеві нерви',
            desc: 'Здолано 3+ фільми жахів',
            unlocked: horrorCount >= 3
        },
        {
            id: 'snob',
            icon: '🧐',
            title: 'Кіно-Сноб',
            desc: 'Середня оцінка профілю нижче 5.0',
            unlocked: ratedItems.length >= 5 && averageScore < 5.0
        },
        {
            id: 'series',
            icon: '🍿',
            title: 'Серіальний маніяк',
            desc: 'Повністю завершено 3+ серіали',
            unlocked: seriesCount >= 3
        },
        {
            id: 'ruthless',
            icon: '🗑️',
            title: 'Безжалісний',
            desc: 'Покинуто 3+ нудних тайтли',
            unlocked: droppedCount >= 3
        },
        {
            id: 'reviewer',
            icon: '✍️',
            title: 'Золоте перо',
            desc: 'Написано 5+ рецензій',
            unlocked: writtenReviewsCount >= 5
        },
        {
            id: 'masterpiece',
            icon: '🏆',
            title: 'Шукач шедеврів',
            desc: 'Поставлено п\'ять оцінок 10/10',
            unlocked: tensCount >= 5
        },
        {
            id: 'dreamer',
            icon: '☁️',
            title: 'Мрійник',
            desc: 'Додано 10+ тайтлів у плани',
            unlocked: plannedCount >= 10
        },
        {
            id: 'hype',
            icon: '🔥',
            title: 'На хайпі',
            desc: 'Переглянуто 3+ свіжих новинки',
            unlocked: freshCount >= 3
        }
    ];

    
    const radius = 42;
    const circumference = 2 * Math.PI * radius;
    
    const genreCounts = {};
    mediaList.forEach(item => {
        const genresStr = (item.media_item || item.media)?.genre || "";
        if (genresStr && genresStr !== "N/A") {
            genresStr.split(',').forEach(g => {
                const genre = g.trim();
                if (genre) genreCounts[genre] = (genreCounts[genre] || 0) + 1;
            });
        }
    });

    const sortedGenres = Object.entries(genreCounts).sort((a, b) => b[1] - a[1]);

    const topGenres = sortedGenres.slice(0, 4);

    const otherGenresCount = sortedGenres.slice(4).reduce((acc, curr) => acc + curr[1], 0);

    const colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'];

    const chartData = topGenres.map(([name, count], index) => ({
        id: name,
        label: name,
        value: count,
        color: colors[index]
    }));

    if (otherGenresCount > 0) {
        chartData.push({
            id: 'other',
            label: 'Інше',
            value: otherGenresCount,
            color: '#4b5563'
        });
    }

    const totalGenreTags = chartData.reduce((acc, item) => acc + item.value, 0);

    let cumulativePercent = 0;


    return (
        <div className="profile-wrapper">
            <div className="profile-dashboard app-container" style={{ position: 'relative', zIndex: 1 }}>
                
                <div className="profile-header-card glass-card">
                    {masterpieces.length > 0 && (
                        <div className="dynamic-bg">
                            {masterpieces.map(item => {
                                const media = item.media_item || item.media;
                                return <img key={item.id} src={media.poster_url} alt="bg" />;
                            })}
                        </div>
                    )}
                    
                    <div className="profile-avatar-large" onClick={handleAvatarClick} style={{ position: 'relative', zIndex: 2 }}>
                        {userData?.avatar ? (
                            <img src={getAvatarUrl(userData?.avatar)} alt="Avatar" className="profile-avatar-image" />
                        ) : (
                            userData?.username ? userData.username.charAt(0).toUpperCase() : '?'
                        )}
                        
                        <div className="avatar-overlay">📷</div>
                        
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            style={{ display: 'none' }} 
                            accept="image/png, image/jpeg, image/webp"
                            onChange={handleFileChange}
                        />
                    </div>
                    
                    <div className="profile-info" style={{ position: 'relative', zIndex: 2 }}>
                        <h1 style={{ marginBottom: '8px' }}>{userData?.username || 'Завантаження...'}</h1>
                        <p style={{ color: 'var(--text-muted)' }}>
                            Користувач &bull; {userData?.year_joined || new Date().getFullYear()}                        </p>
                    </div>
                </div>

                {loading ? (
                    <h2 style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Аналізуємо ваш профіль...</h2>
                ) : (
                    <>

                        {totalGenreTags > 0 && (
                            <div className="chart-container glass-card">
                                <h3 className="chart-title">Аналітика жанрів</h3>
                                
                                <div className="donut-layout">
                                    <div className="donut-wrapper">
                                        <svg viewBox="0 0 100 100" className="donut-svg">
                                            <circle cx="50" cy="50" r={radius} className="donut-bg" />
                                            
                                            {chartData.map((item) => {
                                                const percent = item.value / totalGenreTags;
                                                const strokeLength = percent * circumference;
                                                const offset = cumulativePercent * circumference;
                                                cumulativePercent += percent;
                                                
                                                const renderLength = strokeLength > 3 ? strokeLength - 3 : strokeLength;

                                                return (
                                                    <circle
                                                        key={item.id}
                                                        cx="50"
                                                        cy="50"
                                                        r={radius}
                                                        className="donut-segment"
                                                        stroke={item.color}
                                                        strokeDasharray={`${renderLength} ${circumference}`}
                                                        strokeDashoffset={-offset}
                                                        title={`${item.label}: ${item.value}`}
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
                                                <span 
                                                    className="legend-dot" 
                                                    style={{ backgroundColor: item.color, boxShadow: `0 0 8px ${item.color}` }}
                                                ></span>
                                                <div style={{display: 'flex', flexDirection: 'column'}}>
                                                    <span>{item.label}</span>
                                                    <span style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>
                                                        {item.value} тайтлів
                                                    </span>
                                                </div>
                                                <strong style={{ color: 'white', marginLeft: 'auto', paddingLeft: '24px', fontSize: '1.1rem' }}>
                                                    {Math.round((item.value / totalGenreTags) * 100)}%
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

                        {(oldestMedia || longestMedia || worstMedia) && (
                            <>
                                <h2 className="section-title">Мої кіно-рекорди</h2>
                                <div className="records-grid">
                                    
                                    {oldestMedia && (
                                        <div 
                                            className="record-card glass-card"
                                            style={{ display: 'flex', flexDirection: 'row', padding: 0, cursor: 'pointer' }}
                                            onClick={() => navigate(`/catalog/${(oldestMedia.media_item || oldestMedia.media).id}`)}>
                                            <img src={(oldestMedia.media_item || oldestMedia.media).poster_url} alt="poster" className="record-poster" />
                                            <div className="record-info">
                                                <div className="record-label">Найдревніший тайтл</div>
                                                <div className="record-title">{(oldestMedia.media_item || oldestMedia.media).title}</div>
                                                <div className="record-value">Рік випуску: <strong>{(oldestMedia.media_item || oldestMedia.media).release_year}</strong></div>
                                            </div>
                                        </div>
                                    )}

                                    {longestMedia && (
                                        <div className="record-card glass-card" 
                                            style={{ display: 'flex', flexDirection: 'row', padding: 0, cursor: 'pointer' }}
                                            onClick={() => navigate(`/catalog/${(longestMedia.media_item || longestMedia.media).id}`)}>
                                            <img src={(longestMedia.media_item || longestMedia.media).poster_url} alt="poster" className="record-poster" />
                                            <div className="record-info">
                                                <div className="record-label">Найдовший тайтл</div>
                                                <div className="record-title">{(longestMedia.media_item || longestMedia.media).title}</div>
                                                <div className="record-value">Тривалість: <strong>{(longestMedia.media_item || longestMedia.media).runtime}</strong></div>
                                            </div>
                                        </div>
                                    )}

                                    {epicSeries && (
                                        <div 
                                            className="record-card glass-card"     
                                            style={{ display: 'flex', flexDirection: 'row', padding: 0, cursor: 'pointer' }}
                                            onClick={() => navigate(`/catalog/${(epicSeries.media_item || epicSeries.media).id}`)}>
                                            <img src={(epicSeries.media_item || epicSeries.media).poster_url} alt="poster" className="record-poster" />
                                            <div className="record-info">
                                                <div className="record-label" style={{ color: 'var(--accent-blue)' }}>Серіальний епік</div>
                                                <div className="record-title">{(epicSeries.media_item || epicSeries.media).title}</div>
                                                <div className="record-value">Сезонів: <strong>{(epicSeries.media_item || epicSeries.media).total_seasons || (epicSeries.media_item || epicSeries.media).seasons || 'Багато'}</strong></div>
                                            </div>
                                        </div>
                                    )}

                                    {topImdbMedia && (
                                        <div 
                                            className="record-card glass-card" 
                                            style={{ display: 'flex', flexDirection: 'row', padding: 0, cursor: 'pointer' }}
                                            onClick={() => navigate(`/catalog/${(topImdbMedia.media_item || topImdbMedia.media).id}`)}>
                                            <img src={(topImdbMedia.media_item || topImdbMedia.media).poster_url} alt="poster" className="record-poster" />
                                            <div className="record-info">
                                                <div className="record-label" style={{ color: 'var(--accent-star, #fbbf24)' }}>Фаворит IMDb</div>
                                                <div className="record-title">{(topImdbMedia.media_item || topImdbMedia.media).title}</div>
                                                <div className="record-value">Рейтинг IMDb: <strong style={{ color: 'var(--accent-star, #fbbf24)' }}>{(topImdbMedia.media_item || topImdbMedia.media).imdb_rating} ⭐</strong></div>
                                            </div>
                                        </div>
                                    )}

                                    {worstMedia && worstMedia.score < 5 && (
                                        <div 
                                            className="record-card glass-card" 
                                            style={{ display: 'flex', flexDirection: 'row', padding: 0, cursor: 'pointer' }}
                                            onClick={() => navigate(`/catalog/${(worstMedia.media_item || worstMedia.media).id}`)}>
                                            <img src={(worstMedia.media_item || worstMedia.media).poster_url} alt="poster" className="record-poster" />
                                            <div className="record-info">
                                                <div className="record-label" style={{ color: 'var(--danger)' }}>Найбільше розчарування</div>
                                                <div className="record-title">{(worstMedia.media_item || worstMedia.media).title}</div>
                                                <div className="record-value">Оцінка: <strong style={{ color: 'var(--danger)' }}>{worstMedia.score} / 10</strong></div>
                                            </div>
                                        </div>
                                    )}

                                </div>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}