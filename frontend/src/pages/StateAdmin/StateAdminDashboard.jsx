import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axiosInstance from '../../middleware/axiosInstance';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaBuilding, FaFileAlt, FaCheck, FaTimes, FaSpinner, FaEye, FaKey, FaSearch, FaFilter } from 'react-icons/fa';

const StateAdminDashboard = () => {
  const { user, logout } = useAuth();  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [spios, setSpios] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('requests');
  const [showAddSpioForm, setShowAddSpioForm] = useState(false);
  const [newSpio, setNewSpio] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    address: '',
    district_id: ''
  });
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [requestLogs, setRequestLogs] = useState([]);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedSpio, setSelectedSpio] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    fetchDistricts();
    if (activeTab === 'requests') {
      fetchRequests();
    } else {
      fetchSpios();
    }
  }, [activeTab]);

  const fetchRequests = async () => {
    try {
      const response = await axiosInstance.get('/api/state/all-requests');
      setRequests(response.data);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchSpios = async () => {
    try {
      const response = await axiosInstance.get('/api/admin/all-spios');
      setSpios(response.data);
    } catch (error) {
      console.error('Error fetching SPIOs:', error);
      toast.error('Failed to fetch SPIOs');
    } finally {
      setLoading(false);
    }
  };

  const fetchDistricts = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/admin/districts');
      console.log('Districts response:', response.data);
      if (response.data) {
        setDistricts(response.data);
      }
    } catch (error) {
      console.error('Error fetching districts:', error);
      toast.error(error.response?.data?.error || 'Failed to fetch districts');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSpio = async (e) => {
    e.preventDefault();
    try {
      const response = await axiosInstance.post('/api/admin/spio', {
        ...newSpio,
        district_code: districts.find(d => d.district_id === parseInt(newSpio.district_id))?.district_code
      });
      toast.success('SPIO added successfully');
      setShowAddSpioForm(false);
      setNewSpio({
        name: '',
        email: '',
        phone: '',
        password: '',
        address: '',
        district_id: ''
      });
      fetchSpios();
    } catch (error) {
      console.error('Error adding SPIO:', error);
      toast.error(error.response?.data?.error || 'Failed to add SPIO');
    }
  };

  const fetchRequestDetails = async (requestId) => {
    try {
      const response = await axiosInstance.get(`/api/state/request/${requestId}`);
      setSelectedRequest(response.data);
      
      // Fetch logs for this request
      const logsResponse = await axiosInstance.get(`/api/state/request/${requestId}/logs`);
      setRequestLogs(logsResponse.data);
      
      setShowModal(true);
    } catch (error) {
      console.error('Error fetching request details:', error);
    }
  };

  const getLogIcon = (actionType) => {
    switch (actionType) {
      case 'STATUS_CHANGE':
        return <FaSpinner className="text-blue-500" />;
      case 'ASSIGNMENT':
        return <FaUser className="text-purple-500" />;
      case 'REMARK_ADDED':
        return <FaFileAlt className="text-green-500" />;
      case 'FORWARD':
        return <FaBuilding className="text-orange-500" />;
      default:
        return <FaFileAlt className="text-gray-500" />;
    }
  };

  const getLogColor = (actionType) => {
    switch (actionType) {
      case 'STATUS_CHANGE':
        return 'bg-blue-50 border-blue-200';
      case 'ASSIGNMENT':
        return 'bg-purple-50 border-purple-200';
      case 'REMARK_ADDED':
        return 'bg-green-50 border-green-200';
      case 'FORWARD':
        return 'bg-orange-50 border-orange-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const handleResetPassword = async (spio) => {
    setSelectedSpio(spio);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setShowPasswordModal(true);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');

    // Validate passwords
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    try {
      setIsResetting(true);
      await axiosInstance.put(`/api/state/spio/${selectedSpio.id}/reset-password`, {
        new_password: newPassword,
        reactivate: true
      });
      
      toast.success('Password reset and account reactivated successfully');
      setShowPasswordModal(false);
      fetchSpios();
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error(error.response?.data?.error || 'Failed to reset password');
    } finally {
      setIsResetting(false);
    }
  };

  // Filter and search requests
  const filteredRequests = requests.filter(request => {
    const matchesSearch = searchQuery === '' || 
      request.id.toString().includes(searchQuery) ||
      request.subject.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesDepartment = departmentFilter === 'all' || request.department === departmentFilter;

    return matchesSearch && matchesStatus && matchesDepartment;
  });

  // Get unique departments for filter
  const uniqueDepartments = [...new Set(requests.map(req => req.department))].sort();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* AppBar */}
      <div className="bg-white shadow">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-3xl font-semibold text-gray-800">{'RTI Portal'}</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{'State Admin'}</p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800"
              >
                {'Logout'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">{'Assam State Admin Dashboard'}</h1>
        
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('requests')}
                className={`${
                  activeTab === 'requests'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                {'All Requests'}
              </button>
              <button
                onClick={() => setActiveTab('spios')}
                className={`${
                  activeTab === 'spios'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                {'SPIOs'}
              </button>
            </nav>
          </div>
        </div>

        {activeTab === 'requests' ? (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{'All Requests'}</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-500 rounded-md hover:bg-gray-50"
                >
                  <FaFilter /> Filters
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="mb-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by Request ID or Subject..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-500 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-200 rounded-lg mb-4">
                <div>
                  <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    id="statusFilter"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value="all">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Processing">Processing</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="departmentFilter" className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <select
                    id="departmentFilter"
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value="all">All Departments</option>
                    {uniqueDepartments.map(dept => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {filteredRequests.length === 0 ? (
              <p className="text-gray-500">{'No requests found'}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {'Request ID'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {'Subject'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {'Department'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {'Status'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {'Date'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {'Actions'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRequests.map((request) => (
                      <tr key={request.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {request.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {request.subject}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {request.department}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            request.status === 'Approved' ? 'bg-green-100 text-green-800' :
                            request.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                            request.status === 'Processing' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {request.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {request.date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <button
                            onClick={() => fetchRequestDetails(request.id)}
                            className="text-indigo-600 hover:text-indigo-900 flex items-center gap-1"
                          >
                            <FaEye /> View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">{'SPIO List'}</h2>
              <button
                onClick={() => setShowAddSpioForm(true)}
                className="bg-black text-white px-4 py-2 rounded-md hover:bg-primary-700"
              >
                {'Add New SPIO'}
              </button>
            </div>

            {showAddSpioForm && (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                  <div className="mt-3">
                    <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">{'Add New SPIO'}</h3>
                    <form onSubmit={handleAddSpio}>
                      <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                          {'Name'}
                        </label>
                        <input
                          type="text"
                          required
                          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                          value={newSpio.name}
                          onChange={(e) => setNewSpio({ ...newSpio, name: e.target.value })}
                        />
                      </div>
                      <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                          {'Email'}
                        </label>
                        <input
                          type="email"
                          required
                          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                          value={newSpio.email}
                          onChange={(e) => setNewSpio({ ...newSpio, email: e.target.value })}
                        />
                      </div>
                      <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                          {'Phone'}
                        </label>
                        <input
                          type="tel"
                          required
                          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                          value={newSpio.phone}
                          onChange={(e) => setNewSpio({ ...newSpio, phone: e.target.value })}
                        />
                      </div>
                      <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                          {'Password'}
                        </label>
                        <input
                          type="password"
                          required
                          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                          value={newSpio.password}
                          onChange={(e) => setNewSpio({ ...newSpio, password: e.target.value })}
                        />
                      </div>
                      <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                          {'Address'}
                        </label>
                        <textarea
                          required
                          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                          value={newSpio.address}
                          onChange={(e) => setNewSpio({ ...newSpio, address: e.target.value })}
                        />
                      </div>
                      <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                          {'District'}
                        </label>
                        <select
                          required
                          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                          value={newSpio.district_id}
                          onChange={(e) => setNewSpio({ ...newSpio, district_id: e.target.value })}
                        >
                          <option value="">{'Select District'}</option>
                          {districts && districts.length > 0 ? (
                            districts
                              .filter(district => district.state_name === 'ASSAM')
                              .map((district) => (
                                <option key={district.district_id} value={district.district_id}>
                                  ({district.district_id}) {district.district_name}
                                </option>
                              ))
                          ) : (
                            <option value="" disabled>{'No districts available'}</option>
                          )}
                        </select>
                      </div>
                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => setShowAddSpioForm(false)}
                          className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                        >
                          {'Cancel'}
                        </button>
                        <button
                          type="submit"
                          className="bg-black text-white px-4 py-2 rounded-md hover:bg-primary-700"
                        >
                          {'Add SPIO'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}
            
            {spios.length === 0 ? (
              <p className="text-gray-500">{'No SPIOs found'}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {'Name'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {'Email'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {'Phone'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {'District'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {'Actions'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {spios.map((spio) => (
                      <tr key={spio.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {spio.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {spio.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {spio.phone}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {districts.find(d => d.district_code === spio.district_code)?.district_name || spio.district_code}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <button
                            onClick={() => handleResetPassword(spio)}
                            className="text-indigo-600 hover:text-indigo-900 flex items-center gap-1"
                          >
                            <FaKey /> Reset Password
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Request Details Modal */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Request Details</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Request Information */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <h4 className="font-medium text-gray-700">Request Information</h4>
                <div className="mt-2 space-y-2">
                  <p><span className="font-medium">ID:</span> {selectedRequest.id}</p>
                  <p><span className="font-medium">Subject:</span> {selectedRequest.subject}</p>
                  <p><span className="font-medium">Status:</span> {selectedRequest.status}</p>
                  <p><span className="font-medium">Date:</span> {selectedRequest.date}</p>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-700">Department Information</h4>
                <div className="mt-2 space-y-2">
                  <p><span className="font-medium">Department:</span> {selectedRequest.department}</p>
                  <p><span className="font-medium">Department Code:</span> {selectedRequest.department_code}</p>
                </div>
              </div>
            </div>

            {/* Citizen Information */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-700 mb-2">Citizen Information</h4>
              <div className="bg-gray-50 p-4 rounded-md">
                <p><span className="font-medium">Name:</span> {selectedRequest.citizen?.name}</p>
                <p><span className="font-medium">Email:</span> {selectedRequest.citizen?.email}</p>
                <p><span className="font-medium">Phone:</span> {selectedRequest.citizen?.phone}</p>
              </div>
            </div>

            {/* Request Timeline */}
            <div>
              <h4 className="font-medium text-gray-700 mb-4">Request Timeline</h4>
              <div className="space-y-4">
                {requestLogs.map((log, index) => (
                  <div key={log.id} className={`flex items-start p-4 rounded-lg border ${getLogColor(log.action_type)}`}>
                    <div className="flex-shrink-0 mt-1">
                      {getLogIcon(log.action_type)}
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">
                          {log.action_type.replace(/_/g, ' ')}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(log.created_at).toLocaleString()}
                        </p>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">
                        {log.remarks}
                      </p>
                      {log.new_value && (
                        <p className="mt-1 text-sm text-gray-600">
                          <span className="font-medium">Details:</span> {log.new_value}
                        </p>
                      )}
                      {log.actor && (
                        <p className="mt-1 text-sm text-gray-600">
                          <span className="font-medium">By:</span> {log.actor.name}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordModal && selectedSpio && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Reset Password for {selectedSpio.name}</h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                />
              </div>

              {passwordError && (
                <p className="text-sm text-red-600">{passwordError}</p>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResetting}
                  className={`px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 ${
                    isResetting ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isResetting ? (
                    <span className="flex items-center">
                      <FaSpinner className="animate-spin mr-2" />
                      Resetting...
                    </span>
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StateAdminDashboard; 