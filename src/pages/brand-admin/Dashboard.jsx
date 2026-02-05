// src/pages/brand-admin/Dashboard.jsx
import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectCurrentUser } from "../../redux/slice/userSlice";
import {
  selectAllDistricts,
  getAllDistricts,
  createDistrict,
  toggleDistrictStatus,
  selectDistrictLoading,
  selectDistrictError,
} from "../../redux/slice/districtSlice";
import { createUser, getUsersByRole } from "../../redux/slice/userSlice";
import { selectAllShops, getAllShops } from "../../redux/slice/shopSlice";
import { getAllBrands, selectBrandById } from "../../redux/slice/brandSlice";
import LogoutButton from "../../components/common/LogoutButton";

const BrandAdminDashboard = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const brand = useSelector((state) => selectBrandById(user?.brand_id)(state));
  const allDistricts = useSelector(selectAllDistricts);
  const allShops = useSelector(selectAllShops);
  const loading = useSelector(selectDistrictLoading);
  const error = useSelector(selectDistrictError);

  // Filter districts by brand_id
  const districts =
    allDistricts?.filter((district) => district.brand_id === user?.brand_id) ||
    [];

  // District creation form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [districtName, setDistrictName] = useState("");
  const [managerFirstName, setManagerFirstName] = useState("");
  const [managerLastName, setManagerLastName] = useState("");
  const [managerEmail, setManagerEmail] = useState("");
  const [managerPassword, setManagerPassword] = useState("");
  const [managerContact, setManagerContact] = useState("");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [creating, setCreating] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(null);
  const [expandedDistrict, setExpandedDistrict] = useState(null);

  useEffect(() => {
    if (user?.brand_id) {
      dispatch(getAllDistricts());
      dispatch(getAllShops({ include_inactive: true }));
      dispatch(getUsersByRole("district_manager"));
      dispatch(getAllBrands()); // Fetch brands to get brand name
    }
  }, [user?.brand_id, dispatch]);

  // Get shops for a specific district - filtered by brand
  const getShopsByDistrict = (districtId) => {
    if (!allShops || !Array.isArray(allShops)) return [];

    // Filter by both district_id AND brand_id for security
    return allShops.filter(
      (shop) =>
        shop.district_id === districtId && shop.brand_id === user?.brand_id,
    );
  };

  // Calculate total shops for the brand
  const getTotalShops = () => {
    if (!allShops || !Array.isArray(allShops)) return 0;

    // Explicitly filter by brand_id
    const brandShops = allShops.filter(
      (shop) => shop.brand_id === user?.brand_id,
    );
    return brandShops.length;
  };

  const getActiveDistrictsCount = () => {
    if (!districts || !Array.isArray(districts)) return 0;
    return districts.filter((district) => district.is_active).length;
  };

  const getInactiveDistrictsCount = () => {
    if (!districts || !Array.isArray(districts)) return 0;
    return districts.filter((district) => !district.is_active).length;
  };

  const getActiveShopsCount = () => {
    if (!allShops || !Array.isArray(allShops)) return 0;
    return allShops.filter(
      (shop) => shop.brand_id === user?.brand_id && shop.is_active,
    ).length;
  };

  const getInactiveShopsCount = () => {
    if (!allShops || !Array.isArray(allShops)) return 0;
    return allShops.filter(
      (shop) => shop.brand_id === user?.brand_id && !shop.is_active,
    ).length;
  };

  const toggleDistrictDetails = (districtId) => {
    setExpandedDistrict(expandedDistrict === districtId ? null : districtId);
  };

  const handleCreateDistrictAndManager = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    setCreating(true);

    try {
      // Step 1: Create District
      const districtData = {
        name: districtName,
        brand_id: user?.brand_id,
        is_active: true,
      };

      const districtResult = await dispatch(
        createDistrict(districtData),
      ).unwrap();

      if (districtResult.success) {
        const districtId = districtResult.data.id;

        // Step 2: Create District Manager
        const managerData = {
          first_name: managerFirstName,
          last_name: managerLastName,
          email: managerEmail,
          password: managerPassword,
          contact_no: managerContact,
          role: "district_manager",
          brand_id: user?.brand_id,
          district_id: districtId,
          is_active: true,
        };

        const managerResult = await dispatch(createUser(managerData)).unwrap();

        if (managerResult.success) {
          setFormSuccess("District and Manager created successfully!");

          // Reset form
          setDistrictName("");
          setManagerFirstName("");
          setManagerLastName("");
          setManagerEmail("");
          setManagerPassword("");
          setManagerContact("");

          // Refresh data
          dispatch(getAllDistricts());
          dispatch(getAllShops({ include_inactive: true }));
          dispatch(getUsersByRole("district_manager"));
          dispatch(getAllBrands()); // Refresh brands

          // Hide form after 2 seconds
          setTimeout(() => {
            setShowCreateForm(false);
          }, 2000);
        }
      }
    } catch (err) {
      setFormError(
        err?.error ||
          "Failed to create district and manager. Please try again.",
      );
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async (districtId) => {
    setTogglingStatus(districtId);
    try {
      const result = await dispatch(toggleDistrictStatus(districtId)).unwrap();
      if (result.success) {
        dispatch(getAllDistricts());
      }
    } catch (err) {
      console.error("Failed to toggle district status:", err);
    } finally {
      setTogglingStatus(null);
    }
  };

  // Get brand name from user or brand object
  const getBrandName = () => {
    if (brand?.name) return brand.name;
    if (user?.brand_name) return user.brand_name;
    return "Your Brand";
  };

  // Show loading state while user data is being fetched
  if (!user || !user.brand_id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 shadow">
        <div className="container mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Brand Admin Dashboard</h1>
            <p className="text-blue-100">{getBrandName()}</p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="bg-red-500 px-3 py-1 rounded-full text-sm">
              Brand Admin
            </span>
            <span className="hidden md:inline">{user?.email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-4 md:p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm text-gray-500">Total Districts</h3>
            <p className="text-2xl font-bold text-blue-600">
              {districts.length}
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm text-gray-500">Active Districts</h3>
            <p className="text-2xl font-bold text-green-600">
              {getActiveDistrictsCount()}
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm text-gray-500">Inactive Districts</h3>
            <p className="text-2xl font-bold text-red-600">
              {getInactiveDistrictsCount()}
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm text-gray-500">Total Shops</h3>
            <p className="text-2xl font-bold text-purple-600">
              {getTotalShops()}
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm text-gray-500">Active Shops</h3>
            <p className="text-2xl font-bold text-green-600">
              {getActiveShopsCount()}
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm text-gray-500">Inactive Shops</h3>
            <p className="text-2xl font-bold text-red-600">
              {getInactiveShopsCount()}
            </p>
          </div>
        </div>

        {/* Manage Districts Section */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">
                Districts Management
              </h2>
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                {showCreateForm ? "Cancel" : "+ New District"}
              </button>
            </div>
          </div>

          {/* Create District Form */}
          {showCreateForm && (
            <div className="px-6 py-4 border-b bg-blue-50">
              <h3 className="font-semibold text-blue-700 mb-3">
                Create New District with Manager
              </h3>

              {formError && (
                <div className="mb-3 p-2 bg-red-50 text-red-600 rounded-lg text-sm">
                  {formError}
                </div>
              )}

              {formSuccess && (
                <div className="mb-3 p-2 bg-green-50 text-green-600 rounded-lg text-sm">
                  {formSuccess}
                </div>
              )}

              <form onSubmit={handleCreateDistrictAndManager}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* District Section */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-700 border-b pb-2">
                      District Details
                    </h4>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        District Name *
                      </label>
                      <input
                        type="text"
                        value={districtName}
                        onChange={(e) => setDistrictName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter district name"
                        required
                      />
                    </div>
                  </div>

                  {/* Manager Section */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-700 border-b pb-2">
                      Manager Details
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          First Name *
                        </label>
                        <input
                          type="text"
                          value={managerFirstName}
                          onChange={(e) => setManagerFirstName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="First name"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Last Name *
                        </label>
                        <input
                          type="text"
                          value={managerLastName}
                          onChange={(e) => setManagerLastName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Last name"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={managerEmail}
                        onChange={(e) => setManagerEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="manager@example.com"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        Password *
                        <span className="text-gray-400 text-xs ml-1">
                          (min. 6 characters)
                        </span>
                      </label>
                      <input
                        type="password"
                        value={managerPassword}
                        onChange={(e) => setManagerPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter password"
                        required
                        minLength="6"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contact Number
                      </label>
                      <input
                        type="tel"
                        value={managerContact}
                        onChange={(e) => setManagerContact(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="+1234567890"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    type="submit"
                    disabled={creating}
                    className={`px-6 py-2 rounded-lg font-medium ${
                      creating
                        ? "bg-blue-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700"
                    } text-white transition`}
                  >
                    {creating ? "Creating..." : "Create District & Manager"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Districts List */}
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading districts...</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <p className="text-red-600">Error loading districts</p>
            </div>
          ) : districts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      District Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Shops
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {districts.map((district) => {
                    const districtShops = getShopsByDistrict(district.id);
                    const isExpanded = expandedDistrict === district.id;

                    return (
                      <React.Fragment key={district.id}>
                        <tr className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">
                              {district.name}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm">
                              {districtShops.length === 0 ? (
                                <span className="text-gray-500">No shops</span>
                              ) : (
                                <div className="space-y-1">
                                  <div className="font-medium text-gray-700">
                                    Total: {districtShops.length}
                                    <span className="ml-2 text-xs">
                                      (
                                      {
                                        districtShops.filter((s) => s.is_active)
                                          .length
                                      }{" "}
                                      active /
                                      {
                                        districtShops.filter(
                                          (s) => !s.is_active,
                                        ).length
                                      }{" "}
                                      inactive)
                                    </span>
                                  </div>
                                  {districtShops.slice(0, 3).map((shop) => (
                                    <div
                                      key={shop.id}
                                      className="flex items-center text-xs"
                                    >
                                      <div
                                        className={`w-2 h-2 rounded-full mr-2 ${shop.is_active ? "bg-green-500" : "bg-red-500"}`}
                                      ></div>
                                      <span
                                        className={
                                          shop.is_active
                                            ? "text-gray-800"
                                            : "text-gray-500"
                                        }
                                      >
                                        {shop.name}
                                      </span>
                                    </div>
                                  ))}
                                  {districtShops.length > 3 && (
                                    <button
                                      onClick={() =>
                                        toggleDistrictDetails(district.id)
                                      }
                                      className="text-xs text-blue-600 hover:text-blue-800"
                                    >
                                      {isExpanded
                                        ? "Show less"
                                        : `+${districtShops.length - 3} more shops`}
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                district.is_active
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {district.is_active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {new Date(district.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 space-x-2">
                            <button
                              onClick={() => handleToggleStatus(district.id)}
                              disabled={togglingStatus === district.id}
                              className={`px-3 py-1 rounded text-sm ${
                                district.is_active
                                  ? "bg-red-100 text-red-700 hover:bg-red-200"
                                  : "bg-green-100 text-green-700 hover:bg-green-200"
                              } ${togglingStatus === district.id ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                              {togglingStatus === district.id ? (
                                <span className="flex items-center">
                                  <svg
                                    className="animate-spin h-4 w-4 mr-1"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                  >
                                    <circle
                                      className="opacity-25"
                                      cx="12"
                                      cy="12"
                                      r="10"
                                      stroke="currentColor"
                                      strokeWidth="4"
                                    ></circle>
                                    <path
                                      className="opacity-75"
                                      fill="currentColor"
                                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                  </svg>
                                </span>
                              ) : district.is_active ? (
                                "Deactivate"
                              ) : (
                                "Activate"
                              )}
                            </button>
                            {districtShops.length > 0 && (
                              <button
                                onClick={() =>
                                  toggleDistrictDetails(district.id)
                                }
                                className="px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded text-sm"
                              >
                                {isExpanded ? "Hide Shops" : "View Shops"}
                              </button>
                            )}
                          </td>
                        </tr>

                        {/* Expanded view for district shops */}
                        {isExpanded && districtShops.length > 0 && (
                          <tr>
                            <td colSpan="5" className="px-6 py-4 bg-gray-50">
                              <div className="ml-4">
                                <h4 className="font-semibold text-gray-700 mb-2">
                                  All Shops in {district.name}
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {districtShops.map((shop) => (
                                    <div
                                      key={shop.id}
                                      className="bg-white p-3 rounded-lg shadow-sm border"
                                    >
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <div className="font-medium text-gray-800">
                                            {shop.name}
                                          </div>
                                          <div className="text-sm text-gray-600">
                                            {shop.city && (
                                              <span>{shop.city}, </span>
                                            )}
                                            {shop.state && (
                                              <span>{shop.state}</span>
                                            )}
                                          </div>
                                        </div>
                                        <div
                                          className={`px-2 py-1 text-xs rounded-full ${
                                            shop.is_active
                                              ? "bg-green-100 text-green-800"
                                              : "bg-red-100 text-red-800"
                                          }`}
                                        >
                                          {shop.is_active
                                            ? "Active"
                                            : "Inactive"}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
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
            <div className="p-8 text-center">
              <div className="text-gray-400 mb-2">
                <svg
                  className="w-12 h-12 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Districts Yet
              </h3>
              <p className="text-gray-500 mb-4">
                Create your first district to get started
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                Create First District
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default BrandAdminDashboard;
