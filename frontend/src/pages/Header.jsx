import { useAuth } from '../AuthContext'
import { Link, useNavigate } from 'react-router-dom'

export default function Header(){
    const navigate = useNavigate()
    const { logout } = useAuth()

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    return (
        <header className="app-header">
            
            {/* ЛІВА ЧАСТИНА: Логотип */}
            <Link to="/" className="header-logo">
                Tracker
            </Link>
            

            {/* ПРАВА ЧАСТИНА: Кнопки */}
            <div className="header-nav">

                <Link to="/list" className="btn-nav btn-nav-primary">
                    Мій список
                </Link>
                
                <Link to="/profile" className="btn-nav btn-nav-primary">
                    Профіль
                </Link>

                <button onClick={handleLogout} className="btn-nav btn-nav-primary">
                    Вихід
                </button>

            </div>
        </header>
    )
}