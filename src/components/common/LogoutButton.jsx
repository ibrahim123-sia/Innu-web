import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../../redux/slice/userSlice';

const LogoutButton = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <button
      onClick={handleLogout}
      className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition"
    >
      Logout
    </button>
  );
};

export default LogoutButton;