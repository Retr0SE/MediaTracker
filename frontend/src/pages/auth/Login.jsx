import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../AuthContext'

function Login(){
    const [ username, setUsername] = useState('')
    const [ password, setPassword] = useState('')
    const [ isLoading, setIsLoading] = useState(false)

    const [toast, setToast] = useState(null); 

    const navigate = useNavigate()
    const {login} = useAuth()

    const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

    const showToast = (text, type = 'success') => {
        setToast({ text, type })
        setTimeout(() => {
            setToast(null)
        }, 3500)
    }

    const handleLogin = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        setToast(null)

        try{
            const response = await fetch(`${API_URL}/api/token/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({username, password})
            })
            
            const data = await response.json()

            if (response.ok) {
                login(data.access, data.refresh)
                navigate('/')
            } else {
                if (response === 401){
                    showToast('Неправильний логін або пароль', 'error')
                }
                else if (response === 400){
                    const errorMsg = data.detail || data.non_field_errors?.[0] || "Помилка валідації даних"
                    showToast(errorMsg, 'error')
                }
                else if (response === 429){
                    showToast('Забагато спроб входу. Зачекайте хвилинку', 'error')
                }
                else if (response === 500){
                    showToast('Проблеми на сервері. Спробуйте пізніше', 'error')
                }
                else{
                    showToast(data.detail || "Щось пішло не так", "error")
                }
            }
        } catch (error) {
            console.error("Помилка авторизації:", error)
            showToast("Сервер недоступний. Перевірте з'єднання", 'error')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="auth-wrapper">
            <div className="auth-card">
                
                <div className="auth-header">
                    <h2 className="auth-title">Авторизація</h2>
                </div>

                <form onSubmit={handleLogin} className="auth-form">
                    
                    <div className="input-group">
                        <label>Ім'я користувача</label>
                        <input
                            type="text"
                            className="auth-input"
                            value={username}
                            placeholder="Введіть логін"
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    
                    <div className="input-group">
                        <label>Пароль</label>
                        <input 
                            type="password"
                            className="auth-input"
                            value={password}
                            placeholder="Введіть пароль"
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    
                    <button type="submit" className="auth-submit-btn" disabled={isLoading}>
                        {isLoading ? 'Перевірка даних...' : 'Увійти в акаунт'}
                    </button>
                </form>

                <div className="auth-footer">
                    Немає акаунту? <Link to="/register">Зареєструватися</Link>
                </div>
            </div>
            
            {toast && (
                <div className="toast-container">
                    <div className={`toast ${toast.type}`}>
                        {toast.text}
                    </div>
                </div>
            )}
        </div>
    )
}

export default Login