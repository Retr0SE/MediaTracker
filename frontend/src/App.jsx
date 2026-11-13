import { useAuth } from './contexts/AuthContext'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import MediaDetailsPage from './pages/MediaDetailsPage'
import MyListPage from './pages/MyListPage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ProfilePage from './pages/ProfilePage'
import FriendsListPage from './pages/FriendsListPage'
import FriendProfilePage from './pages/FriendProfilePage'

import Header from './components/Header'
import LandingPage from './pages/LandingPage'
import NotFoundPage from './pages/NotFoundPage'

function App() {

  const {isAuthenticated} = useAuth()
  const location = useLocation()

  const isAuthPath = location.pathname === "/login" || location.pathname === "/register"

  const showHeader = isAuthenticated || isAuthPath

  return (
    <>
      {showHeader && <Header isSimple={isAuthPath}/>}

      <Routes>
        <Route path='/login' element={!isAuthenticated ? <LoginPage/> : <Navigate to='/my-list' replace />} />
        <Route path='/register' element={!isAuthenticated ? <RegisterPage /> : <Navigate to='/my-list' replace />} />

        <Route path='/' element={!isAuthenticated ? <LandingPage/> : <Navigate to='/my-list' replace />} />
        <Route path='/my-list' element={isAuthenticated ? <MyListPage/> : <Navigate to='/' replace />} />
        <Route path='/friends' element={isAuthenticated ? <FriendsListPage/> : <Navigate to='/' replace />} />
        <Route path='/catalog/:id' element={isAuthenticated ? <MediaDetailsPage/> : <Navigate to='/' replace />} />
        <Route path='/profile' element={isAuthenticated ? <ProfilePage/> : <Navigate to='/' replace />} />
        <Route path='/users/:id' element={isAuthenticated ? <FriendProfilePage/> : <Navigate to='/' replace />} />

        <Route path='*' element={<NotFoundPage />}/>
      </Routes>
    </>
  ) 
}

export default App