// src/components/LogoutThankYou.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const LogoutThankYou = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Clear auth data
    localStorage.removeItem('currentUser');
    // You can also clear other auth-related keys if needed

    const timer = setTimeout(() => {
      navigate('/');
    }, 3000);

    return () => clearTimeout(timer); // Cleanup on unmount
  }, [navigate]);

  return (
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <h1>Thanks for using FlatBuddy!</h1>
      <p>Logging you out and redirecting to home...</p>
    </div>
  );
};

export default LogoutThankYou;
