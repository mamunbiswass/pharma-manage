const handleLogout = () => {
  localStorage.removeItem('user');
  navigate('/login');
}
<button onClick={handleLogout}>Logout</button>
