import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { useToast } from '../ToastContext'
import { API_BASE_URL } from '../config'


function UserList(){
  const [mediaList, setMediaList] = useState([])
  const [nextPageUrl, setNextPageUrl] = useState(null)
  const [isFetchingMore, setIsFetchingMore] = useState(false)
  const {token, authFetch} = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)

  const [activeFilter, setActiveFilter] = useState('all')
  const [sortOrder, setSortOrder] = useState('default')

  const { showToast } = useToast()
  const navigate = useNavigate()

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
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length >= 3) {
        try {
          const response = await authFetch(`/api/media/search/?q=${searchQuery}`)
          if (response.ok) {
            const data = await response.json()
            setSearchResults(data)
            setShowDropdown(true)
          }
        } catch (error) {
          console.error("Помилка пошуку", error)
        }
      } else {
        setSearchResults([])
        setShowDropdown(false)
      }
    }, 500)

    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery, authFetch])

  const handleSelectAndAdd = async (title, type, imdbID) => {
    setShowDropdown(false)
    setSearchQuery('')
    setIsLoading(true)

    console.log("Відправляємо на бекенд:", { title, type, imdb_id: imdbID });

    try {
      const response = await authFetch('/api/media/add/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: title, media_type: type === 'series' ? 'series' : 'movie', imdb_id: imdbID })
      })

      const data = await response.json()
      if (response.ok) {
        showToast('Тайтл успішно додано до вашого списку!', 'success')
        fetchMyList() 
      } else if (response.status === 200){
        showToast('Цей тайтл вже є у вашому списку.', 'error')
      }else {
        showToast('Сталася помилка при додаванні.', 'error')
      }
    } catch (error) {
      showToast('Помилка з\'єднання з сервером', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchMyList = useCallback(async(loadMoreUrl = null) => {
        if (loadMoreUrl){
          setIsFetchingMore(true)
        } else{
          setIsLoading(true)
        }

        try {
          let url = loadMoreUrl
        
          if (!url) {
              const params = new URLSearchParams()

              if (activeFilter === 'movies' || activeFilter === 'movie'){
                params.append('media_item__media_type', 'movie')
              } else if(activeFilter === 'series'){
                params.append('media_item__media_type', 'series')
              } else if(activeFilter !== 'all'){
                params.append('status', activeFilter)
              }

              const sortMap = {
                'default': '-id',
                'title_asc': 'media_item__title',
                'title_desc': '-media_item__title',
                'year_desc': '-media_item__release_year',
                'year_asc': 'media_item__release_year',
                'score_desc': '-score',
                'score_asc': 'score',
              }
              
              if (sortMap[sortOrder]){
                params.append('ordering', sortMap[sortOrder])
              }
              url = `/api/media/my-list/?${params.toString()}`
            }
            const response = await authFetch(url)
            if (response.ok){
              const data = await response.json()
              const fetchedItems = data.results || data || []
              
              if(loadMoreUrl){
                setMediaList(prev =>[...prev, ...fetchedItems])
              } else{
                setMediaList(fetchedItems)
              }
              setNextPageUrl(data.next)
            }
          } catch (error){
            console.error('error loading list:', error)
          } finally {
            setIsLoading(false)
            setIsFetchingMore(false)
          }
        }, [authFetch, activeFilter, sortOrder])


    useEffect(() => {
      if (token) {
        fetchMyList()
      }
    }, [token, fetchMyList])

    const handleLoadMore = () => {
      if(nextPageUrl){
        fetchMyList(nextPageUrl, true)
      }
    }


  const handleUpdateMedia = async (id, newStatus, newScore) => {
  try {
    const response = await authFetch(
      `/api/media/update/${id}/`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          score: newScore,
        }),
      }
    )

    if (response.ok) {
      fetchMyList()
    } else {
      showToast('Помилка оновлення', 'error')
    }
  } catch (error) {
    showToast("Помилка з'єднання", 'error')
  }
}

  const handleDeleteMedia = async (id) => {
    const itemToDelete = mediaList.find(i => i.id === id)
    const isSeries = itemToDelete?.media_item?.media_type === "series"
    const typeText = isSeries ? 'Серіал' : 'Фільм'
    if (!window.confirm(`Дійсно видалити цей ${typeText.toLowerCase()} зі списку?`)) return;

    try {
      const response = await authFetch(`/api/media/delete/${id}/`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchMyList();
        showToast(`${typeText} видалено`, 'info');
      } else {
        showToast('Помилка видалення', 'error');
      }
    } catch (error) {
      showToast('Помилка з\'єднання', 'error');
    }
  }

  return (
        <div className="home-wrapper">
            <div className="app-container" style={{ position: 'relative', zIndex: 1, paddingTop: '30px', paddingBottom: '50px' }}>

                {/* === БЛОК ПОШУКУ === */}
                <div style={{ position: 'relative', marginBottom: '40px' }}>
                    <input 
                        type="text" 
                        className="search-input-glass"
                        placeholder="Пошук фільмів та серіалів..." 
                        value={searchQuery} 
                        onChange={(e) => setSearchQuery(e.target.value)} 
                        onFocus={() => { if(searchResults.length > 0) setShowDropdown(true) }}
                        disabled={isLoading && mediaList.length === 0}
                        style={{ paddingRight: '45px', width: '100%' }} 
                    />

                    {searchQuery && (
                        <span 
                            onClick={() => { setSearchQuery(''); setSearchResults([]); setShowDropdown(false); }}
                            className="search-clear-btn"
                            title="Очистити пошук"
                        >✖</span>
                    )}

                    {showDropdown && searchResults.length > 0 && (
                        <div className="search-dropdown glass-dropdown">
                            {searchResults.map(item => (
                                <div key={item.imdbID} className="search-item" onClick={() => handleSelectAndAdd(item.Title, item.Type, item.imdbID)}>
                                    <img 
                                        src={getPosterUrl(item.Poster)} 
                                        alt="poster" 
                                        onError={(e) => {e.target.onerror = null; e.target.src = 'https://placehold.co/40x60?text=No+Poster'}}
                                        style={{ width: '40px', height: '60px', objectFit: 'cover', borderRadius: '4px', marginRight: '16px' }} 
                                    />
                                    <div>
                                        <strong style={{ display: 'block', fontSize: '1.1rem' }}>{item.Title} ({item.Year})</strong>
                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                            {item.Type === 'series' ? '📺 Серіал' : '🎬 Фільм'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

               {/* === ПАНЕЛЬ ФІЛЬТРІВ ТА СОРТУВАННЯ === */}
                <div className="filters-sort-row">
                    {[
                        { id: 'all', label: 'Усі' },
                        { id: 'movies', label: 'Фільми' },
                        { id: 'series', label: 'Серіали' },
                        { id: 'completed', label: 'Переглянуто' },
                        { id: 'in_progress', label: 'Переглядаю' },
                        { id: 'planned', label: 'Заплановано' },
                        { id: 'dropped', label: 'Покинуто' },
                    ].map(filter => (
                        <button
                            key={filter.id}
                            onClick={() => setActiveFilter(filter.id)} // Просто міняємо стейт, useEffect зробить решту
                            className={`filter-chip ${activeFilter === filter.id ? 'active' : ''}`}
                        >
                            {filter.label}
                        </button>
                    ))}

                    <select 
                        className="status-select top-sort-select"
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)} // Просто міняємо стейт
                    >
                        <option value="default">За датою додавання</option>
                        <option value="title_asc">За алфавітом (А-Я)</option>
                        <option value="title_desc">За алфавітом (Я-А)</option>
                        <option value="year_desc">Спочатку нові (за роком)</option>
                        <option value="year_asc">Спочатку старі (за роком)</option>
                        <option value="score_desc">Найвища оцінка</option>
                        <option value="score_asc">Найнижча оцінка</option>
                    </select>
                </div>
                
                {/* === СІТКА КАРТОК === */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '24px' }}>
                    {isLoading && !isFetchingMore ? (
                        Array.from({ length: 8 }).map((_, index) => (
                            <div key={index} className="skeleton-card">
                                <div className="skeleton-pulse skeleton-poster"></div>
                                <div className="skeleton-content">
                                    <div className="skeleton-pulse skeleton-title"></div>
                                    <div className="skeleton-genres">
                                        <div className="skeleton-pulse skeleton-badge"></div>
                                        <div className="skeleton-pulse skeleton-badge"></div>
                                    </div>
                                    <div className="skeleton-pulse skeleton-button"></div>
                                </div>
                            </div>
                        ))
                    ) : mediaList.length === 0 ? (
                        <div className="empty-state-glass">
                            <p>Ваш список порожній або нічого не знайдено за фільтрами.</p>
                        </div>
                    ) : (
                        mediaList.map(item => {
                            const displayType = item.media_item?.media_type === 'series' ? '📺 Серіал' : '🎬 Фільм';
                            return (
                                <div key={item.id} className="media-card-premium glass-card">
                                    <div className="card-poster-wrapper">
                                        <img
                                            className="media-poster"
                                            src={getPosterUrl(item.media_item?.poster_url)}
                                            onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/400x600?text=No+Poster'}}
                                            alt={item.media_item?.title}
                                        />
                                        <div className="card-badge-overlay">{displayType}</div>
                                    </div>
                                    
                                    <div className="media-content">
                                        <h3 className="media-title" title={item.media_item?.title}>
                                            {item.media_item?.title || 'Невідомий тайтл'}
                                        </h3>
                                        
                                        {item.media_item?.genre && (
                                            <div className="genres-container">
                                                {item.media_item.genre.split(',').slice(0, 3).map((g, idx) => (
                                                    <span key={idx} className="genre-badge">{g.trim()}</span>
                                                ))}
                                            </div>
                                        )}
                                        
                                        <div className="card-controls">
                                            <select 
                                                value={item.status} 
                                                onChange={(e) => handleUpdateMedia(item.id, e.target.value, item.score)}
                                                className="status-select"
                                            >
                                                <option value="planned">Заплановано</option>
                                                <option value="in_progress">Переглядаю</option>
                                                <option value="completed">Переглянуто</option>
                                                <option value="dropped">Покинуто</option>
                                            </select>

                                            <div className="stars-container">
                                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                                                    <span 
                                                        key={num}
                                                        onClick={() => handleUpdateMedia(item.id, item.status, item.score === num ? null : num)}
                                                        className={`star ${item.score >= num ? 'active' : ''}`}
                                                        title={`Оцінка: ${num}/10`}
                                                    >★</span>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="actions-container">
                                            <button className="btn-details" onClick={() => navigate(`/catalog/${item.media_item.id}`)}>
                                                Деталі
                                            </button>
                                            <button className="btn-delete" onClick={() => handleDeleteMedia(item.id)} title="Видалити">
                                                ✖
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {nextPageUrl && (
                    <div style={{display: 'flex', justifyContent: 'center', textAlign: 'center', marginTop: '40px' }}>
                        <button 
                            className="btn-add-masterpiece"
                            onClick={handleLoadMore}
                            disabled={isFetchingMore}
                            style={{ width: 'max-content', padding: '12px 32px' }}
                        >
                            {isFetchingMore ? 'Завантаження...' : 'Показати ще ↓'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default UserList;