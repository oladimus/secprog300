import React, { useMemo } from 'react'
import { Outlet } from 'react-router-dom'

import { Navigation } from '@toolpad/core';
import { Dashboard as DashboardIcon, People } from '@mui/icons-material'
import { useNavigate } from "react-router-dom"
import { useSession } from './components/RouteProtected';

const NAVIGATION: Navigation = [
  {
    kind: 'header',
    title: 'Main items',
  },
  {
    title: 'Dashboard',
    icon: <DashboardIcon />,
  },
  {
    segment: 'friends',
    title: 'Friends',
    icon: <People />,
  },
];

const BRANDING = {
  title: 'My Toolpad Core App',
};

import { CssBaseline } from "@mui/material"
import { ReactRouterAppProvider } from '@toolpad/core/react-router';
import { API_URL } from './constants';


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
        method: 'GET',
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
