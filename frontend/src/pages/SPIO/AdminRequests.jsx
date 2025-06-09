import { useState, useEffect } from "react";
import AdminDashboardLayout from "./AdminDashboardLayout";
import { toast } from "react-hot-toast";
import {
  DocumentTextIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import axiosInstance from "../../middleware/axiosInstance";
import { FaUser, FaBuilding, FaFileAlt, FaCheck, FaTimes, FaSpinner, FaEye } from 'react-icons/fa';

const AdminRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [actionLoading, setActionLoading] = useState({
    forward: new Set(),
    download: new Set(),
    assign: new Set(),
  });
  const [assistants, setAssistants] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAssistant, setSelectedAssistant] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [requestLogs, setRequestLogs] = useState([]);

  // Filter states
  const [filters, setFilters] = useState({
    status: "",
    startDate: "",
    endDate: "",
    department: "",
    assignedTo: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [departments, setDepartments] = useState([]);

  // Helper for badge colors
  const getStatusColor = (status) => {
    switch ((status || "").toLowerCase()) {
      case "approved":
        return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20";
      case "rejected":
        return "bg-rose-50 text-rose-700 ring-1 ring-rose-600/20";
      case "processing":
        return "bg-blue-50 text-blue-700 ring-1 ring-blue-600/20";
      default: // pending
        return "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20";
    }
  };

  const getAssignmentStatus = (request) => {
    if (!request.assigned_to) return null;
    const status = request.assistant_remarks ? 
      "Reviewed" : 
      "Pending";
    console.log('Status determined:', status);
    return status;
  };

  // Helper for status badges
  const StatusBadge = ({ status }) => (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusColor(status)}`}>
      {status}
    </span>
  );

  const AssignmentBadge = ({ request }) => {
    console.log('AssignmentBadge request:', request);
    const status = getAssignmentStatus(request);
    if (!status) return null;
    
    return (
      <span className={
        "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium " + 
        (request.assistant_remarks ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800')
      }>
        {status}
      </span>
    );
  };

  const AssistantName = ({ request }) => {
    if (!request.assigned_to) return null;
    return (
      <span className="text-sm text-gray-900">
        {request.assigned_to.name}
      </span>
    );
  };

  useEffect(() => {
    fetchRequests();
    fetchDepartments();
    fetchAssistants();
  }, []);

  const fetchAssistants = async () => {
    try {
      const response = await axiosInstance.get('/api/spio/assistants');
      setAssistants(response.data);
    } catch (err) {
      console.error("Failed to fetch assistants:", err);
      toast.error("Failed to fetch assistants");
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await axiosInstance.get("/api/spio/departments");
      setDepartments(response.data);
    } catch (err) {
      console.error("Failed to fetch departments:", err);
    }
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/api/spio/all-requests");
      console.log('Backend response:', response.data);
      setRequests(response.data);
    } catch (err) {
      toast.error("Failed to fetch requests. Please try again.");
      console.error("Failed to fetch requests:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequestDetails = async (requestId) => {
    try {
      const response = await axiosInstance.get(`/api/spio/request/${requestId}`);
      setSelectedRequest(response.data);
      
      // Fetch logs for this request
      const logsResponse = await axiosInstance.get(`/api/spio/request/${requestId}/logs`);
      setRequestLogs(logsResponse.data);
      
      setShowModal(true);
    } catch (error) {
      console.error('Error fetching request details:', error);
    }
  };

  const handleViewRequest = async (requestId) => {
    try {
      await fetchRequestDetails(requestId);
    } catch (err) {
      toast.error("Failed to fetch request details. Please try again.");
      console.error("Failed to fetch request details:", err);
    }
  };

  const handleAssignRequest = async (requestId) => {
    if (!selectedAssistant) {
      toast.error("Please select an assistant");
      return;
    }

    try {
      setActionLoading(prev => ({
        ...prev,
        assign: new Set([...prev.assign, requestId])
      }));

      await axiosInstance.post(`/api/spio/request/${requestId}/assign`, {
        assistant_id: selectedAssistant,
        remarks: '' // Add empty remarks for now
      });

      await fetchRequests();
      setShowAssignModal(false);
      setSelectedAssistant('');
      toast.success("Request assigned successfully");
    } catch (err) {
      toast.error("Failed to assign request");
      console.error("Failed to assign request:", err);
    } finally {
      setActionLoading(prev => ({
        ...prev,
        assign: new Set([...prev.assign].filter(id => id !== requestId))
      }));
    }
  };

  const handleForwardRequest = async (requestId) => {
    try {
      setLoadingState('forward', requestId, true);
      await axiosInstance.put(`/api/spio/request/${requestId}/forward`);
      await fetchRequests();
      toast.success("Request forwarded successfully");
      if (selectedRequest?.id === requestId) {
        setIsModalOpen(false);
      }
    } catch (err) {
      toast.error("Failed to forward request. Please try again.");
      console.error("Failed to forward request:", err);
    } finally {
      setLoadingState('forward', requestId, false);
    }
  };

  const handleDownloadAttachment = async (requestId, fileName) => {
    try {
      setLoadingState('download', requestId, true);
      const response = await axiosInstance.get(
        `/api/spio/request/${requestId}/attachment`,
        { responseType: "blob" }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("File downloaded successfully");
    } catch (err) {
      toast.error("Failed to download attachment. Please try again.");
      console.error("Failed to download attachment:", err);
    } finally {
      setLoadingState('download', requestId, false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const filteredRequests = requests.filter((request) => {
    // Status filter
    if (filters.status && (request.status || "").toLowerCase() !== filters.status.toLowerCase()) {
      return false;
    }
    
    // Department filter - compare department codes
    if (filters.department && request.department_code !== filters.department) {
      return false;
    }

    // Date filters - convert strings to Date objects for comparison
    if (filters.startDate) {
      const requestDate = new Date(request.created_at);
      const startDate = new Date(filters.startDate);
      startDate.setHours(0, 0, 0, 0);
      if (requestDate < startDate) return false;
    }

    if (filters.endDate) {
      const requestDate = new Date(request.created_at);
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      if (requestDate > endDate) return false;
    }

    // Search functionality
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const searchFields = [
        request.subject,
        request.department,
        request.id?.toString(),
        request.file_name,
        request.citizen?.name
      ];
      return searchFields.some(field => 
        (field || "").toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

  const setLoadingState = (action, id, isLoading) => {
    setActionLoading(prev => {
      const newSet = new Set(prev[action]);
      if (isLoading) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return { ...prev, [action]: newSet };
    });
  };

  const isActionLoading = (action, id) => {
    return actionLoading[action].has(id);
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

  return (
    <AdminDashboardLayout>
      <div className="space-y-6">
        {/* Header section */}
        <div className="sm:flex sm:items-center sm:justify-between">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            All Requests
          </h2>

          {/* Search and Filter Bar */}
          <div className="mt-4 sm:mt-0 sm:flex sm:items-center sm:space-x-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -mt-2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search requests..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-black focus:border-black"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <FunnelIcon className="h-5 w-5 mr-2" />
              Filters
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
                >
                  <option value="">All</option>
                  <option value="Pending">Pending</option>
                  <option value="Processing">Processing</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Department</label>
                <select
                  name="department"
                  value={filters.department}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
                >
                  <option value="">All</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name_en}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Assigned To</label>
                <select
                  name="assignedTo"
                  value={filters.assignedTo}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
                >
                  <option value="">All</option>
                  {assistants.map((assistant) => (
                    <option key={assistant.id} value={assistant.id}>
                      {assistant.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Request Table */}
        <div className="bg-white shadow-lg rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">ID</th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Subject</th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Department</th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Assignment</th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Date</th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-4">
                      <ArrowPathIcon className="animate-spin h-6 w-6 mx-auto" />
                    </td>
                  </tr>
                ) : filteredRequests.length > 0 ? (
                  filteredRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-3 py-4 text-sm text-gray-900">
                        {request.id}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        {request.subject}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        {request.department}
                      </td>
                      <td className="px-3 py-4 text-sm">
                        <StatusBadge status={request.status} />
                      </td>
                      <td className="px-3 py-4 text-sm">
                        <div className="flex flex-col gap-1">
                          <AssistantName request={request} />
                          <AssignmentBadge request={request} />
                        </div>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        {request.date}
                      </td>
                      <td className="px-3 py-4 text-sm">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewRequest(request.id)}
                            className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-white rounded-md border border-gray-200 hover:bg-gray-50"
                          >
                            View
                          </button>
                          
                          <button
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowAssignModal(true);
                            }}
                            disabled={!!request.assigned_to || isActionLoading('assign', request.id)}
                            className={`inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-white rounded-md border border-gray-200 hover:bg-gray-50 ${
                              (!!request.assigned_to || isActionLoading('assign', request.id)) ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            {isActionLoading('assign', request.id) ? (
                              <ArrowPathIcon className="animate-spin h-4 w-4 mr-1" />
                            ) : null}
                            Assign
                          </button>

                          {request.status === "Pending" && (
                            <button
                              onClick={() => handleForwardRequest(request.id)}
                              disabled={isActionLoading('forward', request.id)}
                              className={`inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-white rounded-md border border-gray-200 hover:bg-gray-50 ${
                                isActionLoading('forward', request.id) ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                            >
                              {isActionLoading('forward', request.id) ? (
                                <ArrowPathIcon className="animate-spin h-4 w-4 mr-1" />
                              ) : null}
                              Forward
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-3 py-4 text-sm text-gray-500 text-center">
                      No requests found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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
                    <p><span className="font-medium">Department:</span> {selectedRequest.department?.name_en}</p>
                    <p><span className="font-medium">Department Code:</span> {selectedRequest.department?.code}</p>
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

        {/* Assign Request Modal */}
        {showAssignModal && selectedRequest && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-lg w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Assign Request</h3>
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedAssistant('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Select Assistant</h4>
                  <select
                    value={selectedAssistant}
                    onChange={(e) => setSelectedAssistant(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
                  >
                    <option value="">Select an assistant...</option>
                    {assistants.map((assistant) => (
                      <option key={assistant.id} value={assistant.id}>
                        {assistant.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowAssignModal(false);
                      setSelectedAssistant('');
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleAssignRequest(selectedRequest.id)}
                    disabled={!selectedAssistant || isActionLoading('assign', selectedRequest.id)}
                    className="px-4 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800 disabled:opacity-50"
                  >
                    {isActionLoading('assign', selectedRequest.id) ? (
                      <ArrowPathIcon className="animate-spin h-4 w-4" />
                    ) : (
                      'Assign Request'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminRequests;
