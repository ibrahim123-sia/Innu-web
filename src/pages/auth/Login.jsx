import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { login } from '../../redux/slice/userSlice';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await dispatch(login({ email, password })).unwrap();
      
      if (result.success) {
        const userRole = result.data?.user?.role;
        
        // Log for debugging
        console.log('Login successful, user role:', userRole);
        console.log('User data:', result.data?.user);
        
        // Redirect based on role
        switch(userRole) {
          case 'super_admin':
            console.log('Redirecting to /super-admin');
            navigate('/super-admin');
            break;
          case 'brand_admin':
            console.log('Redirecting to /brand-admin/dashboard');
            navigate('/brand-admin');
            break;
          case 'district_manager':
            console.log('Redirecting to /district-manager/dashboard');
            navigate('/district-manager');
            break;
          case 'shop_manager':
            console.log('Redirecting to /shop-manager/dashboard');
            navigate('/shop-manager');
            break;
          default:
            console.log('Unknown role, redirecting to login');
            navigate('/login');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-blue-600 mb-2">Innu</h1>
        <p className="text-gray-600 text-center mb-6">Sign in to your account</p>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email"
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your password"
              required
            />
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg">
              {error}
            </div>
          )}
          
          <button 
            type="submit" 
            className={`w-full py-3 rounded-lg font-medium ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white transition`}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;