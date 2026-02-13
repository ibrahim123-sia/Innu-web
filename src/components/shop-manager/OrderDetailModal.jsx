import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  getUploadUrl,
  confirmUpload,
  getVideosByOrderId,
  selectIsUploading,
  selectUploadData,
  clearUploadData,
  selectVideos
} from '../../redux/slice/videoSlice';

const OrderDetailModal = ({ order, videos, onClose }) => {
  const dispatch = useDispatch();
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadPreview, setUploadPreview] = useState(null);
  const [isUploadingToGCS, setIsUploadingToGCS] = useState(false);
  const [videoError, setVideoError] = useState(null);
  const [thumbnails, setThumbnails] = useState({});
  
  const isUploading = useSelector(selectIsUploading);
  const uploadData = useSelector(selectUploadData);
  const videoRefs = useRef({});

  // Generate thumbnail from video
  const generateThumbnail = (video, videoElement) => {
    if (!videoElement || thumbnails[video.id]) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 180;
    const ctx = canvas.getContext('2d');
    
    try {
      // Seek to 1 second or 25% of video
      videoElement.currentTime = Math.min(1, videoElement.duration * 0.25);
      
      setTimeout(() => {
        try {
          ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
          const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
          setThumbnails(prev => ({ ...prev, [video.id]: thumbnailUrl }));
        } catch (e) {
          console.error('Failed to generate thumbnail:', e);
        }
      }, 200);
    } catch (e) {
      console.error('Failed to generate thumbnail:', e);
    }
  };

  // Debug: Log order object
  useEffect(() => {
    console.log('Order object in modal:', order);
    console.log('Order ID:', order?.id);
    console.log('Videos received:', videos);
  }, [order, videos]);

  if (!order) return null;

  // Get order ID safely
  const orderId = order.id || order?.order_id;
  
  if (!orderId) {
    console.error('No order ID found in order object:', order);
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Order ID Not Found</h3>
          <p className="text-gray-600 text-center mb-6">Unable to locate the order ID. Please try again or contact support.</p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const vehicleInfo = order.vehicle_info || {};

  // Parse detected_keywords from videos
  const getVideoDetails = (video) => {
    try {
      if (video.detected_keywords) {
        const parsed = typeof video.detected_keywords === 'string' 
          ? JSON.parse(video.detected_keywords) 
          : video.detected_keywords;
        return {
          problem: parsed[0]?.problem || 'No problem detected',
          category: parsed[0]?.category || 'Uncategorized',
          keywords: parsed[0]?.keywords || []
        };
      }
    } catch (e) {
      console.error('Error parsing detected_keywords:', e);
    }
    return {
      problem: 'No problem detected',
      category: 'Uncategorized',
      keywords: []
    };
  };

  const handlePlayVideo = (video) => {
    setVideoError(null);
    const videoUrl = video.processed_video_url || video.raw_video_url;
    if (videoUrl) {
      setSelectedVideo(video);
      setVideoPreview(videoUrl);
    } else {
      setVideoError('Video URL not available');
    }
  };

  const handleCloseVideo = () => {
    setSelectedVideo(null);
    setVideoPreview(null);
    setVideoError(null);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) {
        alert('File size too large. Maximum size is 100MB.');
        return;
      }
      
      if (!file.type.startsWith('video/')) {
        alert('Please select a valid video file.');
        return;
      }
      
      setUploadFile(file);
      const previewUrl = URL.createObjectURL(file);
      setUploadPreview(previewUrl);
    }
  };

  const handleUploadCancel = () => {
    if (uploadPreview) {
      URL.revokeObjectURL(uploadPreview);
    }
    setUploadFile(null);
    setUploadPreview(null);
    dispatch(clearUploadData());
  };

  const handleUploadVideo = async () => {
    if (!uploadFile) return;
    if (!orderId) {
      console.error('Cannot upload: No order ID');
      return;
    }

    try {
      setIsUploadingToGCS(true);
      setVideoError(null);
      
      console.log('Uploading video for order ID:', orderId);
      
      const result = await dispatch(getUploadUrl({ order_id: orderId })).unwrap();
      console.log('Upload URL response:', result);
      
      const uploadUrl = result.uploadUrl || result.url;
      const videoId = result.video?.id || result.videoId;
      
      if (!uploadUrl) {
        throw new Error('No upload URL received from server');
      }
      
      if (!videoId) {
        throw new Error('No video ID received from server');
      }
      
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: uploadFile,
        headers: {
          'Content-Type': uploadFile.type,
        },
        mode: 'cors'
      });
      
      if (!uploadResponse.ok) {
        throw new Error(`Failed to upload to GCS: ${uploadResponse.status} ${uploadResponse.statusText}`);
      }

      await dispatch(confirmUpload({ videoId })).unwrap();
      
      handleUploadCancel();
      dispatch(getVideosByOrderId(orderId));
      
    } catch (error) {
      console.error('Upload failed:', error);
      setVideoError(`Upload failed: ${error.message || 'Unknown error'}`);
    } finally {
      setIsUploadingToGCS(false);
    }
  };

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (uploadPreview) {
        URL.revokeObjectURL(uploadPreview);
      }
    };
  }, [uploadPreview]);

  // Status badge component
  const StatusBadge = ({ status }) => {
    const statusConfig = {
      completed: { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500', label: 'Completed' },
      processing: { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-500', label: 'Processing' },
      uploaded: { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500', label: 'Uploaded' },
      failed: { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500', label: 'Failed' }
    };
    
    const config = statusConfig[status?.toLowerCase()] || 
      { bg: 'bg-gray-100', text: 'text-gray-800', dot: 'bg-gray-500', label: status || 'Unknown' };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <span className={`w-1.5 h-1.5 mr-1.5 rounded-full ${config.dot}`}></span>
        {config.label}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                RO #{order.ro_number || order.tekmetric_ro_id || 'N/A'}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <StatusBadge status={order.status} />
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {order.created_at ? new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
              </span>
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {order.updated_at ? new Date(order.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Error Display */}
        {videoError && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <svg className="w-5 h-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-red-800">Upload Error</p>
              <p className="text-sm text-red-700">{videoError}</p>
            </div>
          </div>
        )}

        {/* Modal Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Order & Customer Information Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Order Information Card */}
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Order Information</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Tekmetric RO ID</span>
                  <span className="text-sm font-mono bg-gray-100 px-3 py-1 rounded-md">{order.tekmetric_ro_id || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-medium text-gray-600">RO Number</span>
                  <span className="text-sm font-medium text-gray-900">{order.ro_number || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Customer Information Card */}
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <svg className="w-5 h-5 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Customer Information</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Name</span>
                  <span className="text-sm font-medium text-gray-900">{order.customer_name || 'N/A'}</span>
                </div>
                <div className="py-2">
                  <span className="text-sm font-medium text-gray-600">Customer Concern</span>
                  <div className="mt-2 bg-white rounded-lg p-3 border border-gray-200">
                    {Array.isArray(order.customer_concern) && order.customer_concern.length > 0 ? (
                      <ul className="space-y-1.5">
                        {order.customer_concern.map((concern, i) => (
                          <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                            <span className="text-blue-600 mt-1">•</span>
                            <span>{concern}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500 italic">{order.customer_concern || 'No concern noted'}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Vehicle Information Card */}
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-5 h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Vehicle Information</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Make</span>
                <p className="text-sm font-semibold text-gray-900 mt-1">{vehicleInfo.make || 'N/A'}</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Model</span>
                <p className="text-sm font-semibold text-gray-900 mt-1">{vehicleInfo.model || 'N/A'}</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Year</span>
                <p className="text-sm font-semibold text-gray-900 mt-1">{vehicleInfo.year || 'N/A'}</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">License Plate</span>
                <p className="text-sm font-semibold text-gray-900 mt-1">{vehicleInfo.license_plate || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* AI Videos Section */}
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <svg className="w-5 h-5 text-indigo-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">AI Videos</h3>
                {videos?.length > 0 && (
                  <span className="ml-2 px-2.5 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium">
                    {videos.length} {videos.length === 1 ? 'Video' : 'Videos'}
                  </span>
                )}
              </div>
              
              {/* Upload Button */}
              <div className="relative">
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="video-upload"
                  disabled={isUploadingToGCS || isUploading}
                />
                <label
                  htmlFor="video-upload"
                  className={`flex items-center px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition-all ${
                    isUploadingToGCS || isUploading
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-sm hover:shadow'
                  }`}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {isUploadingToGCS || isUploading ? 'Uploading...' : 'Upload Video'}
                </label>
              </div>
            </div>

            {/* Upload Preview */}
            {uploadPreview && (
              <div className="mb-6 p-4 bg-white border-2 border-blue-200 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-100 rounded-lg">
                      <svg className="w-4 h-4 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-700">New Video Preview</span>
                  </div>
                  <button
                    onClick={handleUploadCancel}
                    disabled={isUploadingToGCS || isUploading}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <video
                  src={uploadPreview}
                  className="w-full max-h-48 rounded-xl bg-black"
                  controls
                />
                <button
                  onClick={handleUploadVideo}
                  disabled={isUploadingToGCS || isUploading || !orderId}
                  className={`mt-4 w-full py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${
                    isUploadingToGCS || isUploading || !orderId
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-sm hover:shadow'
                  }`}
                >
                  {isUploadingToGCS || isUploading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Uploading to Cloud...
                    </span>
                  ) : (
                    'Confirm & Upload Video'
                  )}
                </button>
              </div>
            )}

            {/* Videos Grid with Thumbnails */}
            {videos && videos.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {videos.map((video, index) => {
                  const details = getVideoDetails(video);
                  const hasVideoUrl = video.raw_video_url || video.processed_video_url;
                  
                  return (
                    <div key={video.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200">
                      {/* Video Thumbnail with Play Button */}
                      <div className="relative aspect-video bg-black group">
                        {hasVideoUrl ? (
                          <>
                            {/* Hidden video element for thumbnail generation */}
                            <video
                              ref={el => {
                                if (el && !thumbnails[video.id]) {
                                  videoRefs.current[video.id] = el;
                                  el.addEventListener('loadeddata', () => generateThumbnail(video, el));
                                  el.addEventListener('loadedmetadata', () => generateThumbnail(video, el));
                                }
                              }}
                              src={video.processed_video_url || video.raw_video_url}
                              className="hidden"
                              preload="metadata"
                              crossOrigin="anonymous"
                            />
                            
                            {/* Thumbnail */}
                            {thumbnails[video.id] ? (
                              <img 
                                src={thumbnails[video.id]} 
                                alt={`Video thumbnail ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                                <div className="text-center">
                                  <svg className="w-12 h-12 text-gray-600 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M4 4a2 2 0 012-2h12a2 2 0 012 2v16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                                  </svg>
                                  <p className="text-xs text-gray-500">Loading thumbnail...</p>
                                </div>
                              </div>
                            )}
                            
                            {/* Play Button Overlay */}
                            <button
                              onClick={() => handlePlayVideo(video)}
                              className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                            >
                              <div className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center transform hover:scale-110 transition-transform duration-200 shadow-lg">
                                <svg className="w-8 h-8 text-blue-600 ml-1" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                              </div>
                            </button>
                          </>
                        ) : (
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                          </div>
                        )}
                        
                        {/* Status Badge */}
                        <div className="absolute top-3 right-3">
                          <StatusBadge status={video.status} />
                        </div>
                        
                        {/* Video Index */}
                        <div className="absolute top-3 left-3 bg-black bg-opacity-70 text-white px-2.5 py-1 rounded-lg text-xs font-medium backdrop-blur-sm">
                          #{index + 1}
                        </div>

                        {/* Duration Badge */}
                        {video.duration && (
                          <div className="absolute bottom-3 right-3 bg-black bg-opacity-70 text-white px-2 py-1 rounded-lg text-xs backdrop-blur-sm">
                            {Math.round(video.duration)}s
                          </div>
                        )}
                      </div>

                      {/* Video Details */}
                      <div className="p-4">
                        <div className="space-y-2">
                          {details.problem !== 'No problem detected' && (
                            <div className="flex items-start gap-2">
                              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-md whitespace-nowrap">Problem:</span>
                              <span className="text-sm text-gray-900 line-clamp-2">{details.problem}</span>
                            </div>
                          )}
                          {details.category !== 'Uncategorized' && (
                            <div className="flex items-start gap-2">
                              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-md whitespace-nowrap">Category:</span>
                              <span className="text-sm text-gray-900">{details.category}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {video.created_at ? new Date(video.created_at).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric' 
                            }) : 'N/A'}
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="mt-4 flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                          {hasVideoUrl && (
                            <button
                              onClick={() => handlePlayVideo(video)}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm hover:shadow"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                              Play
                            </button>
                          )}
                          <button
                            onClick={() => alert('Edit functionality coming soon')}
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                            Edit
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">No Videos Yet</h4>
                <p className="text-gray-600 mb-4">Upload your first AI video to get started</p>
                <label
                  htmlFor="video-upload"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl text-sm font-medium cursor-pointer shadow-sm hover:shadow transition-all"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Upload Your First Video
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white hover:bg-gray-100 text-gray-700 rounded-lg border border-gray-300 transition-colors font-medium text-sm shadow-sm"
          >
            Close
          </button>
        </div>
      </div>

      {/* Video Player Modal */}
      {selectedVideo && videoPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-[70] backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <h3 className="text-lg font-semibold text-gray-900">Now Playing</h3>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                  Video #{videos?.findIndex(v => v.id === selectedVideo.id) + 1}
                </span>
              </div>
              <button
                onClick={handleCloseVideo}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 bg-black">
              <video
                key={videoPreview}
                src={videoPreview}
                className="w-full rounded-xl shadow-2xl"
                controls
                autoPlay
                controlsList="nodownload"
                onError={() => setVideoError('Failed to load video')}
              />
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {selectedVideo.detected_keywords && (
                  <span className="flex items-center gap-2">
                    <span className="font-medium">Problem:</span>
                    {getVideoDetails(selectedVideo).problem}
                  </span>
                )}
              </div>
              <button
                onClick={handleCloseVideo}
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors font-medium text-sm"
              >
                Close Player
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetailModal;