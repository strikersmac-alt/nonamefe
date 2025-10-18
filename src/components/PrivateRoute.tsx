import React from 'react'
import { useAuthStore } from '../store/authStore';
import { Outlet, Navigate } from 'react-router-dom';
export default function PrivateRoute() {
    const user = useAuthStore((state) => state.user);
  return (
    user?<Outlet/>:<Navigate to='/'/>
  )
}