import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) navigate('/dashboard', { replace: true });
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('/login', { email, password });
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/dashboard', { replace: true });
    } catch (err) {
      alert('Invalid Login');
    }
  };

  return (
    <div
      className="d-flex justify-content-center align-items-center"
      style={{
        minHeight: '100vh',
        backgroundColor: '#121212', // Dark background
      }}
    >
      <div
        className="card p-4 shadow"
        style={{
          maxWidth: '400px',
          width: '100%',
          backgroundColor: '#1E1E1E', // Dark card
          color: '#f1f1f1',           // Light text
          border: '1px solid #333',
        }}
      >
        <h3 className="text-center mb-4">Login</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                backgroundColor: '#2C2C2C',
                color: '#f1f1f1',
                border: '1px solid #444',
              }}
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                backgroundColor: '#2C2C2C',
                color: '#f1f1f1',
                border: '1px solid #444',
              }}
            />
          </div>
          <button
            type="submit"
            className="btn w-100"
            style={{
              backgroundColor: '#0d6efd',
              color: '#fff',
            }}
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
