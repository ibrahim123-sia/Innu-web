import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  selectAllBrands,
  getAllBrands
} from '../../redux/slice/brandSlice';

import {
  selectVideos,
  getAllVideos,
  getVideosByBrand,
} from '../../redux/slice/videoSlice';

import {
  selectEditDetailsList,
  selectVideoEditLoading,
  getAllEditDetails,
  getEditDetailsByBrand,
} from '../../redux/slice/videoEditSlice';

const DEFAULT_BRAND_LOGO = 'https://cdn-icons-png.flaticon.com/512/891/891419.png';

const StatsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
    {[1, 2, 3, 4].map((i) => (
      <div
        key={i}
        className="bg-white p-6 rounded-lg shadow-md border-l-4 border-gray-200"
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-24 mb-2"></div>
            <div className="h-8 bg-gray-300 rounded animate-pulse w-16 mb-1"></div>
            <div className="h-3 bg-gray-200 rounded animate-pulse w-20"></div>
          </div>
          <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
        </div>
      </div>
    ))}
  </div>
);

const BrandsTableSkeleton = () => (
  <div className="bg-white rounded-lg shadow-md overflow-hidden">
    <div className="p-6 border-b">
      <div className="h-6 bg-gray-200 rounded animate-pulse w-48 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded animate-pulse w-64"></div>
    </div>
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {[1, 2, 3, 4, 5].map((i) => (
              <th key={i} className="px-6 py-3">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {[1, 2, 3, 4, 5].map((i) => (
            <tr key={i} className="hover:bg-gray-50">
              <td className="px-6 py-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse mr-4"></div>
                  <div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-32 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-24"></div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="h-8 bg-gray-200 rounded animate-pulse w-16"></div>
              </td>
              <td className="px-6 py-4">
                <div className="h-8 bg-gray-200 rounded animate-pulse w-16"></div>
              </td>
              <td className="px-6 py-4">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                  <div className="h-2 bg-gray-200 rounded-full animate-pulse w-32"></div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="h-8 bg-gray-200 rounded animate-pulse w-24"></div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const Analytics = () => {
  const dispatch = useDispatch();
  
  const brands = useSelector(selectAllBrands);
  const videos = useSelector(selectVideos);
  const editDetailsList = useSelector(selectEditDetailsList);
  const videoEditLoading = useSelector(selectVideoEditLoading);

  const [brandVideos, setBrandVideos] = useState({});
  const [brandEdits, setBrandEdits] = useState({});
  const [loadingBrandData, setLoadingBrandData] = useState({});
  
  const [localLoading, setLocalLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isDataReady, setIsDataReady] = useState(false);
  const [showBrandAnalyticsModal, setShowBrandAnalyticsModal] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showAllFeedbackModal, setShowAllFeedbackModal] = useState(false);
  const [selectedBrandForFeedback, setSelectedBrandForFeedback] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  // Monitor brandEdits changes
  useEffect(() => {
    if (Object.keys(brandEdits).length > 0) {
      console.log('Brand edits updated:', brandEdits);
      
      // Check each brand to see if it has edits
      brands?.forEach(brand => {
        const edits = brandEdits[brand.id];
        if (edits && edits.length > 0) {
          console.log(`Brand ${brand.name} (${brand.id}) has ${edits.length} edits in state`);
        } else {
          console.log(`Brand ${brand.name} (${brand.id}) has NO edits in state`);
        }
      });
    }
  }, [brandEdits, brands]);

  // Load brand-specific data for ALL brands once main data is ready
  useEffect(() => {
    if (brands && brands.length > 0 && isDataReady && !dataLoaded) {
      console.log('Loading brand-specific data for all brands:', brands.length);
      loadAllBrandData();
      setDataLoaded(true);
    }
  }, [brands, isDataReady, dataLoaded]);

  const fetchData = async () => {
    setLocalLoading(true);
    setIsInitialLoad(true);
    try {
      console.log('Fetching initial data...');
      await dispatch(getAllBrands()).unwrap();
      await dispatch(getAllVideos()).unwrap();
      await dispatch(getAllEditDetails()).unwrap();
      
      console.log('Initial data fetched successfully');
      
      setTimeout(() => {
        setIsInitialLoad(false);
        setIsDataReady(true);
      }, 300);
      
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      setIsInitialLoad(false);
    } finally {
      setLocalLoading(false);
    }
  };

  // Load all brand-specific data in parallel
  const loadAllBrandData = async () => {
    const promises = [];
    
    brands.forEach(brand => {
      // Load videos for each brand
      promises.push(
        dispatch(getVideosByBrand(brand.id))
          .unwrap()
          .then(result => {
            const videosData = Array.isArray(result) ? result : [];
            setBrandVideos(prev => ({ ...prev, [brand.id]: videosData }));
            console.log(`Loaded ${videosData.length} videos for brand ${brand.id} (${brand.name})`);
          })
          .catch(error => {
            console.error(`Error fetching videos for brand ${brand.id}:`, error);
            setBrandVideos(prev => ({ ...prev, [brand.id]: [] }));
          })
      );
      
      // Load edits for each brand - THIS IS THE KEY PART FOR MANUAL CORRECTIONS
      promises.push(
        dispatch(getEditDetailsByBrand(brand.id))
          .unwrap()
          .then(result => {
            const editsData = Array.isArray(result) ? result : [];
            setBrandEdits(prev => ({ ...prev, [brand.id]: editsData }));
            console.log(`Loaded ${editsData.length} edits for brand ${brand.id} (${brand.name}):`, editsData);
          })
          .catch(error => {
            console.error(`Error fetching edits for brand ${brand.id}:`, error);
            setBrandEdits(prev => ({ ...prev, [brand.id]: [] }));
          })
      );
    });
    
    // Wait for all promises to complete
    await Promise.allSettled(promises);
    console.log('All brand-specific data loaded');
  };

  // Fetch brand-specific videos
  const fetchBrandVideos = async (brandId) => {
    setLoadingBrandData(prev => ({ ...prev, [brandId]: true }));
    try {
      console.log(`Fetching videos for brand ${brandId}...`);
      const result = await dispatch(getVideosByBrand(brandId)).unwrap();
      
      const videosData = Array.isArray(result) ? result : [];
      console.log(`Received ${videosData.length} videos for brand ${brandId}`);
      
      setBrandVideos(prev => ({ ...prev, [brandId]: videosData }));
      return videosData;
    } catch (error) {
      console.error(`Error fetching videos for brand ${brandId}:`, error);
      setBrandVideos(prev => ({ ...prev, [brandId]: [] }));
      return [];
    } finally {
      setLoadingBrandData(prev => ({ ...prev, [brandId]: false }));
    }
  };

  // Fetch brand-specific edit details
  const fetchBrandEdits = async (brandId) => {
    setLoadingBrandData(prev => ({ ...prev, [brandId]: true }));
    try {
      console.log(`Fetching edits for brand ${brandId}...`);
      const result = await dispatch(getEditDetailsByBrand(brandId)).unwrap();
      
      const editsData = Array.isArray(result) ? result : [];
      
      console.log(`Received ${editsData.length} edits for brand ${brandId}:`, editsData);
      
      setBrandEdits(prev => ({ ...prev, [brandId]: editsData }));
      return editsData;
    } catch (error) {
      console.error(`Error fetching edits for brand ${brandId}:`, error);
      setBrandEdits(prev => ({ ...prev, [brandId]: [] }));
      return [];
    } finally {
      setLoadingBrandData(prev => ({ ...prev, [brandId]: false }));
    }
  };

  const handleViewBrandAnalytics = async (brandId) => {
    setShowBrandAnalyticsModal(brandId);
    
    // Refresh data if needed
    if (!brandVideos[brandId] || brandVideos[brandId].length === 0) {
      await fetchBrandVideos(brandId);
    }
    if (!brandEdits[brandId] || brandEdits[brandId].length === 0) {
      await fetchBrandEdits(brandId);
    }
  };

  // Handle view all feedback for brand
  const handleViewAllFeedback = (brandId) => {
    setSelectedBrandForFeedback(brandId);
    setShowAllFeedbackModal(true);
  };

  // Handle view individual feedback details
  const handleViewFeedback = (edit) => {
    setSelectedFeedback(edit);
    setShowFeedbackModal(true);
  };

  // Helper function to get brand logo with fallback
  const getBrandLogo = (brandId) => {
    if (!brands || !Array.isArray(brands)) return DEFAULT_BRAND_LOGO;
    const brand = brands.find(b => String(b.id) === String(brandId));
    return brand?.logo_url?.trim() ? brand.logo_url : DEFAULT_BRAND_LOGO;
  };

  // Get brand name by ID
  const getBrandName = (brandId) => {
    if (!brands || !Array.isArray(brands)) return 'Unknown Brand';
    const brand = brands.find(b => String(b.id) === String(brandId));
    return brand?.name || 'Unknown Brand';
  };

  // Calculate overall stats for super admin
  const totalAIVideoRequests = videos?.length || 0;
  const totalManualCorrections = editDetailsList?.length || 0;
  
  const aiSuccess = totalAIVideoRequests > totalManualCorrections 
    ? totalAIVideoRequests - totalManualCorrections 
    : 0;
  
  const aiSuccessRate = totalAIVideoRequests > 0 
    ? ((aiSuccess / totalAIVideoRequests) * 100).toFixed(2) 
    : 0;
  
  const aiErrorRate = totalAIVideoRequests > 0 
    ? ((totalManualCorrections / totalAIVideoRequests) * 100).toFixed(2) 
    : 0;

  // Get brand-specific stats for main table - USING ONLY BRAND-SPECIFIC DATA
  const getBrandStats = (brandId) => {
    // ALWAYS use brand-specific data from the API calls
    const brandSpecificVideos = brandVideos[brandId] || [];
    const brandSpecificEdits = brandEdits[brandId] || [];
    
    // Log for debugging (remove in production)
    if (brandSpecificEdits.length > 0) {
      console.log(`Brand ${brandId} has ${brandSpecificEdits.length} edits from getEditDetailsByBrand`);
    }
    
    // Use brand-specific data exclusively
    const brandVideoCount = brandSpecificVideos.length;
    const brandManualCorrections = brandSpecificEdits.length;
    
    const brandSuccess = brandVideoCount > brandManualCorrections 
      ? brandVideoCount - brandManualCorrections 
      : 0;
    
    const brandSuccessRate = brandVideoCount > 0 
      ? ((brandSuccess / brandVideoCount) * 100).toFixed(2) 
      : 0;
    
    const brandErrorRate = brandVideoCount > 0 
      ? ((brandManualCorrections / brandVideoCount) * 100).toFixed(2) 
      : 0;

    return {
      totalVideos: brandVideoCount,
      manualCorrections: brandManualCorrections,
      successCount: brandSuccess,
      successRate: brandSuccessRate,
      errorRate: brandErrorRate,
      completedVideos: brandSpecificVideos.filter(v => v.status === 'completed').length,
      processingVideos: brandSpecificVideos.filter(v => v.status === 'processing').length,
      pendingVideos: brandSpecificVideos.filter(v => v.status === 'pending').length,
      failedVideos: brandSpecificVideos.filter(v => v.status === 'failed').length,
    };
  };

  // Get detailed brand stats for modal
  const getBrandDetailedStats = (brandId) => {
    const brandSpecificVideos = brandVideos[brandId] || [];
    const brandSpecificEdits = brandEdits[brandId] || [];
    
    console.log(`Detailed stats for brand ${brandId}:`, {
      videos: brandSpecificVideos.length,
      edits: brandSpecificEdits.length
    });
    
    const totalVideos = brandSpecificVideos.length;
    const manualCorrections = brandSpecificEdits.length;
    const successCount = totalVideos > manualCorrections ? totalVideos - manualCorrections : 0;
    
    const successRate = totalVideos > 0 ? ((successCount / totalVideos) * 100).toFixed(2) : 0;
    const errorRate = totalVideos > 0 ? ((manualCorrections / totalVideos) * 100).toFixed(2) : 0;
    
    return {
      totalVideos,
      manualCorrections,
      successCount,
      successRate,
      errorRate,
      completedVideos: brandSpecificVideos.filter(v => v.status === 'completed').length,
      processingVideos: brandSpecificVideos.filter(v => v.status === 'processing').length,
      pendingVideos: brandSpecificVideos.filter(v => v.status === 'pending').length,
      failedVideos: brandSpecificVideos.filter(v => v.status === 'failed').length,
      brandVideos: brandSpecificVideos,
      brandEdits: brandSpecificEdits,
    };
  };

  // Show skeleton during initial load
  if (isInitialLoad || (localLoading && !isDataReady)) {
    return (
      <div className="p-6 transition-opacity duration-300 ease-in-out">
        <StatsSkeleton />
        <BrandsTableSkeleton />
      </div>
    );
  }

  return (
    <div className="p-6 transition-opacity duration-300 ease-in-out">
      {/* Stats Cards - SUPER ADMIN LEVEL */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Total AI Video Requests Card */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm text-gray-500">Total AI Video Requests</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {totalAIVideoRequests}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Total videos processed
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        {/* AI Success Rate Card */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm text-gray-500">AI Success Rate</h3>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {aiSuccessRate}%
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {aiSuccess} videos without corrections
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* AI Error Rate Card */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm text-gray-500">AI Error Rate</h3>
              <p className="text-3xl font-bold text-red-600 mt-2">
                {aiErrorRate}%
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {totalManualCorrections} videos with corrections
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Manual Corrections Card */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm text-gray-500">Manual Corrections</h3>
              <p className="text-3xl font-bold text-purple-600 mt-2">
                {totalManualCorrections}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Total edits with feedback
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Companies Performance Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8 hover:shadow-lg transition-shadow duration-200">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">Companies Performance</h2>
          <p className="text-gray-600">AI video requests and manual corrections by company</p>
        </div>
        
        {brands && brands.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    AI Video Requests
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Manual Corrections
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Performance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {brands.map((brand) => {
                  const stats = getBrandStats(brand.id);
                  
                  return (
                    <tr key={brand.id} className="hover:bg-gray-50 transition-colors duration-150">
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
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-lg font-bold text-blue-600">{stats.totalVideos}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-lg font-bold text-purple-600">{stats.manualCorrections}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Success Rate:</span>
                            <span className="text-sm font-medium text-green-600">{stats.successRate}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div 
                              className="bg-green-500 h-1.5 rounded-full"
                              style={{ width: `${Math.min(parseFloat(stats.successRate), 100)}%` }}
                            ></div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Error Rate:</span>
                            <span className="text-sm font-medium text-red-600">{stats.errorRate}%</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleViewBrandAnalytics(brand.id)}
                          disabled={loadingBrandData[brand.id]}
                          className="px-3 py-1 bg-[#002868] text-white hover:bg-blue-700 rounded text-sm flex items-center transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                          {loadingBrandData[brand.id] ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                              Loading...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              View Details
                            </>
                          )}
                        </button>
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Companies Found</h3>
            <p className="text-gray-500 mb-4">No companies have been added to the system yet.</p>
            <button
              onClick={fetchData}
              className="bg-[#002868] hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Refresh Data
            </button>
          </div>
        )}
      </div>

      {/* Brand Analytics Modal */}
      {showBrandAnalyticsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white p-6 border-b flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-lg overflow-hidden border bg-gray-100">
                  <img 
                    src={getBrandLogo(showBrandAnalyticsModal)}
                    alt={getBrandName(showBrandAnalyticsModal)}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = DEFAULT_BRAND_LOGO;
                    }}
                  />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{getBrandName(showBrandAnalyticsModal)}</h2>
                  <p className="text-gray-600">Complete company Analytics</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowBrandAnalyticsModal(null);
                }}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {loadingBrandData[showBrandAnalyticsModal] ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#002868]"></div>
                </div>
              ) : (
                (() => {
                  const stats = getBrandDetailedStats(showBrandAnalyticsModal);
                  
                  return (
                    <>
                      {/* Video Processing Stats */}
                      <div className="mb-8">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Video Processing Stats</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <div className="text-sm text-blue-600">Total Videos</div>
                            <div className="text-2xl font-bold text-blue-700">
                              {stats.totalVideos}
                            </div>
                          </div>
                          <div className="bg-green-50 p-4 rounded-lg">
                            <div className="text-sm text-green-600">Completed</div>
                            <div className="text-2xl font-bold text-green-700">
                              {stats.completedVideos}
                            </div>
                          </div>
                          <div className="bg-yellow-50 p-4 rounded-lg">
                            <div className="text-sm text-yellow-600">Processing</div>
                            <div className="text-2xl font-bold text-yellow-700">
                              {stats.processingVideos}
                            </div>
                          </div>
                          <div className="bg-red-50 p-4 rounded-lg">
                            <div className="text-sm text-red-600">Failed</div>
                            <div className="text-2xl font-bold text-red-700">
                              {stats.failedVideos}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* AI Performance Stats */}
                      <div className="mb-8">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">AI Performance</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="text-sm font-medium text-blue-600">AI Video Requests</h4>
                                <p className="text-2xl font-bold text-blue-700 mt-1">
                                  {stats.totalVideos}
                                </p>
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
                                <h4 className="text-sm font-medium text-green-600">Success Rate</h4>
                                <p className="text-2xl font-bold text-green-700 mt-1">
                                  {stats.successRate}%
                                </p>
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
                                <h4 className="text-sm font-medium text-red-600">Error Rate</h4>
                                <p className="text-2xl font-bold text-red-700 mt-1">
                                  {stats.errorRate}%
                                </p>
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
                                <p className="text-2xl font-bold text-purple-700 mt-1">
                                  {stats.manualCorrections}
                                </p>
                              </div>
                              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Manual Corrections List with Feedback */}
                      {stats.brandEdits && stats.brandEdits.length > 0 ? (
                        <div className="bg-white border rounded-lg p-6">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-800">Manual Correction Feedback</h3>
                            <button
                              onClick={() => handleViewAllFeedback(showBrandAnalyticsModal)}
                              className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                            >
                              View All ({stats.brandEdits.length})
                              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          </div>
                          <div className="space-y-3">
                            {stats.brandEdits.slice(0, 5).map((edit, index) => {
                              const hasFeedback = edit.feedback_reason;
                              
                              return (
                                <div 
                                  key={edit.edit_id || edit.id || index} 
                                  className={`border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors ${!hasFeedback ? 'opacity-60' : ''}`}
                                  onClick={() => handleViewFeedback(edit)}
                                >
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      {edit.feedback_reason ? (
                                        <div className="mt-2">
                                          <p className="text-sm text-gray-700 font-medium">Feedback:</p>
                                          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded mt-1">
                                            {edit.feedback_reason}
                                          </p>
                                        </div>
                                      ) : (
                                        <p className="text-sm text-gray-400 italic">No feedback provided</p>
                                      )}
                                    </div>
                                    <button className="text-blue-600 hover:text-blue-800 ml-4">
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          {stats.brandEdits.length > 5 && (
                            <div className="mt-4 text-center">
                              <button
                                onClick={() => handleViewAllFeedback(showBrandAnalyticsModal)}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                              >
                                + {stats.brandEdits.length - 5} more feedback items
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-white border rounded-lg p-6 text-center">
                          <p className="text-gray-500">No manual corrections for this company</p>
                        </div>
                      )}
                    </>
                  );
                })()
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 p-4 border-t flex justify-end">
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

      {/* All Feedback Modal - SHOW ALL FEEDBACK ITEMS */}
      {showAllFeedbackModal && selectedBrandForFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-6 border-b flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  Feedback - {getBrandName(selectedBrandForFeedback)}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Total {brandEdits[selectedBrandForFeedback]?.length || 0} feedback items
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAllFeedbackModal(false);
                  setSelectedBrandForFeedback(null);
                }}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              {brandEdits[selectedBrandForFeedback]?.length > 0 ? (
                <div className="space-y-4">
                  {brandEdits[selectedBrandForFeedback].map((edit, index) => (
                    <div 
                      key={edit.edit_id || edit.id || index} 
                      className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => {
                        setSelectedFeedback(edit);
                        setShowFeedbackModal(true);
                      }}
                    >
                      {edit.feedback_reason ? (
                        <p className="text-gray-700">{edit.feedback_reason}</p>
                      ) : (
                        <p className="text-gray-400 italic">No feedback provided</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No feedback available for this company</p>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 p-4 border-t flex justify-end">
              <button
                onClick={() => {
                  setShowAllFeedbackModal(false);
                  setSelectedBrandForFeedback(null);
                }}
                className="px-4 py-2 bg-[#002868] text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Individual Feedback Detail Modal - SHOW ONLY FEEDBACK REASON */}
      {showFeedbackModal && selectedFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[70]">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="sticky top-0 bg-white p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">Feedback Details</h3>
              <button
                onClick={() => {
                  setShowFeedbackModal(false);
                  setSelectedFeedback(null);
                }}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-800 whitespace-pre-wrap">
                  {selectedFeedback.feedback_reason || 'No feedback provided'}
                </p>
              </div>
              {selectedFeedback.created_at && (
                <p className="text-xs text-gray-400 mt-2">
                  Submitted on: {new Date(selectedFeedback.created_at).toLocaleString()}
                </p>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 p-4 border-t flex justify-end">
              <button
                onClick={() => {
                  setShowFeedbackModal(false);
                  setSelectedFeedback(null);
                }}
                className="px-4 py-2 bg-[#002868] text-white rounded-lg hover:bg-blue-700 transition-colors"
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