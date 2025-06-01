// frontend/src/Register.js

import React, { useState } from 'react';
import axios from 'axios';
import config from '../config';
const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();

    // Prepare data for registration
    const userData = {
      email,
      password,
    };

    try {
      // Send POST request to the backend API to register the user
      const response = await axios.post(`${config.apiBaseUrl}/api/users/register`, userData);
      setMessage(response.data.message); // Display success message
    } catch (error) {
      // Display error message if registration fails
      setMessage(error.response ? error.response.data.message : 'Error registering');
    }
  };

  return (
    <div>
      <h2>Register</h2>
      <form onSubmit={handleRegister}>
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
        <button type="submit">Register</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default Register;
