import React, { useState } from 'react';
import axios from 'axios';
import config from '../config';
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      console.log("URL value is ",`${config.apiBaseUrl}`)
      const response = await axios.post(`${config.apiBaseUrl}/api/login`, { email, password });
      localStorage.setItem('token', response.data.token); // Store the token
      setMessage('Login successful');
    } catch (error) {
      setMessage(error.response ? error.response.data.message : 'Error logging in');
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default Login;
