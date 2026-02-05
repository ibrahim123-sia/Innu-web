import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectShopsByBrandId,
  getBrandShops
} from '../../redux/slice/shopSlice';
import {
  selectDistrictsByBrandFromState, // Updated selector
  getDistrictsByBrand
} from '../../redux/slice/districtSlice';
import {
  getAIVideoRequestsByBrand,
  getBrandAIErrorStats
} from '../../redux/slice/videoEditSlice';

const Analytics = () => {
  const dispatch = useDispatch();
  const user = useSelector(state => state.user.currentUser);
  const shops = useSelector(state => selectShopsByBrandId(user?.brand_id)(state));
  
  // Updated: Use districtsByBrand instead of all districts
  const districtsByBrand = useSelector(selectDistrictsByBrandFromState);
  
  const [loading, setLoading] = useState(true);
  const [aiRequestsByShop, setAiRequestsByShop] = useState([]);
  const [brandAIStats, setBrandAIStats] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [expandedDistrict, setExpandedDistrict] = useState(null);

  useEffect(() => {
    console.log('Analytics Debug:');
    console.log('User brand_id:', user?.brand_id);
    console.log('Shops count:', shops?.length);
    console.log('DistrictsByBrand count:', districtsByBrand?.length);
    
    if (user?.brand_id) {
      fetchData();
    }
  }, [user?.brand_id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Pass brand_id to all API calls that need it
      const results = await Promise.all([
        dispatch(getBrandShops(user.brand_id)), // Pass brand_id
        dispatch(getDistrictsByBrand(user.brand_id)), // Pass brand_id
        dispatch(getAIVideoRequestsByBrand()),
        dispatch(getBrandAIErrorStats())
      ]);

      console.log('API Results:', results);

      // Filter AI requests for this brand's shops
      if (results[2].payload?.data) {
        const brandAIRequests = results[2].payload.data.filter(
          item => shops?.some(shop => shop.id === item.shop_id)
        );
        console.log('Brand AI Requests:', brandAIRequests);
        setAiRequestsByShop(brandAIRequests);
      }
      
      // Set brand AI stats
      if (results[3].payload?.data) {
        const brandStats = results[3].payload.data.find(
          stat => stat.brandId === user.brand_id
        );
        console.log('Brand AI Stats:', brandStats);
        setBrandAIStats(brandStats);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getShopName = (shopId) => {
    const shop = shops?.find(s => s.id === shopId);
    return shop?.name || 'Unknown Shop';
  };

  const getDistrictName = (districtId) => {
    const district = districtsByBrand.find(d => d.id === districtId);
    return district?.name || 'No District';
  };

  const getAIRequestsForShop = (shopId) => {
    const shopData = aiRequestsByShop.find(item => item.shop_id === shopId);
    return shopData?.total_ai_video_requests || 0;
  };

  const getShopsByDistrict = (districtId) => {
    return shops?.filter(shop => shop.district_id === districtId) || [];
  };

  const getDistrictStats = (districtId) => {
    const districtShops = getShopsByDistrict(districtId);
    let totalAIRequests = 0;
    
    districtShops.forEach(shop => {
      totalAIRequests += getAIRequestsForShop(shop.id);
    });

    return {
      totalShops: districtShops.length,
      totalAIRequests,
      activeShops: districtShops.filter(shop => shop.is_active).length
    };
  };

  const getAllDistrictStats = () => {
    const districtStats = {};
    
    districtsByBrand.forEach(district => {
      districtStats[district.id] = getDistrictStats(district.id);
    });

    return districtStats;
  };

  const getFilteredDistricts = () => {
    if (selectedDistrict === 'all') {
      return districtsByBrand;
    }
    return districtsByBrand.filter(district => district.id === selectedDistrict);
  };

  const districtStats = getAllDistrictStats();
  const displayDistricts = districtsByBrand || [];

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#002868]"></div>
        <p className="mt-4 text-gray-600">Loading analytics data...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Brand Analytics Dashboard</h1>
        <p className="text-gray-600">Track AI video requests and performance across your brand</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">District Filter</label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002868]"
            >
              <option value="all">All Districts</option>
              {displayDistricts.map(district => (
                <option key={district.id} value={district.id}>
                  {district.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={fetchData}
              className="w-full bg-[#002868] hover:bg-blue-800 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Data
            </button>
          </div>
        </div>
      </div>

      {/* Overall Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
          <h3 className="text-sm font-medium text-blue-600 mb-2">Total Shops</h3>
          <p className="text-2xl font-bold text-blue-700">{shops?.length || 0}</p>
          <p className="text-sm text-blue-600 mt-1">
            {shops?.filter(s => s.is_active).length || 0} active
          </p>
        </div>
        
        <div className="bg-green-50 rounded-lg p-6 border border-green-100">
          <h3 className="text-sm font-medium text-green-600 mb-2">Total Districts</h3>
          <p className="text-2xl font-bold text-green-700">{displayDistricts.length}</p>
          <p className="text-sm text-green-600 mt-1">Organizational units</p>
        </div>
        
        <div className="bg-red-50 rounded-lg p-6 border border-red-100">
          <h3 className="text-sm font-medium text-red-600 mb-2">Total AI Video Requests</h3>
          <p className="text-2xl font-bold text-red-700">
            {aiRequestsByShop.reduce((sum, item) => sum + (item.total_ai_video_requests || 0), 0)}
          </p>
          <p className="text-sm text-red-600 mt-1">Across all shops</p>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-6 border border-purple-100">
          <h3 className="text-sm font-medium text-purple-600 mb-2">Active Districts</h3>
          <p className="text-2xl font-bold text-purple-700">
            {displayDistricts.filter(d => d.is_active).length}
          </p>
          <p className="text-sm text-purple-600 mt-1">Currently active</p>
        </div>
      </div>

      {/* AI Performance Summary */}
      {brandAIStats && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">AI Performance Summary</h2>
            <span className="text-sm text-gray-500">For your brand</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {brandAIStats.aiSuccessRate || '0.00'}%
              </div>
              <div className="text-sm text-blue-500">AI Success Rate</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {brandAIStats.aiCorrect || 0}
              </div>
              <div className="text-sm text-green-500">AI Correct Selections</div>
            </div>
            
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {brandAIStats.aiErrors || 0}
              </div>
              <div className="text-sm text-red-500">AI Errors (Manual Corrections)</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {brandAIStats.totalSegments || 0}
              </div>
              <div className="text-sm text-purple-500">Total Video Segments</div>
            </div>
          </div>

          {/* Progress Bars */}
          <div className="mt-6 space-y-4">
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>AI Success Rate</span>
                <span>{brandAIStats.aiSuccessRate || '0.00'}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${brandAIStats.aiSuccessRate || 0}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>AI Error Rate</span>
                <span>{brandAIStats.aiErrorRate || '0.00'}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full"
                  style={{ width: `${brandAIStats.aiErrorRate || 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Districts Analytics */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">District Analytics</h2>
          <p className="text-gray-600">AI video requests and shop distribution by district</p>
        </div>
        
        {loading ? (
          <div className="py-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#002868]"></div>
            <p className="mt-4 text-gray-600">Loading district analytics...</p>
          </div>
        ) : getFilteredDistricts().length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    District Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Shop Statistics
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    AI Video Requests
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getFilteredDistricts().map((district) => {
                  const stats = districtStats[district.id] || { totalShops: 0, totalAIRequests: 0, activeShops: 0 };
                  const districtShops = getShopsByDistrict(district.id);
                  
                  return (
                    <React.Fragment key={district.id}>
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center mr-4 border bg-gray-100">
                              <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{district.name}</div>
                              <div className="text-sm text-gray-500">
                                {district.description || 'No description'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-600">Total Shops:</span>
                              <span className="text-xs font-medium text-gray-800">{stats.totalShops}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-600">Active Shops:</span>
                              <span className="text-xs font-medium text-green-600">{stats.activeShops}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            <div>
                              <div className="text-lg font-bold text-blue-600">{stats.totalAIRequests}</div>
                              <div className="text-xs text-gray-500">AI Video Requests</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            district.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {district.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => setExpandedDistrict(expandedDistrict === district.id ? null : district.id)}
                            className="px-3 py-1 bg-[#002868] text-white hover:bg-blue-700 rounded text-sm flex items-center"
                          >
                            <svg className={`w-4 h-4 mr-1 transition-transform ${expandedDistrict === district.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                            {expandedDistrict === district.id ? 'Hide Shops' : 'View Shops'}
                          </button>
                        </td>
                      </tr>
                      
                      {/* Expanded Shops Row */}
                      {expandedDistrict === district.id && districtShops.length > 0 && (
                        <tr>
                          <td colSpan="5" className="px-6 py-4 bg-gray-50">
                            <div className="mb-2">
                              <h4 className="text-sm font-medium text-gray-700 mb-2">Shops in {district.name}</h4>
                              <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                  <thead className="bg-gray-100">
                                    <tr>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Shop Name</th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">AI Video Requests</th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-200">
                                    {districtShops.map((shop) => (
                                      <tr key={shop.id} className="hover:bg-white">
                                        <td className="px-4 py-2 text-sm font-medium text-gray-900">{shop.name}</td>
                                        <td className="px-4 py-2 text-sm text-gray-500">
                                          {shop.city}{shop.state ? `, ${shop.state}` : ''}
                                        </td>
                                        <td className="px-4 py-2 text-sm font-medium text-blue-600">
                                          {getAIRequestsForShop(shop.id)}
                                        </td>
                                        <td className="px-4 py-2">
                                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                            shop.is_active 
                                              ? 'bg-green-100 text-green-800' 
                                              : 'bg-red-100 text-red-800'
                                          }`}>
                                            {shop.is_active ? 'Active' : 'Inactive'}
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No District Data Found</h3>
            <p className="text-gray-500 mb-4">No district data available for the selected filter</p>
            <button
              onClick={fetchData}
              className="bg-[#002868] hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Refresh Data
            </button>
          </div>
        )}
      </div>

      {/* Top Performing Shops */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Top Performing Shops by AI Requests</h2>
        
        {aiRequestsByShop.length > 0 ? (
          <div className="space-y-4">
            {[...aiRequestsByShop]
              .sort((a, b) => (b.total_ai_video_requests || 0) - (a.total_ai_video_requests || 0))
              .slice(0, 5)
              .map((shopData, index) => {
                const shop = shops?.find(s => s.id === shopData.shop_id);
                if (!shop) return null;
                
                return (
                  <div key={shop.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 font-bold">{index + 1}</span>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{shop.name}</h3>
                        <p className="text-sm text-gray-500">
                          {getDistrictName(shop.district_id)} • {shop.city}{shop.state ? `, ${shop.state}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        {shopData.total_ai_video_requests || 0}
                      </div>
                      <div className="text-sm text-gray-500">AI Video Requests</div>
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-500">No AI video request data available</p>
            <p className="text-sm text-gray-400 mt-1">Data will appear when shops start making AI video requests</p>
          </div>
        )}
      </div>

      {/* Data Summary */}
      <div className="mt-8 text-sm text-gray-500">
        <p>Data last updated: {new Date().toLocaleString()}</p>
        <p>Total shops analyzed: {shops?.length || 0}</p>
        <p>Total districts: {displayDistricts.length}</p>
      </div>
    </div>
  );
};

export default Analytics;