import { useAuth } from '../AuthContext'
import { Link, replace, useNavigate } from 'react-router-dom'

export default function Header({ isSimple = false}){
    const { logout } = useAuth()
    const { navigate } = useNavigate()

    const handleLogout = () => {
        logout()
        navigate("/", {replace: true})   
    }

    return (
        <header className="app-header">
            
            {/* ЛІВА ЧАСТИНА: Логотип */}
            <Link to="/" className="header-logo">
                MediaTracker
            </Link>
            

            {/* ПРАВА ЧАСТИНА: Кнопки */}
            {!isSimple && (
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
            )}
        </header>
    )
}