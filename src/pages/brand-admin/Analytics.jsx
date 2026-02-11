import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  getShopsByBrand, // Changed from getBrandShops to getShopsByBrand
  selectShopsByBrand // Changed from selectShopsByBrandId to selectShopsByBrand
} from '../../redux/slice/shopSlice';
import {
  selectDistrictsByBrand, // Changed from selectDistrictsByBrandFromState to selectDistrictsByBrand
  getDistrictsByBrand
} from '../../redux/slice/districtSlice';
import {
  getAIVideoRequestsByBrand,
  getBrandAIErrorStats,
  selectAIVideoRequestsByBrandStats,
  selectBrandStats
} from '../../redux/slice/videoEditSlice';

const Analytics = () => {
  const dispatch = useDispatch();
  const user = useSelector(state => state.user.currentUser);
  const brandId = user?.brand_id;
  
  // Correct selectors
  const shops = useSelector(selectShopsByBrand) || [];
  const districtsByBrand = useSelector(selectDistrictsByBrand) || [];
  const aiVideoRequestsByBrand = useSelector(selectAIVideoRequestsByBrandStats);
  const brandAIErrorStats = useSelector(selectBrandStats);
  
  const [loading, setLoading] = useState(true);
  const [brandAIStats, setBrandAIStats] = useState(null);
  const [expandedDistrict, setExpandedDistrict] = useState(null);
  const [shopAIRequestsMap, setShopAIRequestsMap] = useState({});

  useEffect(() => {
    console.log('Analytics Debug:');
    console.log('User brand_id:', brandId);
    console.log('Shops count:', shops?.length);
    console.log('DistrictsByBrand count:', districtsByBrand?.length);
    
    if (brandId) {
      fetchData();
    }
  }, [brandId]);

  useEffect(() => {
    // Process AI video requests by shop
    if (aiVideoRequestsByBrand && Array.isArray(aiVideoRequestsByBrand)) {
      const requestsMap = {};
      aiVideoRequestsByBrand.forEach(item => {
        // Check if this is shop-level data or brand-level data
        if (item.shopId || item.shop_id) {
          const shopId = item.shopId || item.shop_id;
          requestsMap[shopId] = item.totalAIVideoRequests || 0;
        }
      });
      setShopAIRequestsMap(requestsMap);
    }
  }, [aiVideoRequestsByBrand]);

  useEffect(() => {
    // Calculate brand-specific AI stats when data is available
    if (brandId && brandAIErrorStats && aiVideoRequestsByBrand) {
      calculateBrandStats();
    }
  }, [brandAIErrorStats, aiVideoRequestsByBrand, brandId]);

  const fetchData = async () => {
    if (!brandId) return;
    
    setLoading(true);
    try {
      // Pass brand_id to all API calls that need it
      await Promise.all([
        dispatch(getShopsByBrand(brandId)), // Changed from getBrandShops
        dispatch(getDistrictsByBrand(brandId)),
        dispatch(getAIVideoRequestsByBrand()),
        dispatch(getBrandAIErrorStats())
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateBrandStats = () => {
    // Get brand-specific AI stats from the transformed selector
    const brandStats = brandAIErrorStats?.find(b => b.brandId === brandId);
    setBrandAIStats(brandStats || null);
  };

  const getAIRequestsForShop = (shopId) => {
    return shopAIRequestsMap[shopId] || 0;
  };

  const getShopsByDistrict = (districtId) => {
    if (!shops || !Array.isArray(shops)) return [];
    return shops.filter(shop => shop.district_id === districtId);
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
    
    districtsByBrand?.forEach(district => {
      districtStats[district.id] = getDistrictStats(district.id);
    });

    return districtStats;
  };

  const districtStats = getAllDistrictStats();

  const getTotalAIRequests = () => {
    if (!aiVideoRequestsByBrand || !brandId) return 0;
    
    const brandData = aiVideoRequestsByBrand.find(b => b.brandId === brandId);
    return brandData?.totalAIVideoRequests || 0;
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Loading analytics data...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
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
          <p className="text-2xl font-bold text-green-700">{districtsByBrand?.length || 0}</p>
          <p className="text-sm text-green-600 mt-1">Organizational units</p>
        </div>
        
        <div className="bg-red-50 rounded-lg p-6 border border-red-100">
          <h3 className="text-sm font-medium text-red-600 mb-2">Total AI Video Requests</h3>
          <p className="text-2xl font-bold text-red-700">{getTotalAIRequests()}</p>
          <p className="text-sm text-red-600 mt-1">Across all shops</p>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-6 border border-purple-100">
          <h3 className="text-sm font-medium text-purple-600 mb-2">Active Districts</h3>
          <p className="text-2xl font-bold text-purple-700">
            {districtsByBrand?.filter(d => d.is_active).length || 0}
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
                  style={{ width: `${Math.min(parseFloat(brandAIStats.aiSuccessRate) || 0, 100)}%` }}
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
                  style={{ width: `${Math.min(parseFloat(brandAIStats.aiErrorRate) || 0, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Districts Analytics */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-800">District Analytics</h2>
              <p className="text-gray-600">AI video requests and shop distribution by district</p>
            </div>
            <div className="text-sm text-gray-500">
              {districtsByBrand?.length || 0} districts
            </div>
          </div>
        </div>
        
        {districtsByBrand?.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {districtsByBrand.map((district) => {
              const stats = districtStats[district.id] || { totalShops: 0, totalAIRequests: 0, activeShops: 0 };
              const districtShops = getShopsByDistrict(district.id);
              const isExpanded = expandedDistrict === district.id;
              
              return (
                <React.Fragment key={district.id}>
                  {/* District Row */}
                  <div className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center border bg-blue-50">
                          <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 text-lg">{district.name}</div>
                          <div className="text-sm text-gray-500">
                            {district.description || 'No description'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-6">
                        {/* District Stats */}
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">{stats.totalShops}</div>
                          <div className="text-sm text-gray-500">Shops</div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-lg font-semibold text-blue-600">{stats.totalAIRequests}</div>
                          <div className="text-sm text-blue-500">AI Requests</div>
                        </div>
                        
                        {/* Expand/Collapse Button */}
                        <button
                          onClick={() => setExpandedDistrict(isExpanded ? null : district.id)}
                          className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-sm flex items-center transition-colors"
                        >
                          <svg 
                            className={`w-4 h-4 mr-2 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                          {isExpanded ? 'Hide Shops' : 'View Shops'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Shops Section */}
                  {isExpanded && (
                    <div className="px-6 pb-6 bg-gray-50">
                      <div className="ml-16 border-t pt-6">
                        <h4 className="text-md font-medium text-gray-700 mb-4">
                          Shops in {district.name} ({districtShops.length} shops)
                        </h4>
                        
                        {districtShops.length > 0 ? (
                          <div className="space-y-4">
                            {districtShops.map((shop) => {
                              const aiRequests = getAIRequestsForShop(shop.id);
                              
                              return (
                                <div key={shop.id} className="bg-white rounded-lg border p-4 hover:shadow-sm transition-shadow">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                      <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center border bg-gray-100">
                                        <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                                        </svg>
                                      </div>
                                      <div>
                                        <h5 className="font-medium text-gray-900">{shop.name}</h5>
                                        <p className="text-sm text-gray-500">
                                          {shop.city}{shop.state ? `, ${shop.state}` : ''}
                                        </p>
                                        {shop.tekmetric_shop_id && (
                                          <p className="text-xs text-blue-600 mt-1">
                                            Tekmetric ID: {shop.tekmetric_shop_id}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center space-x-4">
                                      <div className="text-right">
                                        <div className="text-lg font-bold text-blue-600">{aiRequests}</div>
                                        <div className="text-xs text-gray-500">AI Requests</div>
                                      </div>
                                      <div>
                                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                          shop.is_active 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-red-100 text-red-800'
                                        }`}>
                                          {shop.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-8 bg-white rounded-lg border-2 border-dashed border-gray-200">
                            <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <p className="text-gray-500">No shops found in this district</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No District Data Found</h3>
            <p className="text-gray-500 mb-4">Create districts to organize your shops</p>
            <button
              onClick={fetchData}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Refresh Data
            </button>
          </div>
        )}
      </div>

      {/* Data Summary */}
      <div className="mt-8 text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">
        <p>Data last updated: {new Date().toLocaleString()}</p>
        <p>Total shops analyzed: {shops?.length || 0}</p>
        <p>Total districts: {districtsByBrand?.length || 0}</p>
        <p>Total AI requests: {getTotalAIRequests()}</p>
      </div>
    </div>
  );
};

export default Analytics;