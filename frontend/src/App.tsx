import React, { useMemo } from 'react'
import { Outlet } from 'react-router-dom'

import { Navigation } from '@toolpad/core';
import { Chat, People, Settings } from '@mui/icons-material'
import { useNavigate } from "react-router-dom"
import { useSession } from './components/RouteProtected';

const NAVIGATION: Navigation = [
  {
    kind: 'header',
    title: 'Main items',
  },
  {
    segment: 'chat',
    title: 'Chat',
    icon: <Chat />,
  },
  {
    segment: 'friends',
    title: 'Friends',
    icon: <People />,
  },
  {
    segment: 'settings',
    title: 'Settings',
    icon: <Settings />
  }
];

const BRANDING = {
  title: 'E2EE Messager',
};

import { CssBaseline } from "@mui/material"
import { ReactRouterAppProvider } from '@toolpad/core/react-router';
import { API_URL } from './constants';
import { getCsrfToken } from './utils';


const App: React.FC = () => {
  const navigate = useNavigate()
  const session = useSession()



  const authentication = useMemo(() => {
    return {
      signIn: () => {
      },
      signOut: () => {
        handleLogout()
      },
    };
  }, []);


  const handleLogout = async () => {
    try {
      const res = await fetch(API_URL + "/api/user/logout/", {
        method: 'POST',
        headers: {"X-CSRFToken" : getCsrfToken()},
        credentials: 'include',
      })
      if (res.status == 200) {
        navigate("/authenticate/login")
      } else {
        console.error("Logout failed")
      }
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <ReactRouterAppProvider
      navigation={NAVIGATION}
      branding={BRANDING}
      session={session}
      authentication={authentication}
    >
      <CssBaseline />
      <Outlet />
    </ReactRouterAppProvider>
  )
}

export default App
