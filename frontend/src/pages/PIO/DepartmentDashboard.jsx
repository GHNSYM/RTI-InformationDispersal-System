import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import DepartmentLayout from "./DepartmentLayout";
import { toast } from "react-hot-toast";
import {
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import axiosInstance from "../../middleware/axiosInstance";

// ViewRequestModal component with approve/reject actions
const ViewRequestModal = ({ isOpen, onClose, requestId, onActionComplete }) => {
  // State management
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [justification, setJustification] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [downloadLoading, setDownLoadLoading] = useState(false);

  useEffect(() => {
    if (isOpen && requestId) {
      fetchRequestDetails();
    } else {
      // Reset state when modal closes
      setRequest(null);
      setError(null);
      setJustification("");
      setAttachment(null);
    }
  }, [isOpen, requestId]);

  const fetchRequestDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get(
        `/api/department/request/${requestId}`
      );
      setRequest(response.data);
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Failed to fetch request details";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action) => {
    // Validation
    if (action === 'reject' && !justification.trim()) {
      toast.error("Please provide justification for rejection");
      return;
    }
    if (action === 'approve' && !attachment) {
      toast.error("Please attach the requested documents");
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      const formData = new FormData();
      
      if (action === 'reject') {
        formData.append('justification', justification.trim());
      } else {
        formData.append('document', attachment);
      }

      await axiosInstance.put(
        `/api/department/request/${requestId}/${action}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      toast.success(`Request ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
      onActionComplete();
      onClose();
    } catch (err) {
      const errorMessage = err.response?.data?.error || `Failed to ${action} request`;
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!request?.file_name) {
      toast.error("No attachment available");
      return;
    }

    try {
      setDownLoadLoading(true);
      const response = await axiosInstance.get(
        `/api/department/request/${requestId}/attachment`,
        { responseType: "blob" }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", request.file_name);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success("File downloaded successfully");
    } catch (err) {
      const errorMessage = "Failed to download attachment";
      toast.error(errorMessage);
    } finally {
      setDownLoadLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                  Request Details
                </Dialog.Title>

                {loading ? (
                  <div className="mt-4 flex justify-center">
                    <ClockIcon className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                ) : error ? (
                  <div className="mt-4 text-red-600">{error}</div>
                ) : request ? (
                  <div className="mt-6 space-y-4">
                    {/* Basic Info */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-medium text-gray-500">Status</p>
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ${
                            getStatusColor(
                              request.status
                            )}
                          }`}
                        >
                          {request.status}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">ID</p>
                        <p className="mt-1 text-sm text-gray-900 break-all">{request.id}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Subject</p>
                        <p className="mt-1 text-sm text-gray-900">{request.subject}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Description</p>
                        <p className="mt-1 text-sm text-gray-900">{request.description}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Department</p>
                        <p className="mt-1 text-sm text-gray-900">{request.department.name_en}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Submission Date</p>
                        <p className="mt-1 text-sm text-gray-900">{new Date(request.date).toLocaleDateString()}</p>
                      </div>
                    </div>

                    {/* User Info */}
                    <div className="pt-4 border-t border-gray-200">
                      <h4 className="text-base font-semibold leading-6 text-gray-900">Citizen Information</h4>
                      <div className="mt-2 space-y-2 text-gray-700">
                        <p className="text-sm"><span className="font-medium text-gray-900">Name:</span> {request.citizen.name}</p>
                        <p className="text-sm"><span className="font-medium text-gray-900">Email:</span> {request.citizen.email}</p>
                        <p className="text-sm"><span className="font-medium text-gray-900">Phone:</span> {request.citizen.phone}</p>
                      </div>
                    </div>

                    {/* Original Attachment */}
                    {request.hasAttachment && (
                      <div className="pt-4 border-t border-gray-200">
                        <h4 className="text-base font-semibold leading-6 text-gray-900">Original Attachment</h4>
                        <button
                          onClick={handleDownload}
                          disabled={downloadLoading}
                          className="mt-2 inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50"
                        >
                          {downloadLoading ? (
                            <ClockIcon className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                             <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                          )}
                          Download {request.file_name}
                        </button>
                      </div>
                    )}

                    {/* Action Buttons for processing status */}
                    {request.status === 'Processing' && (
                      <div className="mt-6 pt-4 border-t border-gray-200 space-y-6">
                        <h4 className="text-base font-semibold leading-6 text-gray-900">Department Action</h4>
                        <div className="space-y-4">
                          {/* File upload for approval */}
                          <div>
                            <label htmlFor="document-upload" className="block text-sm font-medium text-gray-700">
                              Upload Documents (Required for Approval)
                            </label>
                            <div className="mt-1 flex items-center">
                                <label htmlFor="document-upload" className="mr-4 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer">
                                    Choose File
                                    <input id="document-upload" name="document-upload" type="file" className="sr-only" onChange={(e) => setAttachment(e.target.files[0])}/>
                                </label>
                                <span className="text-sm text-gray-500">{attachment ? attachment.name : 'No file chosen'}</span>
                            </div>
                          </div>

                          {/* Justification for rejection */}
                          <div>
                            <label htmlFor="rejection-justification" className="block text-sm font-medium text-gray-700">
                              Rejection Justification
                            </label>
                            <textarea
                              id="rejection-justification"
                              rows={3}
                              value={justification}
                              onChange={(e) => setJustification(e.target.value)}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              placeholder="Required if rejecting the request"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                ) : null}
                {/* Action buttons for processing status */} 
                {request?.status === 'Processing' && (
                    <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                        <button
                            onClick={() => handleAction('approve')}
                            disabled={actionLoading || !attachment}
                            className="inline-flex w-full justify-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 disabled:opacity-50 disabled:cursor-not-allowed sm:col-start-2"
                        >
                            {actionLoading ? 'Processing...' : 'Approve Request'}
                        </button>
                        <button
                            onClick={() => handleAction('reject')}
                            disabled={actionLoading || !justification.trim()}
                            className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50 disabled:cursor-not-allowed sm:col-start-1"
                        >
                            {actionLoading ? 'Processing...' : 'Reject Request'}
                        </button>
                    </div>
                )}
                 {/* Close button always visible */} 
                <div className="mt-5 sm:mt-6">
                    <button
                        type="button"
                        className="inline-flex w-full justify-center rounded-md bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
                        onClick={onClose}
                    >
                        Close
                    </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

const DepartmentDashboard = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [actionLoading, setActionLoading] = useState({
    forward: new Set(),
    download: new Set(),
  });
  const [stats, setStats] = useState({
    processingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
    pendingRequests: 0
  });
  const [departmentName, setDepartmentName] = useState('');

  // Filter states
  const [filters, setFilters] = useState({
    status: "",
    startDate: "",
    endDate: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "date",
    direction: "desc",
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [requestsResponse, departmentResponse, statsResponse] = await Promise.all([
        axiosInstance.get("/api/department/requests"),
        axiosInstance.get("/api/department/info"),
        axiosInstance.get("/api/department/stats")
      ]);
      
      setRequests(requestsResponse.data);
      setDepartmentName(departmentResponse.data.name_en);
      setStats(statsResponse.data);
    } catch (err) {
      toast.error("Failed to fetch dashboard data");
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedRequests = () => {
    let result = [...requests];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(request => 
        request.subject.toLowerCase().includes(query) ||
        request.id.toString().includes(query) ||
        request.status.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (filters.status) {
      result = result.filter(request => request.status === filters.status);
    }

    // Apply date filters
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      result = result.filter(request => new Date(request.date) >= startDate);
    }
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999); // End of the day
      result = result.filter(request => new Date(request.date) <= endDate);
    }

    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        if (sortConfig.key === 'date') {
          return sortConfig.direction === 'asc' 
            ? new Date(a.date) - new Date(b.date)
            : new Date(b.date) - new Date(a.date);
        }
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  return (
    <DepartmentLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Department Header */}
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{departmentName}</h1>
                <p className="mt-2 text-sm text-gray-600">Welcome to your department dashboard</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Processing"
              value={stats.processingRequests}
              icon={ClockIcon}
              color="amber"
              description="Active requests"
            />
            <StatCard
              title="Approved"
              value={stats.approvedRequests}
              icon={CheckCircleIcon}
              color="emerald"
              description="Successfully processed"
            />
            <StatCard
              title="Rejected"
              value={stats.rejectedRequests}
              icon={XCircleIcon}
              color="red"
              description="Declined requests"
            />
            <StatCard
              title="Pending"
              value={stats.pendingRequests}
              icon={DocumentTextIcon}
              color="blue"
              description="Awaiting action"
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {/* Search and Filters Section */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="relative flex-1 max-w-lg">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search requests by ID, subject, or status..."
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200"
                  />
                </div>
                {showFilters && (
                  <div className="flex flex-col sm:flex-row gap-4">
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                      className="block w-full sm:w-40 pl-3 pr-10 py-2.5 text-base border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200"
                    >
                      <option value="">All Status</option>
                      <option value="processing">Processing</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                    <div className="flex gap-4">
                      <input
                        type="date"
                        value={filters.startDate}
                        onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                        className="block w-full sm:w-40 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200"
                      />
                      <input
                        type="date"
                        value={filters.endDate}
                        onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                        className="block w-full sm:w-40 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Requests Table */}
            <div className="mt-8 flow-root">
              <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                            ID
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Subject
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Status
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Date
                          </th>
                          <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {loading ? (
                          <tr>
                            <td colSpan="5" className="px-6 py-8 text-center">
                              <div className="flex justify-center items-center">
                                <ClockIcon className="h-8 w-8 animate-spin text-blue-500" />
                                <span className="ml-2 text-gray-500">Loading requests...</span>
                              </div>
                            </td>
                          </tr>
                        ) : (() => {
                          const filteredRequests = filteredAndSortedRequests();
                          return filteredRequests.length === 0 ? (
                            <tr>
                              <td colSpan="5" className="px-6 py-8 text-center">
                                <div className="flex flex-col items-center justify-center text-gray-500">
                                  <DocumentTextIcon className="h-12 w-12 mb-2" />
                                  <p className="text-lg font-medium">No requests found</p>
                                  <p className="text-sm">Try adjusting your search or filters</p>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            filteredRequests.map((request) => (
                              <tr key={request.id} className="hover:bg-gray-50">
                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                  #{request.id}
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                  {request.subject}
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm">
                                  <span
                                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                                      request.status === "Approved"
                                        ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
                                        : request.status === "Processing"
                                        ? "bg-blue-50 text-blue-700 ring-1 ring-blue-600/20"
                                        : request.status === "Rejected"
                                        ? "bg-rose-50 text-rose-700 ring-1 ring-rose-600/20"
                                        : "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20"
                                    }`}
                                  >
                                    {request.status}
                                  </span>
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                  {new Date(request.date).toLocaleDateString()}
                                </td>
                                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                  <button
                                    onClick={() => {
                                      setSelectedRequest(request);
                                      setShowViewModal(true);
                                    }}
                                    className="text-blue-600 hover:text-blue-900"
                                  >
                                    <EyeIcon className="h-5 w-5" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          );
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* View Request Modal */}
      <ViewRequestModal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedRequest(null);
        }}
        requestId={selectedRequest?.id}
        onActionComplete={fetchDashboardData}
      />
    </DepartmentLayout>
  );
};

// StatCard component with modern design
function StatCard({ title, value, icon: Icon, color, description }) {
  const styles = {
    'blue': {
      bg: 'bg-gradient-to-br from-blue-400 to-blue-600',
      icon: <DocumentTextIcon className="h-8 w-8 text-blue-100 opacity-75" />,
      hover: 'hover:from-blue-500 hover:to-blue-700'
    },
    'amber': {
      bg: 'bg-gradient-to-br from-amber-400 to-amber-600',
      icon: <ClockIcon className="h-8 w-8 text-amber-100 opacity-75" />,
      hover: 'hover:from-amber-500 hover:to-amber-700'
    },
    'emerald': {
      bg: 'bg-gradient-to-br from-emerald-400 to-emerald-600',
      icon: <CheckCircleIcon className="h-8 w-8 text-emerald-100 opacity-75" />,
      hover: 'hover:from-emerald-500 hover:to-emerald-700'
    },
    'red': {
      bg: 'bg-gradient-to-br from-rose-400 to-rose-600',
      icon: <XCircleIcon className="h-8 w-8 text-rose-100 opacity-75" />,
      hover: 'hover:from-rose-500 hover:to-rose-700'
    }
  }[color] || {
    bg: 'bg-gradient-to-br from-gray-400 to-gray-600',
    icon: null,
    hover: 'hover:from-gray-500 hover:to-gray-700'
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl p-6 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl ${styles.bg} ${styles.hover}`}>
      <div className="absolute top-0 right-0 mt-4 mr-4 opacity-75">
        {styles.icon}
      </div>
      <div className="relative z-10">
        <h3 className="text-lg font-medium text-white/90">{title}</h3>
        <p className="text-4xl font-bold text-white mt-2">{value}</p>
        {description && (
          <p className="text-sm text-white/80 mt-1">{description}</p>
        )}
      </div>
      <div className="absolute bottom-0 right-0 opacity-10 transform translate-x-4 translate-y-4">
        {styles.icon && <div className="h-24 w-24">{styles.icon}</div>}
      </div>
    </div>
  );
}

export default DepartmentDashboard;
