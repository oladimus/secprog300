import React from 'react'
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import RouteProtected from './components/RouteProtected'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import NotFound from './pages/NotFound'
import Logout from './components/Logout'





function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <RouteProtected>
              <Home />
            </RouteProtected>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={
          <Logout route="/register">
            <Register />
          </Logout>
        }
        />
        <Route path="/logout" element={<Logout route="/login" />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
