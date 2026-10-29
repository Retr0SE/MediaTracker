import { useAuth } from './AuthContext'
import { Routes, Route, Navigate } from 'react-router-dom'
import MediaDetails from './pages/MediaDetails'
import Home from './pages/Home'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Profile from './pages/Profile'
import Header from './pages/Header'
import Landing from './pages/Landing'
import NotFound from './pages/NotFound'

function App() {

  const {isAuthenticated} = useAuth()

  return (
    <>
      {isAuthenticated && <Header/>}

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