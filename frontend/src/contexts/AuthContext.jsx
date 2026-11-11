import React, { createContext, useContext, useState} from "react";

const AuthContext = createContext();

export const AuthProvider = ({children}) => {
    const [token, setToken] = useState(localStorage.getItem('access'))
    const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem('refresh'))


    const login = (access, refresh) => {
        setToken(access)
        setRefreshToken(refresh)
        localStorage.setItem('access', access)
        localStorage.setItem('refresh', refresh)
        
    }

    const logout = () => {
        localStorage.removeItem('access')
        localStorage.removeItem('refresh')
        setToken(null)
        setRefreshToken(null)
    };

    const isAuthenticated = Boolean(token)

    const authFetch = async(url, options = {}) => {
        let currentToken = token;

        const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

        const fullURL = url.startsWith('http') ? url : `${API_URL}${url}`

        let response = await fetch(fullURL, {
            ...options,
            headers: {
                ...options.headers,
                'Authorization': `Bearer ${currentToken}`
            }
        })

        if (response.status === 401 && refreshToken){
            try{
                const refreshRes = await fetch(`${API_URL}/api/token/refresh/`, {
                    method: 'POST',
                    headers: {
                        'Content-type': 'application/json'

                    },
                    body: JSON.stringify({refresh: refreshToken})
                })

                if (refreshRes.ok){
                    const data = await refreshRes.json()

                    setToken(data.access)
                    localStorage.setItem('access', data.access)
                    currentToken = data.access

                    response = await fetch(fullURL, {
                        ...options, 
                        headers: {
                            ...options.headers,
                            'Authorization': `Bearer ${currentToken}`
                        }
                    })
                } else {
                    logout()
                    window.location.href = '/login'
                }
            } catch (error) {
                logout()
                window.location.href = '/login'
            }
        }
        return response
    }

    return (
        <AuthContext.Provider value={{token, isAuthenticated, login, logout, authFetch}}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    return useContext(AuthContext)
}