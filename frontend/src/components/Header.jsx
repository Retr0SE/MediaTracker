import { useAuth } from '../AuthContext'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useToast } from '../ToastContext'
import { useState, useEffect } from 'react'
import { API_BASE_URL } from '../config'

export default function Header({ isSimple = false}){
    const { authFetch, logout, token } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const { showToast } = useToast()

    const [isMenuOpen, setIsMenuOpen] = useState(false)

    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [showDropdown, setShowDropdown] = useState(false)
    const [isSearching, setIsSearching] = useState(false)

    const handleLogout = () => {
        logout()
        showToast('Ви вийшли з системи.', 'info')
        navigate("/", {replace: true})   
    }

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen)
    const closeMenu = () => {
        setIsMenuOpen(false)
        setShowDropdown(false)
    }
     
    const isActive = (path) => {
        return location.pathname.startsWith(path)
    }

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
            if(searchQuery.trim().length >= 3) {
                setIsSearching(true)
                try{
                    const response = await authFetch(`/api/media/search/?q=${searchQuery}`)
                    if(response.ok){
                        const data = await response.json()
                        setSearchResults(data)
                        setShowDropdown(true)
                    }
                } catch (error){
                    console.error("Помилка пошуку", error)
                } finally {
                    setIsSearching(false)
                }
            } else {
                setSearchResults([])
                setShowDropdown(false)
            }
        }, 250)
        return () => clearTimeout(delayDebounceFn)
    }, [searchQuery, authFetch])

    useEffect(() => {
        const handleClickOutside = (event) => {
            if(!event.target.closest('.header-search-wrapper')){
                setShowDropdown(false)
            }
        }
        document.addEventListener('click', handleClickOutside)
        return () => document.removeEventListener('click', handleClickOutside)
    }, [])

    const handleSelectAndAdd = async (title, type, imdbID ) => {
        setShowDropdown(false)
        setSearchQuery('')
        closeMenu()

        try{
            const response = await authFetch('/api/media/add/', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ title, media_type: type === 'series' ? 'series' : 'movie', imdb_id: imdbID})
            })
            if (response.ok){
                showToast('Тайтл успішно додано до вашого списку!', 'success')
                if(location.pathname === '/list' || location.pathname === '/'){
                    window.dispatchEvent(new Event('mediaAdded'))
                }
            } else if(response.status === 200){
                showToast('Цей тайтл вже є у вашому списку.', 'error')
            } else {
                showToast('Сталася помилка при додаванні.', 'error')
            }
        } catch (error){
            showToast('Помилка з\'єднання з сервером', 'error')
        }
    }
return (
        <header className="app-header">
            
            <Link to="/" className="header-logo" onClick={closeMenu}>
                <span className="header-logo-text">KINEMIO</span>
            </Link>
            
            {!isSimple && token && (
                <>
                    <div className="header-search-wrapper">
                        <input 
                            type="text" 
                            className="search-input-glass header-search-input"
                            placeholder="Знайти фільм..." 
                            value={searchQuery} 
                            onChange={(e) => setSearchQuery(e.target.value)} 
                            onFocus={() => { if(searchResults.length > 0) setShowDropdown(true) }}
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
                                            className="search-item-poster"
                                        />
                                        <div>
                                            <strong className="search-item-title">{item.Title} ({item.Year})</strong>
                                            <span className="search-item-type">
                                                {item.Type === 'series' ? '📺 Серіал' : '🎬 Фільм'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <button className={`burger-btn ${isMenuOpen ? 'open' : ''}`} onClick={toggleMenu}>
                        <span className="burger-line"></span>
                        <span className="burger-line"></span>
                        <span className="burger-line"></span>
                    </button>

                    <nav className={`header-nav ${isMenuOpen ? 'mobile-open' : ''}`}>
                        <Link 
                            to="/list" 
                            className={`btn-nav ${isActive('/list') || isActive('/catalog') ? 'active-link' : ''}`}
                            onClick={closeMenu}
                        >
                            Мій список
                        </Link>
                        
                        <Link 
                            to="/friends" 
                            className={`btn-nav ${isActive('/friends') || isActive('/user') ? 'active-link' : ''}`}
                            onClick={closeMenu}
                        >
                            Друзі
                        </Link>
                        
                        <Link 
                            to="/profile" 
                            className={`btn-nav profile-icon-link ${isActive('/profile') ? 'active-link' : ''}`}
                            onClick={closeMenu}
                            title="Мій профіль"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            <span className="profile-text-mobile">Профіль</span>
                        </Link>

                        <button onClick={handleLogout} className="btn-nav btn-logout">
                            Вихід
                        </button>
                    </nav>
                </>
            )}
        </header>
    );
}