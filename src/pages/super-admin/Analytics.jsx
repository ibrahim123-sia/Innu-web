// src/components/Analytics/Analytics.jsx
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  selectAllBrands,
  getAllBrands
} from '../../redux/slice/brandSlice';
import {
  selectTotalAIVideoRequests,
  selectAIVideoRequestsByBrandStats,
  selectAIErrorStats,
  selectBrandAIErrorStats,
  selectAIErrorRate,
  selectAISuccessRate,
  selectTotalManualSelections,
  selectManualSelectionRate,
  getTotalAIVideoRequests,
  getAIVideoRequestsByBrand,
  getAIErrorStats,
  getBrandAIErrorStats,
  getVideoAnalyticsStats
} from '../../redux/slice/videoEditSlice';

// Default images
const DEFAULT_BRAND_LOGO = 'https://cdn-icons-png.flaticon.com/512/891/891419.png'; // Building icon

const Analytics = () => {
  const dispatch = useDispatch();
  
  // Selectors from Redux
  const brands = useSelector(selectAllBrands);
  const totalAIVideoRequests = useSelector(selectTotalAIVideoRequests);
  const aiVideoRequestsByBrand = useSelector(selectAIVideoRequestsByBrandStats);
  const aiErrorStats = useSelector(selectAIErrorStats);
  const brandAIErrorStats = useSelector(selectBrandAIErrorStats);
  const aiErrorRate = useSelector(selectAIErrorRate);
  const aiSuccessRate = useSelector(selectAISuccessRate);
  const totalManualSelections = useSelector(selectTotalManualSelections);
  const manualSelectionRate = useSelector(selectManualSelectionRate);
  
  // Local state
  const [loading, setLoading] = useState(true);
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [showBrandAnalyticsModal, setShowBrandAnalyticsModal] = useState(null);
  const [brandAnalyticsData, setBrandAnalyticsData] = useState(null);

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // Fetch all required data
  const fetchData = async () => {
    setLoading(true);
    try {
      // Use the comprehensive endpoint to get all data in one call
      await Promise.all([
        dispatch(getAllBrands()),
        dispatch(getVideoAnalyticsStats())
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get brand logo with fallback
  const getBrandLogo = (brandId) => {
    const brand = brands?.find(b => b.id === brandId);
    if (brand?.logo_url && brand.logo_url.trim() !== '') {
      return brand.logo_url;
    }
    return DEFAULT_BRAND_LOGO;
  };

  // Get brand name by ID
  const getBrandName = (brandId) => {
    const brand = brands?.find(b => b.id === brandId);
    return brand?.name || 'Unknown Brand';
  };

  // Get AI stats for a specific brand
  const getBrandAIStats = (brandId) => {
    // Get video requests for this brand
    const requestsData = aiVideoRequestsByBrand.find(b => b.brandId === brandId);
    const videoRequests = requestsData?.totalAIVideoRequests || 0;
    
    // Get error stats for this brand
    const errorData = brandAIErrorStats.find(b => b.brandId === brandId);
    
    return {
      brandId,
      brandName: getBrandName(brandId),
      brandLogo: getBrandLogo(brandId),
      totalVideoRequests: videoRequests,
      totalSegments: errorData?.totalSegments || 0,
      aiErrors: errorData?.aiErrors || 0,
      aiCorrect: errorData?.aiCorrect || 0,
      aiErrorRate: errorData?.aiErrorRate || "0.00",
      aiSuccessRate: errorData?.aiSuccessRate || "0.00"
    };
  };

  // Get all brands with their AI stats
  const getAllBrandsWithAIStats = () => {
    if (!brands || !aiVideoRequestsByBrand || !brandAIErrorStats) return [];
    
    return brands.map(brand => {
      const brandId = brand.id;
      
      // Get video requests for this brand
      const requestsData = aiVideoRequestsByBrand.find(b => b.brandId === brandId);
      const videoRequests = requestsData?.totalAIVideoRequests || 0;
      
      // Get error stats for this brand
      const errorData = brandAIErrorStats.find(b => b.brandId === brandId);
      
      return {
        ...brand,
        totalVideoRequests: videoRequests,
        totalSegments: errorData?.totalSegments || 0,
        aiErrors: errorData?.aiErrors || 0,
        aiCorrect: errorData?.aiCorrect || 0,
        aiErrorRate: errorData?.aiErrorRate || "0.00",
        aiSuccessRate: errorData?.aiSuccessRate || "0.00"
      };
    });
  };

  // Handle view brand analytics
  const handleViewBrandAnalytics = (brandId) => {
    const stats = getBrandAIStats(brandId);
    setBrandAnalyticsData(stats);
    setShowBrandAnalyticsModal(brandId);
  };

  // Filter data based on selected brand
  const filteredBrandsWithStats = selectedBrand === 'all' 
    ? getAllBrandsWithAIStats()
    : getAllBrandsWithAIStats().filter(brand => brand.id === selectedBrand);

  // Calculate totals for display
  const totalRequestsByBrand = aiVideoRequestsByBrand.reduce((sum, brand) => 
    sum + (brand.totalAIVideoRequests || 0), 0
  );

  const totalBrandErrors = brandAIErrorStats.reduce((sum, brand) => 
    sum + (brand.aiErrors || 0), 0
  );

  const totalBrandSuccess = brandAIErrorStats.reduce((sum, brand) => 
    sum + (brand.aiCorrect || 0), 0
  );

  const totalBrandSegments = brandAIErrorStats.reduce((sum, brand) => 
    sum + (brand.totalSegments || 0), 0
  );

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
        <h1 className="text-3xl font-bold text-gray-800 mb-2">AI Video Analytics Dashboard</h1>
        <p className="text-gray-600">Track AI video requests and performance across all brands</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Brand Filter</label>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002868]"
            >
              <option value="all">All Brands</option>
              {brands?.map(brand => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
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
          <h3 className="text-sm font-medium text-blue-600 mb-2">Total AI Video Requests</h3>
          <p className="text-2xl font-bold text-blue-700">{totalAIVideoRequests}</p>
          <p className="text-sm text-blue-600 mt-1">Videos processed by AI</p>
        </div>
        
        <div className="bg-green-50 rounded-lg p-6 border border-green-100">
          <h3 className="text-sm font-medium text-green-600 mb-2">Overall AI Success Rate</h3>
          <p className="text-2xl font-bold text-green-700">{aiSuccessRate}%</p>
          <p className="text-sm text-green-600 mt-1">Segments where AI was correct</p>
        </div>
        
        <div className="bg-red-50 rounded-lg p-6 border border-red-100">
          <h3 className="text-sm font-medium text-red-600 mb-2">Overall AI Error Rate</h3>
          <p className="text-2xl font-bold text-red-700">{aiErrorRate}%</p>
          <p className="text-sm text-red-600 mt-1">Segments manually corrected</p>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-6 border border-purple-100">
          <h3 className="text-sm font-medium text-purple-600 mb-2">Total Manual Corrections</h3>
          <p className="text-2xl font-bold text-purple-700">{totalManualSelections}</p>
          <p className="text-sm text-purple-600 mt-1">Total segments corrected</p>
        </div>
      </div>

      {/* Overall Brand Statistics */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">Overall Brand Statistics</h2>
          <span className="text-sm text-gray-500">Across all brands</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{totalRequestsByBrand}</div>
            <div className="text-sm text-blue-500">AI Video Requests (by Brand)</div>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{totalBrandSuccess.toLocaleString()}</div>
            <div className="text-sm text-green-500">Total AI Successes</div>
          </div>
          
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{totalBrandErrors.toLocaleString()}</div>
            <div className="text-sm text-red-500">Total AI Errors</div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {totalBrandSegments > 0 ? ((totalBrandSuccess / totalBrandSegments) * 100).toFixed(1) : 0}%
            </div>
            <div className="text-sm text-purple-500">Overall AI Success Rate</div>
          </div>
        </div>
      </div>

      {/* Brands Table with AI Stats */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">Brand AI Performance</h2>
          <p className="text-gray-600">AI video requests and error rates by brand</p>
        </div>
        
        {loading ? (
          <div className="py-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#002868]"></div>
            <p className="mt-4 text-gray-600">Loading brand analytics...</p>
          </div>
        ) : filteredBrandsWithStats.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Brand Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    AI Video Requests
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    AI Performance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    AI Error Stats
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
                {filteredBrandsWithStats.map((brand) => (
                  <tr key={brand.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center mr-4 border bg-gray-100">
                          <img 
                            src={getBrandLogo(brand.id)}
                            alt={brand.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = DEFAULT_BRAND_LOGO;
                            }}
                          />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{brand.name}</div>
                          <div className="text-sm text-gray-500">ID: {brand.id.slice(0, 8)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <div>
                            <div className="text-lg font-bold text-blue-600">{brand.totalVideoRequests || 0}</div>
                            <div className="text-xs text-gray-500">AI Video Requests</div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Success Rate:</span>
                          <span className="text-sm font-medium text-green-600">{brand.aiSuccessRate || "0.00"}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div 
                            className="bg-green-500 h-1.5 rounded-full"
                            style={{ width: `${brand.aiSuccessRate || 0}%` }}
                          ></div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Error Rate:</span>
                          <span className="text-sm font-medium text-red-600">{brand.aiErrorRate || "0.00"}%</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">Total Segments:</span>
                          <span className="text-xs font-medium text-gray-800">{brand.totalSegments || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">AI Correct:</span>
                          <span className="text-xs font-medium text-green-600">{brand.aiCorrect || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">AI Errors:</span>
                          <span className="text-xs font-medium text-red-600">{brand.aiErrors || 0}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        brand.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {brand.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewBrandAnalytics(brand.id)}
                          className="px-3 py-1 bg-[#002868] text-white hover:bg-blue-700 rounded text-sm flex items-center"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View Analytics
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center">
            <img 
              src={DEFAULT_BRAND_LOGO}
              alt="No brands" 
              className="w-16 h-16 mx-auto mb-4 opacity-50"
            />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Brand Analytics Found</h3>
            <p className="text-gray-500 mb-4">No AI video data available for the selected filter</p>
            <button
              onClick={fetchData}
              className="bg-[#002868] hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Refresh Data
            </button>
          </div>
        )}
      </div>

      {/* Data Summary */}
      <div className="mt-8 text-sm text-gray-500">
        <p>Data last updated: {new Date().toLocaleString()}</p>
        <p>Total AI video requests: {totalAIVideoRequests}</p>
        <p>Total brands analyzed: {brandAIErrorStats?.length || 0}</p>
      </div>

      {/* Brand Analytics Modal */}
      {showBrandAnalyticsModal && brandAnalyticsData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white p-6 border-b flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-lg overflow-hidden border bg-gray-100">
                  <img 
                    src={brandAnalyticsData.brandLogo}
                    alt={brandAnalyticsData.brandName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = DEFAULT_BRAND_LOGO;
                    }}
                  />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{brandAnalyticsData.brandName}</h2>
                  <p className="text-gray-600">AI Video Analytics</p>
                  <div className="mt-1">
                    <span className="text-xs text-gray-500">
                      Brand ID: {brandAnalyticsData.brandId.slice(0, 8)}...
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowBrandAnalyticsModal(null)}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* AI Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-blue-600">AI Video Requests</h4>
                      <p className="text-2xl font-bold text-blue-700 mt-1">{brandAnalyticsData.totalVideoRequests}</p>
                      <p className="text-xs text-blue-500">Total videos processed by AI</p>
                    </div>
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-green-600">AI Success Rate</h4>
                      <p className="text-2xl font-bold text-green-700 mt-1">{brandAnalyticsData.aiSuccessRate}%</p>
                      <p className="text-xs text-green-500">Segments where AI was correct</p>
                    </div>
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-red-600">AI Error Rate</h4>
                      <p className="text-2xl font-bold text-red-700 mt-1">{brandAnalyticsData.aiErrorRate}%</p>
                      <p className="text-xs text-red-500">Segments manually corrected</p>
                    </div>
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-purple-600">Manual Corrections</h4>
                      <p className="text-2xl font-bold text-purple-700 mt-1">{brandAnalyticsData.aiErrors}</p>
                      <p className="text-xs text-purple-500">Total segments corrected</p>
                    </div>
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="bg-white border rounded-lg p-6 mb-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Detailed AI Performance</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Total Video Segments</span>
                        <span className="text-lg font-bold text-gray-800">{brandAnalyticsData.totalSegments}</span>
                      </div>
                      <p className="text-xs text-gray-500">All video segments processed for this brand</p>
                    </div>
                    
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-green-700">AI Correct Selections</span>
                        <span className="text-lg font-bold text-green-700">{brandAnalyticsData.aiCorrect}</span>
                      </div>
                      <p className="text-xs text-green-500">Segments where AI selection was accepted</p>
                    </div>
                    
                    <div className="p-4 bg-red-50 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-red-700">AI Error Selections</span>
                        <span className="text-lg font-bold text-red-700">{brandAnalyticsData.aiErrors}</span>
                      </div>
                      <p className="text-xs text-red-500">Segments manually corrected by users</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-white border rounded-lg">
                      <h4 className="font-medium text-gray-700 mb-3">Performance Breakdown</h4>
                      
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>AI Success Rate</span>
                            <span>{brandAnalyticsData.aiSuccessRate}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${brandAnalyticsData.aiSuccessRate}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>AI Error Rate</span>
                            <span>{brandAnalyticsData.aiErrorRate}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-red-500 h-2 rounded-full"
                              style={{ width: `${brandAnalyticsData.aiErrorRate}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex items-center justify-between text-sm">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                          <span className="text-gray-600">AI Success</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                          <span className="text-gray-600">AI Errors</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-blue-700">Total AI Video Requests</span>
                        <span className="text-lg font-bold text-blue-700">{brandAnalyticsData.totalVideoRequests}</span>
                      </div>
                      <p className="text-xs text-blue-500">Videos processed by AI for this brand</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 p-4 border-t flex justify-end space-x-3">
              <button
                onClick={() => setShowBrandAnalyticsModal(null)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;