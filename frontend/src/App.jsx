import { useAuth } from './AuthContext'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import MediaDetails from './pages/MediaDetails'
import UserList from './pages/UserList'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Profile from './pages/Profile'
import FriendProfile from './pages/FriendProfile'
import Header from './components/Header'
import Landing from './pages/Landing'
import FriendsList from './pages/FriendsList'
import NotFound from './pages/NotFound'

function App() {

  const {isAuthenticated} = useAuth()
  const location = useLocation()

  const isAuthPath = location.pathname === "/login" || location.pathname === "/register"

  const showHeader = isAuthenticated || isAuthPath

  return (
    <>
      {showHeader && <Header isSimple={isAuthPath}/>}

      <Routes>
        <Route path='/login' element={!isAuthenticated ? <Login/> : <Navigate to='/list' replace />} />
        <Route path='/register' element={!isAuthenticated ? <Register /> : <Navigate to='/list' replace />} />

        <Route path='/' element={!isAuthenticated ? <Landing/> : <Navigate to='/list' replace />} />
        <Route path='/list' element={isAuthenticated ? <UserList/> : <Navigate to='/' replace />} />
        <Route path='/friends' element={isAuthenticated ? <FriendsList/> : <Navigate to='/' replace />} />
        <Route path='/catalog/:id' element={isAuthenticated ? <MediaDetails/> : <Navigate to='/' replace />} />
        <Route path='/profile' element={isAuthenticated ? <Profile/> : <Navigate to='/' replace />} />
        <Route path='/user/:id' element={isAuthenticated ? <FriendProfile/> : <Navigate to='/' replace />} />

        <Route path='*' element={<NotFound />}/>
      </Routes>
    </>
  ) 
}

export default App