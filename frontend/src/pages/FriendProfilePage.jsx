import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { API_BASE_URL } from '../config';

const FriendProfilePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { authFetch } = useAuth();
    const { showToast } = useToast();

    const [profile, setProfile] = useState(null);
    const [userMedia, setUserMedia] = useState([]);

    const [isLoading, setIsLoading] = useState(true);
    const [nextUrl, setNextUrl] = useState(null)
    const [isLoadingMore, setIsLoadingMore] = useState(false)

    const getAvatarUrl = (avatarPath) => {
        if (!avatarPath) return 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
        if (avatarPath.startsWith('http')) return avatarPath;
        return `${API_BASE_URL}}${avatarPath}`;
    };

    const getPosterUrl = (url) => {
        if (!url || url === 'N/A')return 'https://placehold.co/400x600?text=No+Poster'
        if(url.startsWith('file://') || url.includes(':\\')){
            return 'https://placehold.co/400x600?text=Path+Error'
        }
        if (url.startsWith('/')){
            return `${API_BASE_URL}${url}`
        }
        if(!url.startsWith('http')){
            if(url.startsWith('MV5')){
                return `https://m.media-amazon.com/images/M/${url}`
            }
            return 'https://placehold.co/400x600?text=Invalid+URL'
        }
        return url

    }

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const profileRes = await authFetch(`/api/users/${id}/`);
                if (profileRes.ok) setProfile(await profileRes.json());

                const mediaRes = await authFetch(`/api/users/${id}/media/`);
                if (mediaRes.ok) {
                    const mediaData = await mediaRes.json();
                    if (mediaData.results){
                        setUserMedia(mediaData.results)
                        setNextUrl(mediaData.next);
                    }else {
                        setUserMedia(mediaData || [])
                    }
                }
            } catch (error) {
                console.error("Помилка завантаження профілю:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [id, authFetch]);

    const handleLoadMore = async () => {
        if(!nextUrl) return
        setIsLoadingMore(true)
        try{
            const urlPath = new URL(nextUrl).pathname + new URL(nextUrl).search
            const response = await authFetch(urlPath)
            if (response.ok){
                const data = await response.json()
                setUserMedia(prev => [...prev, ...data.results])
                setNextUrl(data.next)
            }
        } catch (error){
            showToast("Помилка завантаження списку", "error")
        } finally {
            setIsLoadingMore(false)
        }
    }

    const handleToggleFollow = async () => {
        try {
            const response = await authFetch(`/api/users/follow/${id}/`, { method: 'POST' });
            if (response.ok) {
                const data = await response.json();

                if (data.status === "followed") {
                    showToast('Ви підписалися!', 'success');
                    setProfile(prev => ({ ...prev, is_following: true }));
                } else if (data.status === "unfollowed") {
                    showToast("Ви відписалися", 'info');
                    setProfile(prev => ({ ...prev, is_following: false }));
                }
            }
        } catch (error) {
            showToast("Помилка з'єднання", "error");
        }
    };

    if (isLoading) {
        return (
            <div className="home-wrapper">
                <div className="app-container" style={{ paddingTop: '30px' }}>
                    <div className="skeleton-card" style={{ height: '300px', marginBottom: '40px' }}></div>
                </div>
            </div>
        );
    }

    if (!profile) return <div className="home-wrapper"><div className="empty-state-glass"><p>Користувача не знайдено</p></div></div>;

    return (
        <div className="home-wrapper">
            <div className="app-container" style={{ paddingTop: '30px', paddingBottom: '50px' }}>
                
                <button className="btn-back-modern" onClick={() => navigate(-1)}>
                    ← Назад
                </button>

                <div className="glass-card friend-profile-header">
                    <img 
                        src={getAvatarUrl(profile.avatar)} 
                        alt={profile.username} 
                        className="friend-profile-avatar"
                    />
                    
                    <h1 className="friend-profile-name">{profile.username}</h1>
                    
                    <div className="friend-stats-container">
                        <span className="stat-badge">
                            {userMedia.length} тайтлів
                        </span>
                    </div>

                    <button 
                        onClick={handleToggleFollow} 
                        className={`btn-add-masterpiece ${profile.is_following ? 'is-following' : ''}`}
                        style={{ width: 'max-content', padding: '10px 28px', fontSize: '1rem', marginTop: '10px' }}
                    >
                        {profile.is_following ? 'Відписатися' : 'Підписатися'}
                    </button>
                </div>

                <h2 style={{ color: 'white', marginBottom: '24px', textAlign: 'center' }}>Каталог користувача</h2>

                <div className="friend-media-grid">
                    {userMedia.length === 0 ? (
                        <div className="empty-state-glass" style={{ gridColumn: '1 / -1' }}>
                            <p>Цей користувач ще не додав жодного тайтлу.</p>
                        </div>
                    ) : (
                        userMedia.map(item => {
                            const media = item.media_item;
                            if (!media) return null;

                            const displayType = media.media_type === 'series' ? '📺 Серіал' : '🎬 Фільм';
                            const statusMap = {
                                'planned': 'Заплановано',
                                'in_progress': 'Переглядає',
                                'completed': 'Переглянуто',
                                'dropped': 'Покинуто'
                            };

                            return (
                                <div 
                                    key={item.id} 
                                    className="media-card-premium glass-card friend-media-card"
                                    onClick={() => navigate(`/catalog/${media.id}`)}
                                    style={{ cursor: 'pointer', transition: 'transform 0.2s ease', '&:hover': { transform: 'scale(1.02)' } }}
                                >
                                    
                                    <div className="friend-poster-wrapper">
                                        <img
                                            src={getPosterUrl(media.poster_url)}
                                            alt={media.title}
                                            loading='lazy'
                                            decoding='async'
                                            onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/400x600?text=No+Poster'}}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                        <div className="card-badge-overlay">{displayType}</div>
                                    </div>
                                    
                                    <div className="friend-media-info" style={{ padding: '16px' }}>
                                        <h3 title={media.title} className="friend-media-title" style={{ fontSize: '1.1rem', margin: '0 0 8px 0' }}>
                                            {media.title}
                                        </h3>
                                        
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span className="genre-badge" style={{ margin: 0, fontSize: '0.75rem' }}>
                                                {statusMap[item.status] || item.status}
                                            </span>
                                            {item.score > 0 && (
                                                <div style={{ color: 'var(--accent-star, #fbbf24)', fontWeight: 'bold', fontSize: '0.9rem' }}>
                                                    {item.score} ★
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {nextUrl && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '40px' }}>
                        <button 
                            className="btn-add-masterpiece" 
                            onClick={handleLoadMore} 
                            disabled={isLoadingMore}
                            style={{ width: 'max-content', padding: '12px 32px' }}
                        >
                            {isLoadingMore ? '⏳ Завантаження...' : 'Показати ще ↓'}
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
};

export default FriendProfilePage;