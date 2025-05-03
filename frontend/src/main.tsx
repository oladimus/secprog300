
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import React from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router';
import RouteProtected from './components/RouteProtected.tsx';
import Login from './pages/Login.tsx';
import Register from './pages/Register.tsx';
import FriendlistManager from './components/FriendListManager.tsx';
import ChatApp from './components/ChatApp.tsx';
import ChatLayout from './layouts/ChatLayout.tsx';
import DefaultLayout from './layouts/DefaultLayout.tsx';
import { Settings } from './pages/Settings.tsx';

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
        children: [
          {
            path: '',
            Component: ChatLayout,
            children: [
              {
                path: 'chat',
                element: (
                  <RouteProtected>
                    <ChatApp />
                  </RouteProtected>
                ),
              }
            ]
          },
          {
            path: 'friends',
            Component: DefaultLayout,
            children: [
              {
                path: '',
                element: (
                  <RouteProtected>
                    <FriendlistManager />
                  </RouteProtected>
                ),
              }
            ]
          },
          {
            path: 'settings',
            Component: DefaultLayout,
            children: [
              {
                path: '',
                element: (
                  <RouteProtected>
                    <Settings />
                  </RouteProtected>
                )
              }
            ]
          }

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
