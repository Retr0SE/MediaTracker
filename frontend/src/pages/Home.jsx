import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'

function Home(){
  const [mediaList, setMediaList] = useState([])
  const {token, authFetch} = useAuth()


  const [isLoading, setIsLoading] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)

  const [toast, setToast] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all')

  const [sortOrder, setSortOrder] = useState('default')

  const [visibleCount, setVisibleCount] = useState(12)

  const navigate = useNavigate()
  
  const showToast = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // === ЖИВИЙ ПОШУК ===
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

  // === ДОДАВАННЯ З ПОШУКУ ===
  const handleSelectAndAdd = async (title, type) => {
    setShowDropdown(false)
    setSearchQuery('')
    setIsLoading(true)

    try {
      const response = await authFetch('/api/media/add/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: title, media_type: type === 'series' ? 'series' : 'movie' })
      })

      const data = await response.json()
      if (response.ok) {
        showToast(`✅ ${data.message}`, 'success')
        fetchMyList() 
      } else {
        showToast(`❌ ${data.error || 'Помилка'}`, 'error')
      }
    } catch (error) {
      showToast('❌ Помилка з\'єднання', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  // === РОБОТА ЗІ СПИСКОМ ===
  const fetchMyList = useCallback( async () => {
    setIsLoading(true)
    try {
      const response = await authFetch('/api/media/my-list/')
      if (response.ok) {
          const data = await response.json()
          setMediaList(data)
      }
    } catch (error) {
      console.error('Помилка завантаження списку:', error)
    } finally {
      setIsLoading(false)
    }
  }, [authFetch])

  useEffect(() => {
    if (token) {
      fetchMyList()
    }
  }, [token, fetchMyList])

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
        showToast(`${typeText} видалено`, 'success');
      } else {
        showToast('❌ Помилка видалення', 'error');
      }
    } catch (error) {
      showToast('❌ Помилка з\'єднання', 'error');
    }
  }

  const safeMediaList = Array.isArray(mediaList) ? mediaList : []

  const filteredList = safeMediaList.filter(item => {
    if (activeFilter === 'all') return true
  
    if (activeFilter === 'movies') return item.media_item?.media_type === 'movie'
    if (activeFilter === 'series') return item.media_item?.media_type === 'series'
    
    if (activeFilter === 'completed') return item.status === 'completed'
    if (activeFilter === 'in_progress') return item.status === 'in_progress'
    if (activeFilter === 'planned') return item.status === 'planned'
    if (activeFilter === 'dropped') return item.status === 'dropped'

    return true

  })

  const sortedList = [...filteredList].sort((a, b) => {

    if (sortOrder === "default"){
      return b.id - a.id
    }
    if (sortOrder === 'title_asc'){
      return (a.media_item?.title || "").localeCompare(b.media_item?.title || "")
    }

    if (sortOrder === 'title_desc'){
      return (b.media_item?.title || "").localeCompare(a.media_item?.title || "")
    }

    if (sortOrder === "score_desc"){
      return (b.score || 0)-(a.score || 0)
    }
    if (sortOrder === "score_asc"){
      return (a.score || 0)-(b.score || 0)
    }

    if (sortOrder === "year_asc"){
      const yearA = parseInt(a.media_item?.release_year) || 0
      const yearB = parseInt(b.media_item?.release_year) || 0
      return yearA - yearB
    } 

    if (sortOrder === "year_desc"){
      const yearA = parseInt(a.media_item?.release_year) || 0
      const yearB = parseInt(b.media_item?.release_year) || 0
      return yearB - yearA
    } 
    return 0
  })
  
 // === РЕНДЕР ОСНОВНОГО ДОДАТКУ ===
  return (
    <div className="home-wrapper">
      {/* Додаємо position: relative та zIndex: 1, щоб контент був над фоновими плямами */}
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
            disabled={isLoading}
            style={{ paddingRight: '45px', width: '100%' }} 
          />

          {searchQuery && (
            <span 
              onClick={() => {
                setSearchQuery('');
                setSearchResults([]);
                setShowDropdown(false);
              }}
              style={{
                position: 'absolute',
                right: '15px',
                top: '50%',
                transform: 'translateY(-50%)',
                cursor: 'pointer',
                fontSize: '1.2rem',
                color: 'var(--text-muted)',
                padding: '5px'
              }}
              title="Очистити пошук"
            >
              ✖
            </span>
          )}

          {/* Випадаючий список пошуку */}
          {showDropdown && searchResults.length > 0 && (
            <div className="search-dropdown glass-dropdown">
              {searchResults.map(item => (
                <div 
                  key={item.imdbID}
                  className="search-item"
                  onClick={() => handleSelectAndAdd(item.Title, item.Type)}>
                  <img 
                    src={item.Poster !== 'N/A' ? item.Poster : 'https://placehold.co/40x60?text=No+Img'} 
                    alt="poster" 
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
              onClick={() => {
                setActiveFilter(filter.id);
                setVisibleCount(12);
              }}
              className={`filter-chip ${activeFilter === filter.id ? 'active' : ''}`}
            >
              {filter.label}
            </button>
          ))}

          {/* Використовуємо дизайн status-select (як в картках) */}
          <select 
            className="status-select top-sort-select"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
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
          
          
          {isLoading && mediaList.length === 0 ? (
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
          ) : sortedList.length === 0 ? (
            <div className="empty-state-glass">
              <p>Ваш список порожній. Знайдіть свій перший тайтл вище!</p>
            </div>
          ) : (
            sortedList.slice(0, visibleCount).map(item => {
              const displayType = item.media_item?.media_type === 'series' ? '📺 Серіал' : '🎬 Фільм';
              return (
                <div key={item.id} className="media-card-premium glass-card">
                  
                  {/* Обгортка для постера з бейджем */}
                  <div className="card-poster-wrapper">
                    <img
                      className="media-poster"
                      src={
                        item.media_item?.poster_url && item.media_item.poster_url !== 'N/A'
                          ? item.media_item.poster_url
                          : 'https://placehold.co/400x600?text=No+Poster'
                      }
                      alt={item.media_item?.title || 'Постер'}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'https://placehold.co/400x600?text=No+Poster';
                      }}
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
                          <span key={idx} className="genre-badge">
                            {g.trim()}
                          </span>
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
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="actions-container">
                      <button 
                        className="btn-details"
                        onClick={() => navigate(`/media/${item.id}`)}
                      >
                        Деталі
                      </button>
                      
                      <button 
                        className="btn-delete"
                        onClick={() => handleDeleteMedia(item.id)}
                        title="Видалити"
                      >
                        ✖
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {filteredList.length > visibleCount && (
          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <button 
              className="btn-load-more glass-card"
              onClick={() => setVisibleCount(prev => prev + 12)}
            >
              Показати ще 
            </button>
          </div>
        )}

        {/* ГЛОБАЛЬНИЙ РЕНДЕР TOAST */}
        {toast && (
          <div className="toast-container">
            <div className={`toast ${toast.type}`}>
              {toast.text}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Home