import React from 'react';

const OrderDetailModal = ({ order, videos, onClose }) => {
  if (!order) return null;

  const vehicleInfo = order.vehicle_info || {};
  const services = order.services || [];
  const parts = order.parts || [];

  // Check if AI video is attached
  const hasAIVideo = videos && videos.length > 0;
  const completedVideos = videos?.filter(v => v.status === 'completed') || [];

  const handleDownloadVideo = (video) => {
    // This would typically download the video file
    // For now, we'll just alert the user
    alert(`Downloading video ${video.id}...\nThis would trigger the actual download in a real application.`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white p-6 border-b flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Order Details</h2>
            <p className="text-gray-600">Order #{order.tekmetric_ro_id || order.id.slice(0, 8)}</p>
            <div className="mt-2 flex items-center space-x-2">
              <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                order.status === 'completed' ? 'bg-green-100 text-green-800' :
                order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {order.status?.replace('_', ' ') || 'Unknown'}
              </span>
              <span className="text-sm text-gray-500">
                Created: {new Date(order.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {/* Customer & Vehicle Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-800">Customer Information</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="mb-2">
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <p className="font-medium text-gray-900">{order.customer_name || 'N/A'}</p>
                </div>
                <div className="mb-2">
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <p className="text-gray-600">{order.customer_phone || 'Not provided'}</p>
                </div>
                <div className="mb-2">
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="text-gray-600">{order.customer_email || 'Not provided'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <p className="text-gray-600">{order.customer_address || 'Not provided'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-800">Vehicle Information</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="mb-2">
                  <label className="block text-sm font-medium text-gray-700">Vehicle</label>
                  <p className="font-medium text-gray-900">
                    {vehicleInfo.year ? `${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model}` : 'N/A'}
                  </p>
                </div>
                <div className="mb-2">
                  <label className="block text-sm font-medium text-gray-700">VIN</label>
                  <p className="text-gray-600">{vehicleInfo.vin || 'Not provided'}</p>
                </div>
                <div className="mb-2">
                  <label className="block text-sm font-medium text-gray-700">License Plate</label>
                  <p className="text-gray-600">{vehicleInfo.license_plate || 'Not provided'}</p>
                </div>
                <div className="mb-2">
                  <label className="block text-sm font-medium text-gray-700">Mileage</label>
                  <p className="text-gray-600">{vehicleInfo.mileage ? `${vehicleInfo.mileage} miles` : 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Color</label>
                  <p className="text-gray-600">{vehicleInfo.color || 'Not provided'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* AI Video Section */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">AI Video Status</h3>
              {hasAIVideo && (
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  {videos.length} video{videos.length > 1 ? 's' : ''} attached
                </span>
              )}
            </div>
            
            {hasAIVideo ? (
              <div className="bg-white border rounded-lg p-4">
                <div className="space-y-4">
                  {videos.map((video, index) => (
                    <div key={video.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">Video {index + 1}</div>
                        <div className="text-sm text-gray-500">
                          Status: 
                          <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
                            video.status === 'completed' ? 'bg-green-100 text-green-800' :
                            video.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                            video.status === 'uploaded' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {video.status}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          Created: {new Date(video.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div>
                        {video.status === 'completed' && (
                          <button
                            onClick={() => handleDownloadVideo(video)}
                            className="px-4 py-2 bg-[#002868] text-white hover:bg-blue-700 rounded text-sm flex items-center"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download
                          </button>
                        )}
                        {video.status === 'processing' && (
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">
                            Processing...
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {completedVideos.length > 0 && (
                  <div className="mt-4 text-sm text-green-600">
                    <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {completedVideos.length} video{completedVideos.length > 1 ? 's' : ''} ready for download
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                <svg className="w-12 h-12 text-yellow-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-600">No AI video attached to this order</p>
                <p className="text-sm text-gray-500 mt-1">AI videos will appear here when uploaded</p>
              </div>
            )}
          </div>

          {/* Services and Parts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-800">Services</h3>
              {services.length > 0 ? (
                <div className="bg-gray-50 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Service</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {services.map((service, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3 text-sm text-gray-900">{service.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">${service.price?.toFixed(2) || '0.00'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <p className="text-gray-500">No services listed</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-800">Parts</h3>
              {parts.length > 0 ? (
                <div className="bg-gray-50 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Part</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {parts.map((part, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3 text-sm text-gray-900">{part.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">${part.price?.toFixed(2) || '0.00'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <p className="text-gray-500">No parts listed</p>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-blue-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Order Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">${order.subtotal_amount?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax:</span>
                <span className="font-medium">${order.tax_amount?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Discount:</span>
                <span className="font-medium">-${order.discount_amount?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between border-t pt-2 mt-2">
                <span className="text-lg font-bold text-gray-800">Total:</span>
                <span className="text-lg font-bold text-blue-600">
                  ${order.total_amount?.toFixed(2) || '0.00'}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-2">Notes</h3>
              <p className="text-gray-600 whitespace-pre-wrap">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 bg-gray-50 p-4 border-t flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;