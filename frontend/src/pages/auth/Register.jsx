import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../AuthContext'

function Register(){
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const {login} = useAuth()
    const [toast, setToast] = useState(null); 
    const navigate = useNavigate()

    const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

    const showToast = (text, type = 'success') => {
        setToast({ text, type })
        setTimeout(() => {
            setToast(null)
        }, 3500)
    }

    const handleRegister = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        setToast(null)

        try{
            const response = await fetch(`${API_URL}/api/users/register/`, {
                method: 'POST',
                headers:{
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({username, email, password})
            })

            const data = await response.json()

            if (!response.ok){
                if (response.status === 400) {
                let errorMessage = 'Помилка перевірки даних';
                
                // Аналізуємо, в якому полі сталася помилка, і перекладаємо
                if (data.username) {
                    errorMessage = data.username[0].includes('exists') 
                        ? 'Користувач з таким логіном вже існує' 
                        : 'Недопустимі символи в логіні';
                } else if (data.email) {
                    errorMessage = data.email[0].includes('exists') 
                        ? 'Цей email вже зареєстровано' 
                        : 'Некоректний формат email';
                } else if (data.password) {
                    errorMessage = 'Пароль надто короткий або поширений';
                } else if (data.error) {
                    errorMessage = data.error; 
                } else if (data.detail) {
                    errorMessage = 'Помилка доступу. Перевірте дані';
                }
                
                
                showToast(errorMessage, 'error')
            } else if (response.status === 429) {
                showToast('Забагато спроб. Зачекайте хвилину', 'error')
            } else if (response.status >= 500) {
                showToast('Помилка сервера. Спробуйте пізніше', 'error')
            } else {
                showToast('Не вдалося створити акаунт', 'error')
            }
            return
        }
        
            const loginResponse = await fetch(`${API_URL}/api/token/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({username, password})
            })
            const loginData = await loginResponse.json()

            if (loginResponse.ok) {
                login(loginData.access, loginData.refresh)
                navigate('/')
            } else {
                showToast('Акаунт створено. Будь ласка, увійдіть вручну.', 'success')
                navigate('/login')
            }

        } catch (error) {
            showToast("Сервер недоступний. Перевірте з'єднання", 'error')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="auth-wrapper">
            <div className="auth-card">
                
                <div className="auth-header">
                    <h2 className="auth-title">Реєстрація</h2>
                </div>

                <form onSubmit={handleRegister} className="auth-form">
                    
                    <div className="input-group">
                        <label>Ім'я користувача</label>
                        <input
                            type="text"
                            className="auth-input"
                            placeholder="Придумайте нікнейм"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label>Email <span style={{opacity: 0.5, fontSize: '0.8rem'}}>(необов'язково)</span></label>
                        <input
                            type="email"
                            className="auth-input"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="input-group">
                        <label>Пароль</label>
                        <input
                            type="password"
                            className="auth-input"
                            placeholder="Створіть надійний пароль"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="auth-submit-btn" disabled={isLoading}>
                        {isLoading ? 'Створення...' : 'Створити акаунт'}
                    </button>
                </form>

                <div className="auth-footer">
                    Вже маєте акаунт? <Link to="/login">Увійти</Link>
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

export default Register