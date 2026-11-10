import { useAuth } from '../AuthContext'
import { Link, replace, useNavigate, useLocation } from 'react-router-dom'
import { useToast } from '../ToastContext'
import { useState } from 'react'

export default function Header({ isSimple = false}){
    const { logout } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const { showToast } = useToast()

    const [isMenuOpen, setIsMenuOpen] = useState(false)

    const handleLogout = () => {
        logout()
        showToast('Ви вийшли з системи.', 'info')
        navigate("/", {replace: true})   
    }

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen)
    const closeMenu = () => setIsMenuOpen(false)
     
    const isActive = (path) => {
        return location.pathname.startsWith(path)
    }

return (
        <header className="app-header">
            
            <Link to="/" className="header-logo" onClick={closeMenu}>
                <span className="header-logo-text">KINEMIO</span>
            </Link>
            
            {!isSimple && (
                <>
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
                            className={`btn-nav ${isActive('/profile') ? 'active-link' : ''}`}
                            onClick={closeMenu}
                        >
                            Профіль
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