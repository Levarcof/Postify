import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import './App.css'
import Registration from './pages/Register'
import Login from './pages/Login'
import MainLayout from './components/MainLayout'
import Feed from './pages/Feed'
import Profile from './pages/Profile'
import UserProfile from './pages/UserProfile'
import SearchPage from './pages/SearchPage'
import Conversation from './pages/Conversation'
import Settings from './pages/Settings'
import Notifications from './components/Notifications'

function App() {
  const router = createBrowserRouter([
    {
      path: '/',
      element: <MainLayout />,
      children: [
        {
          index: true,
          element: <Feed />
        },
        {
          path: 'profile',
          element: <Profile />
        },
        {
          path: 'search',
          element: <SearchPage />
        },
        {
          path: 'user/:userName',
          element: <UserProfile />
        },
        {
          path: 'messages',
          element: <Conversation />
        },
        {
          path: 'conversation/:conversationId',
          element: <Conversation />
        },
        {
          path: 'settings',
          element: <Settings />
        },
        {
          path: 'notifications',
          element: <Notifications />
        }
      ]
    },
    {
      path: '/register',
      element: <Registration />
    },
    {
      path: '/login',
      element: <Login />
    }
  ])

  return (
    <RouterProvider router={router} />
  )
}

export default App
