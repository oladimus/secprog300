
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import React from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router';
import Layout from './layouts/dashboard.tsx';
import RouteProtected from './components/RouteProtected.tsx';
import Login from './pages/Login.tsx';
import Register from './pages/Register.tsx';
import FriendlistManager from './components/FriendListManager.tsx';

const router = createBrowserRouter([
  {
    element: (
      <RouteProtected>
        <App />
      </RouteProtected>
    ),
    children: [
      {
        path: '/',
        Component: App,
        children: [
          {
            path: '',
            Component: Layout,
            children: [
              {
                path: 'friends',
                Component: FriendlistManager
              }
            ]
          },
        ]
      }
    ]
  },
  {
    path: '/authenticate',
    Component: App,
    children: [
      {
        path: 'login',
        element: <Login />,
      },
      {
        path: 'register',
        element: <Register />
      }
    ]
  }
]);

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
