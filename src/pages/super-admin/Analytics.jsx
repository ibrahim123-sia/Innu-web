// src/components/Analytics/Analytics.jsx
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  selectAllBrands,
  getAllBrands
} from '../../redux/slice/brandSlice';

// ========== VIDEO SLICE IMPORTS ==========
import {
  // Selectors
  selectVideos,
  selectDerivedVideoStats,
  selectDashboardSummary as selectVideoDashboardSummary,
  
  // Thunks
  getAllVideos,
  getVideoStats
} from '../../redux/slice/videoSlice';

// ========== VIDEO EDIT SLICE IMPORTS ==========
import {
  // Selectors
  selectTotalAIVideoRequests,
  selectAIVideoRequestsByBrand,
  selectAIErrorStats,
  selectBrandAIErrorStats,
  selectVideoAnalyticsStats,
  selectAIVideoRequestsByBrandStats,
  selectBrandStats,
  selectAIErrorRate,
  selectAISuccessRate,
  selectTotalManualSelections,
  selectManualSelectionRate,
  selectTotalSegmentsProcessed,
  selectTotalVideosWithAI,
  selectVideoEditLoading,
  selectVideoEditError,
  
  // Thunks
  getTotalAIVideoRequests,
  getAIVideoRequestsByBrand,
  getAIErrorStats,
  getBrandAIErrorStats,
  getVideoAnalyticsStats,
  getAllEditDetails
} from '../../redux/slice/videoEditSlice';

// Default images
const DEFAULT_BRAND_LOGO = 'https://cdn-icons-png.flaticon.com/512/891/891419.png';

const Analytics = () => {
  const dispatch = useDispatch();
  
  // ========== VIDEO SLICE SELECTORS ==========
  const videos = useSelector(selectVideos);
  const videoStats = useSelector(selectDerivedVideoStats);
  const videoDashboardSummary = useSelector(selectVideoDashboardSummary);
  
  // ========== VIDEO EDIT SLICE SELECTORS ==========
  const brands = useSelector(selectAllBrands);
  const totalAIVideoRequests = useSelector(selectTotalAIVideoRequests);
  const aiVideoRequestsByBrand = useSelector(selectAIVideoRequestsByBrandStats);
  const aiErrorStats = useSelector(selectAIErrorStats);
  const brandAIErrorStats = useSelector(selectBrandStats);
  const videoAnalyticsStats = useSelector(selectVideoAnalyticsStats);
  const aiErrorRate = useSelector(selectAIErrorRate);
  const aiSuccessRate = useSelector(selectAISuccessRate);
  const totalManualSelections = useSelector(selectTotalManualSelections);
  const manualSelectionRate = useSelector(selectManualSelectionRate);
  const totalSegmentsProcessed = useSelector(selectTotalSegmentsProcessed);
  const totalVideosWithAI = useSelector(selectTotalVideosWithAI);
  const loading = useSelector(selectVideoEditLoading);
  
  // Local state
  const [localLoading, setLocalLoading] = useState(true);
  const [showBrandAnalyticsModal, setShowBrandAnalyticsModal] = useState(null);
  const [brandAnalyticsData, setBrandAnalyticsData] = useState(null);
  const [activeTab, setActiveTab] = useState('ai-analytics');

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // Fetch all required data from both slices
  const fetchData = async () => {
    setLocalLoading(true);
    try {
      // Fetch brands first
      await dispatch(getAllBrands()).unwrap();
      
      // ========== FETCH VIDEO SLICE DATA ==========
      await Promise.all([
        dispatch(getAllVideos()).catch(err => console.log('Videos not available', err)),
        dispatch(getVideoStats()).catch(err => console.log('Video stats not available', err))
      ]);
      
      // ========== FETCH VIDEO EDIT SLICE DATA ==========
      await Promise.all([
        dispatch(getTotalAIVideoRequests()).catch(err => console.log('Total AI requests not available', err)),
        dispatch(getAIVideoRequestsByBrand()).catch(err => console.log('AI requests by brand not available', err)),
        dispatch(getAIErrorStats()).catch(err => console.log('AI error stats not available', err)),
        dispatch(getBrandAIErrorStats()).catch(err => console.log('Brand AI error stats not available', err)),
        dispatch(getVideoAnalyticsStats()).catch(err => console.log('Comprehensive stats not available', err)),
        dispatch(getAllEditDetails()).catch(err => console.log('Edit details not available', err))
      ]);
      
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLocalLoading(false);
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

  // Get combined stats for a specific brand from both slices
  const getBrandCombinedStats = (brandId) => {
    // ========== FROM VIDEO SLICE ==========
    const brandVideos = videos?.filter(v => v.brand_id === brandId) || [];
    
    const completedVideos = brandVideos.filter(v => v.status === 'completed').length;
    const processingVideos = brandVideos.filter(v => v.status === 'processing').length;
    const pendingVideos = brandVideos.filter(v => v.status === 'pending').length;
    const failedVideos = brandVideos.filter(v => v.status === 'failed').length;
    
    // ========== FROM VIDEO EDIT SLICE ==========
    const requestsData = aiVideoRequestsByBrand?.find(b => b.brandId === brandId);
    const aiVideoRequests = requestsData?.totalAIVideoRequests || 0;
    
    const errorData = brandAIErrorStats?.find(b => b.brandId === brandId);
    
    const totalSegments = errorData?.totalSegments || 0;
    const aiErrors = errorData?.aiErrors || 0;
    const aiCorrect = errorData?.aiCorrect || 0;
    const brandErrorRate = errorData?.aiErrorRate || 0;
    const brandSuccessRate = errorData?.aiSuccessRate || 0;
    
    return {
      brandId,
      brandName: getBrandName(brandId),
      brandLogo: getBrandLogo(brandId),
      totalVideos: brandVideos.length,
      aiVideoRequests,
      completedVideos,
      processingVideos,
      pendingVideos,
      failedVideos,
      totalSegments,
      aiErrors,
      aiCorrect,
      aiErrorRate: parseFloat(brandErrorRate).toFixed(2),
      aiSuccessRate: parseFloat(brandSuccessRate).toFixed(2)
    };
  };

  // Get all brands with their combined stats
  const getAllBrandsWithStats = () => {
    if (!brands || !Array.isArray(brands)) return [];
    
    return brands.map(brand => {
      const stats = getBrandCombinedStats(brand.id);
      return {
        ...brand,
        ...stats
      };
    }).filter(brand => brand.totalVideos > 0 || brand.totalSegments > 0);
  };

  // Handle view brand analytics
  const handleViewBrandAnalytics = (brandId) => {
    const stats = getBrandCombinedStats(brandId);
    setBrandAnalyticsData(stats);
    setShowBrandAnalyticsModal(brandId);
  };

  // Calculate totals for display
  const brandsWithStats = getAllBrandsWithStats();
  const totalBrandsWithAI = brandsWithStats.length;
  
  const totalRequestsByBrand = brandsWithStats.reduce((sum, brand) => 
    sum + (brand.aiVideoRequests || 0), 0
  );

  const totalBrandErrors = brandsWithStats.reduce((sum, brand) => 
    sum + (brand.aiErrors || 0), 0
  );

  const totalBrandSuccess = brandsWithStats.reduce((sum, brand) => 
    sum + (brand.aiCorrect || 0), 0
  );

  const totalBrandSegments = brandsWithStats.reduce((sum, brand) => 
    sum + (brand.totalSegments || 0), 0
  );

  // Video stats totals
  const totalVideos = videos?.length || 0;
  const completedVideos = videoStats?.byStatus?.completed || 0;
  const processingVideos = videoStats?.byStatus?.processing || 0;
  const recentUploads = videoStats?.recentUploads || 0;

  if (loading || localLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#002868]"></div>
        <p className="mt-4 text-gray-600">Loading analytics data...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Tab Navigation */}
      <div className="flex space-x-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('ai-analytics')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'ai-analytics'
              ? 'border-[#002868] text-[#002868]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          AI Video Analytics
        </button>
        <button
          onClick={() => setActiveTab('video-analytics')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'video-analytics'
              ? 'border-[#002868] text-[#002868]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Video Processing Analytics
        </button>
      </div>

      {/* ========== AI VIDEO ANALYTICS TAB ========== */}
      {activeTab === 'ai-analytics' && (
        <>
          {/* Overall Stats Cards - AI Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
              <h3 className="text-sm font-medium text-blue-600 mb-2">Total AI Video Requests</h3>
              <p className="text-2xl font-bold text-blue-700">{totalAIVideoRequests || 0}</p>
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

          {/* Overall Brand Statistics - AI Analytics */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Overall Brand AI Statistics</h2>
              <span className="text-sm text-gray-500">
                {totalBrandsWithAI} of {brands?.length || 0} brands with AI activity
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{totalRequestsByBrand}</div>
                <div className="text-sm text-blue-500">AI Video Requests</div>
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
                <div className="text-sm text-purple-500">Avg AI Success Rate</div>
              </div>
            </div>
          </div>

          {/* Brands Table with AI Stats */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">Brand AI Performance</h2>
              <p className="text-gray-600">AI video requests and error rates by brand</p>
            </div>
            
            {brandsWithStats.length > 0 ? (
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
                    {brandsWithStats.map((brand) => {
                      const successRate = parseFloat(brand.aiSuccessRate) || 0;
                      const errorRate = parseFloat(brand.aiErrorRate) || 0;
                      
                      return (
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
                                <div className="text-xs text-gray-500">{brand.email || 'No email'}</div>
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
                                  <div className="text-lg font-bold text-blue-600">{brand.aiVideoRequests || 0}</div>
                                  <div className="text-xs text-gray-500">AI Video Requests</div>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Success Rate:</span>
                                <span className="text-sm font-medium text-green-600">{successRate.toFixed(2)}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div 
                                  className="bg-green-500 h-1.5 rounded-full"
                                  style={{ width: `${Math.min(successRate, 100)}%` }}
                                ></div>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Error Rate:</span>
                                <span className="text-sm font-medium text-red-600">{errorRate.toFixed(2)}%</span>
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
                      );
                    })}
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
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Brand AI Analytics Found</h3>
                <p className="text-gray-500 mb-4">No AI video edit data available for any brands yet</p>
                <button
                  onClick={fetchData}
                  className="bg-[#002868] hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                >
                  Refresh Data
                </button>
              </div>
            )}
          </div>

          {/* AI Analytics Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">AI Processing Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Videos with AI:</span>
                  <span className="font-medium">{totalVideosWithAI}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Segments Processed:</span>
                  <span className="font-medium">{totalSegmentsProcessed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Manual Selection Rate:</span>
                  <span className="font-medium">{manualSelectionRate}%</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">AI Performance</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Success Rate</span>
                    <span className="font-medium text-green-600">{aiSuccessRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${aiSuccessRate}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Error Rate</span>
                    <span className="font-medium text-red-600">{aiErrorRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full"
                      style={{ width: `${aiErrorRate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Performing Brand</h3>
              {brandsWithStats.length > 0 ? (
                <div>
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100">
                      <img 
                        src={brandsWithStats[0].brandLogo}
                        alt={brandsWithStats[0].brandName}
                        className="w-full h-full object-cover"
                        onError={(e) => e.target.src = DEFAULT_BRAND_LOGO}
                      />
                    </div>
                    <div>
                      <div className="font-medium">{brandsWithStats[0].brandName}</div>
                      <div className="text-sm text-gray-500">
                        {brandsWithStats[0].aiVideoRequests} AI requests
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Success Rate:</span>
                    <span className="font-medium text-green-600">
                      {brandsWithStats[0].aiSuccessRate}%
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No brand data available</p>
              )}
            </div>
          </div>
        </>
      )}

      {/* ========== VIDEO PROCESSING ANALYTICS TAB ========== */}
      {activeTab === 'video-analytics' && (
        <>
          {/* Overall Stats Cards - Video Processing */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
              <h3 className="text-sm font-medium text-blue-600 mb-2">Total Videos</h3>
              <p className="text-2xl font-bold text-blue-700">{totalVideos}</p>
              <p className="text-sm text-blue-600 mt-1">All uploaded videos</p>
            </div>
            
            <div className="bg-green-50 rounded-lg p-6 border border-green-100">
              <h3 className="text-sm font-medium text-green-600 mb-2">Completed Videos</h3>
              <p className="text-2xl font-bold text-green-700">{completedVideos}</p>
              <p className="text-sm text-green-600 mt-1">Successfully processed</p>
            </div>
            
            <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-100">
              <h3 className="text-sm font-medium text-yellow-600 mb-2">Processing</h3>
              <p className="text-2xl font-bold text-yellow-700">{processingVideos}</p>
              <p className="text-sm text-yellow-600 mt-1">Currently processing</p>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-6 border border-purple-100">
              <h3 className="text-sm font-medium text-purple-600 mb-2">Recent Uploads</h3>
              <p className="text-2xl font-bold text-purple-700">{recentUploads}</p>
              <p className="text-sm text-purple-600 mt-1">Last 7 days</p>
            </div>
          </div>

          {/* Video Status Distribution */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Video Status Distribution</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-700">{videoStats?.byStatus?.uploaded || 0}</div>
                <div className="text-sm text-gray-500">Uploaded</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-700">{videoStats?.byStatus?.pending || 0}</div>
                <div className="text-sm text-yellow-500">Pending</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-700">{videoStats?.byStatus?.processing || 0}</div>
                <div className="text-sm text-blue-500">Processing</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-700">{videoStats?.byStatus?.completed || 0}</div>
                <div className="text-sm text-green-500">Completed</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-700">{videoStats?.byStatus?.failed || 0}</div>
                <div className="text-sm text-red-500">Failed</div>
              </div>
            </div>
            
            {totalVideos > 0 && (
              <div className="mt-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Overall Completion Rate</span>
                  <span className="font-medium">{((completedVideos / totalVideos) * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-green-500 h-3 rounded-full"
                    style={{ width: `${(completedVideos / totalVideos) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* Recent Activity Summary */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Activity</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-gray-500 mb-1">Today</div>
                <div className="text-2xl font-bold text-gray-800">{videoDashboardSummary?.today || 0}</div>
                <div className="text-xs text-gray-400 mt-1">videos uploaded</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-gray-500 mb-1">Yesterday</div>
                <div className="text-2xl font-bold text-gray-800">{videoDashboardSummary?.yesterday || 0}</div>
                <div className="text-xs text-gray-400 mt-1">videos uploaded</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-gray-500 mb-1">Last 7 Days</div>
                <div className="text-2xl font-bold text-gray-800">{videoDashboardSummary?.lastWeek || 0}</div>
                <div className="text-xs text-gray-400 mt-1">videos uploaded</div>
              </div>
            </div>
          </div>
        </>
      )}

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
                  <p className="text-gray-600">Complete Brand Analytics</p>
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
              {/* Video Processing Stats */}
              <div className="mb-8">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Video Processing Stats</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-sm text-blue-600">Total Videos</div>
                    <div className="text-2xl font-bold text-blue-700">{brandAnalyticsData.totalVideos}</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-sm text-green-600">Completed</div>
                    <div className="text-2xl font-bold text-green-700">{brandAnalyticsData.completedVideos}</div>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="text-sm text-yellow-600">Processing</div>
                    <div className="text-2xl font-bold text-yellow-700">{brandAnalyticsData.processingVideos}</div>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="text-sm text-red-600">Failed</div>
                    <div className="text-2xl font-bold text-red-700">{brandAnalyticsData.failedVideos}</div>
                  </div>
                </div>
              </div>

              {/* AI Stats Cards */}
              <h3 className="text-lg font-bold text-gray-800 mb-4">AI Edit Performance</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-blue-600">AI Video Requests</h4>
                      <p className="text-2xl font-bold text-blue-700 mt-1">{brandAnalyticsData.aiVideoRequests}</p>
                      <p className="text-xs text-blue-500">Videos processed by AI</p>
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
              <div className="bg-white border rounded-lg p-6">
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
                              style={{ width: `${Math.min(parseFloat(brandAnalyticsData.aiSuccessRate) || 0, 100)}%` }}
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
                              style={{ width: `${Math.min(parseFloat(brandAnalyticsData.aiErrorRate) || 0, 100)}%` }}
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
                        <span className="text-lg font-bold text-blue-700">{brandAnalyticsData.aiVideoRequests}</span>
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