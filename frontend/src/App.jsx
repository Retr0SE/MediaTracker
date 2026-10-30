import { useAuth } from './AuthContext'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import MediaDetails from './pages/MediaDetails'
import Home from './pages/Home'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Profile from './pages/Profile'
import Header from './components/Header'
import Landing from './pages/Landing'
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
        <Route path='/list' element={isAuthenticated ? <Home/> : <Navigate to='/login' replace />} />
        <Route path='/media/:id' element={isAuthenticated ? <MediaDetails/> : <Navigate to='/login' replace />} />
        <Route path='/profile' element={isAuthenticated ? <Profile/> : <Navigate to='/login' replace />} />

        <Route path='*' element={<NotFound />}/>
      </Routes>
    </>
  ) 
}

export default App