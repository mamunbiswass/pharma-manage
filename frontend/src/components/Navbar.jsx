import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light mb-3">
      <div className="container">
        <Link className="navbar-brand" to="/dashboard">Pharmacy</Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link className="nav-link" to="/dashboard">Dashboard</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/">Medicines</Link>
            </li>         
            <li className="nav-item">
              <Link className="nav-link" to="/add">Add Medicines</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/sale">New Sale</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/sales-list">Sales List</Link>
            </li>
          </ul>
          <button className="btn btn-primary" onClick={handleLogout}>Logout</button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
