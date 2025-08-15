import React from 'react'
import { useAuth } from '../context/AuthContext.jsx';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({children}) => {
    const { session } = useAuth();
  return <>{session ? <>{children}</> : <Navigate to="/signup" />}</>;
};

export default PrivateRoute