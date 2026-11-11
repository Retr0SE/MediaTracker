import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { API_BASE_URL } from "../config";

const FriendsListPage = () => {
    const [query, setQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    
    const [myFriends, setMyFriends] = useState([]);
    const [isLoadingFriends, setIsLoadingFriends] = useState(true);

    const { authFetch } = useAuth();
    const { showToast } = useToast();

    const getAvatarUrl = (avatarPath) => {
        if (!avatarPath) return 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
        if (avatarPath.startsWith('http')) return avatarPath;
        const path = avatarPath.startsWith('/') ? avatarPath : `/${avatarPath}`;
        return `${API_BASE_URL}${path}`;
    };

    useEffect(() => {
        const fetchFriends = async () => {
            try {
                const response = await authFetch('/api/users/friends/');
                if (response.ok) {
                    const data = await response.json();
                    setMyFriends(data.results || data || []);
                }
            } catch (error) {
                console.error("Помилка завантаження друзів:", error);
            } finally {
                setIsLoadingFriends(false);
            }
        };
        fetchFriends();
    }, [authFetch]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (query.trim().length >= 3) {
                setIsSearching(true);
                try {
                    const response = await authFetch(`/api/users/search/?q=${query}`);
                    if (response.ok) {
                        const data = await response.json();
                        setSearchResults(data.results || data || []);
                    }
                } catch (error) {
                    console.error("Search error:", error);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults([]);
                setIsSearching(false);
            }
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [query, authFetch]);

    const handleToggleFollow = async (userId) => {
        try {
            const response = await authFetch(`/api/users/follow/${userId}/`, { method: 'POST' });
            if (response.ok) {
                const data = await response.json();
                
                if (data.status === "followed") {
                    showToast("Ви підписалися!", "success");
                    setSearchResults(searchResults.map(user => 
                        user.id === userId ? { ...user, is_following: true } : user
                    ));

                    const userToAdd = searchResults.find(u => u.id === userId)
                    if (userToAdd && !myFriends.some(friend => friend.id === userId)){
                        setMyFriends(prevFriends => [{...userToAdd, is_following: true}, ...prevFriends])
                    }
                } else if (data.status === "unfollowed") {
                    showToast("Ви відписалися", "info");
                    setSearchResults(searchResults.map(user => 
                        user.id === userId ? { ...user, is_following: false } : user
                    ));
                    setMyFriends(myFriends.filter(friend => friend.id !== userId));
                }
            }
        } catch (error) {
            showToast("Помилка з'єднання", "error");
        }
    };

    const isSearchingMode = query.length >= 3;
    const displayUsers = isSearchingMode ? searchResults : myFriends;

    return (
        <div className="home-wrapper">
            <div className="app-container" style={{ position: 'relative', zIndex: 1, paddingTop: '30px', paddingBottom: '50px' }}>
                
                {/* Рядок пошуку, який тобі сподобався (без змін) */}
                <div style={{ position: 'relative', marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px auto' }}>
                    <input 
                        type="text" 
                        className="search-input-glass"
                        placeholder="Знайти користувачів за нікнеймом..." 
                        value={query} 
                        onChange={(e) => setQuery(e.target.value)}
                        style={{ paddingRight: '45px', width: '100%' }} 
                    />
                    {query && (
                        <span 
                            className="search-clear-btn"
                            onClick={() => { setQuery(''); setSearchResults([]); }}
                            title="Очистити"
                        >✖</span>
                    )}
                </div>

                <div className="filters-sort-row" style={{ marginBottom: '24px', justifyContent: 'center' }}>
                    <h2 className="community-title" style={{ margin: 0, textAlign: 'center' }}>
                        {isSearchingMode ? (isSearching ? "Шукаємо..." : "Результати пошуку") : "Мої підписки"}
                    </h2>
                </div>

                <div className="friends-list-container">
                    {isLoadingFriends && !isSearchingMode ? (
                        Array.from({ length: 4 }).map((_, index) => (
                            <div key={index} className="skeleton-card" style={{ height: '80px', borderRadius: '16px' }}></div>
                        ))
                    ) : displayUsers.length === 0 ? (
                        <div className="empty-state-glass">
                            <p>{isSearchingMode ? "Користувачів не знайдено." : "Ви ще нікого не відстежуєте."}</p>
                        </div>
                    ) : (
                        displayUsers.map(user => (
                            <div key={user.id} className="glass-card friend-row-card">
                                
                                <div className="friend-avatar-wrapper">
                                    <Link to={`/user/${user.id}`}>
                                        <img 
                                            src={getAvatarUrl(user.avatar)} 
                                            alt={user.username} 
                                            className="friend-avatar-img"
                                        />
                                    </Link>
                                </div>
                                
                                <div className="friend-info">
                                    <Link to={`/user/${user.id}`} style={{ textDecoration: 'none' }}>
                                        <h3 className="friend-username">{user.username}</h3>
                                    </Link>
                                    <p className="friend-status">
                                        {user.is_following ? 'Відстежується' : 'Новий користувач'}
                                    </p>
                                </div>
                                
                                <div className="friend-actions">
                                    <button 
                                        onClick={() => handleToggleFollow(user.id)} 
                                        className={`btn-follow-compact ${user.is_following ? 'is-following' : 'not-following'}`}
                                    >
                                        {user.is_following ? 'Відписатися' : 'Підписатися'}
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default FriendsListPage;