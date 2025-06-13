import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import DashboardLayout from "./DashboardLayout";
import axios from "axios";
import {
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import axiosInstance from "../../middleware/axiosInstance";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { toast } from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";

// Move getStatusColor function outside of components
const getStatusColor = (status) => {
  switch (status) {
    case "Approved":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20";
    case "Rejected":
      return "bg-rose-50 text-rose-700 ring-1 ring-rose-600/20";
    case "Processing":
      return "bg-blue-50 text-blue-700 ring-1 ring-blue-600/20";
    default: // Pending
      return "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20";
  }
};

const ViewRequestModal = ({ isOpen, onClose, requestId }) => {
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);

  useEffect(() => {
    const fetchRequestDetails = async () => {
      if (isOpen && requestId) {
        try {
          setLoading(true);
          setError(null);
          const [requestRes, logsRes] = await Promise.all([
            axiosInstance.get(`/api/user/request/${requestId}`),
            axiosInstance.get(`/api/user/request/${requestId}/logs`)
          ]);
          if (requestRes.data) {
            console.log('Dashboard Request Data:', requestRes.data);
            setRequest(requestRes.data);
            setLogs(logsRes.data);
          } else {
            setError("No data received from server");
          }
        } catch (err) {
          console.error("Request details error:", err.response || err);
          setError(err.response?.data?.error || "Failed to fetch request details");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchRequestDetails();
  }, [isOpen, requestId]);

  const handleDownload = async () => {
    try {
      const response = await axiosInstance.get(`/api/user/request/${requestId}/attachment`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', request.file_name);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading attachment:', error);
      toast.error('Failed to download attachment');
    }
  };

  const handleDownloadResponse = async () => {
    try {
      const response = await axiosInstance.get(`/api/user/request/${requestId}/response`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', request.response_file_name);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading response:', error);
      toast.error('Failed to download response');
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
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900"
                >
                  Request Details
                </Dialog.Title>

                {loading ? (
                  <div className="mt-4 flex justify-center">
                    <ClockIcon className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                ) : error ? (
                  <div className="mt-4 text-red-600">{error}</div>
                ) : request && (
                  <div className="mt-4 space-y-4">
                    {/* Basic Info */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <p className="text-sm font-medium text-gray-500">Status</p>
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${getStatusColor(
                            request.status
                          )}`}
                        >
                          {request.status}
                        </span>
                      </div>
                      {request.status === 'Rejected' && request.rejection_reason && (
                        <div className="mt-2 p-3 bg-red-50 rounded-md">
                          <p className="text-sm font-medium text-red-700">Rejection Reason:</p>
                          <p className="text-sm text-red-600 mt-1">{request.rejection_reason}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-500">ID</p>
                        <p className="text-sm text-gray-900">{request.id}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Subject</p>
                        <p className="text-sm text-gray-900">{request.subject}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Description</p>
                        <p className="text-sm text-gray-900">{request.description}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Department</p>
                        <p className="text-sm text-gray-900">
                          {typeof request.department === 'object' 
                            ? request.department.name_en 
                            : request.department}
                        </p>
                      </div>
                      {request.file_name && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">Attachment</p>
                          <button
                            onClick={handleDownload}
                            className="mt-1 inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                          >
                            <ArrowDownTrayIcon className="h-4 w-4 mr-1.5" />
                            Download {request.file_name}
                          </button>
                        </div>
                      )}
                      {request.response_file_name && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">Response Document</p>
                          <button
                            onClick={handleDownloadResponse}
                            className="mt-1 inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                          >
                            <ArrowDownTrayIcon className="h-4 w-4 mr-1.5" />
                            Download Response
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Request Logs */}
                    <div className="mt-6">
                      <button
                        onClick={() => setShowLogs(!showLogs)}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        {showLogs ? 'Hide Activity Log' : 'Show Activity Log'}
                      </button>
                      
                      {showLogs && (
                        <div className="mt-4 space-y-4">
                          <h4 className="text-sm font-medium text-gray-900">Activity Log</h4>
                          <div className="flow-root">
                            <ul role="list" className="-mb-8">
                              {logs.map((log, logIdx) => (
                                <li key={log.id}>
                                  <div className="relative pb-8">
                                    {logIdx !== logs.length - 1 ? (
                                      <span
                                        className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"
                                        aria-hidden="true"
                                      />
                                    ) : null}
                                    <div className="relative flex space-x-3">
                                      <div>
                                        <span className="h-8 w-8 rounded-full bg-gray-400 flex items-center justify-center ring-8 ring-white">
                                          <DocumentTextIcon className="h-5 w-5 text-white" aria-hidden="true" />
                                        </span>
                                      </div>
                                      <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                        <div>
                                          <p className="text-sm text-gray-500">
                                            {log.remarks || log.action_type}
                                            {' '}
                                            <span className="font-medium text-gray-900">
                                              {log.actor?.name}
                                            </span>
                                          </p>
                                        </div>
                                        <div className="whitespace-nowrap text-right text-sm text-gray-500">
                                          <time dateTime={log.created_at}>
                                            {new Date(log.created_at).toLocaleString()}
                                          </time>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-md bg-gray-100 text-gray-800 hover:bg-gray-200"
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

const CitizenDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [showNewRequest, setShowNewRequest] = useState(false);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    console.log("Selected files:", files);
    setSelectedFiles(files);
  };
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  const [stats, setStats] = useState({
    totalRequests: 0,
    ApprovedRequests: 0,
    RejectedRequests: 0,
    PendingRequests: 0,
  });
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitError, setSubmitError] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  useEffect(() => {
    const fetchDashboard = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const [statsRes, recentRes, departmentsRes] = await Promise.all([
          axiosInstance.get(`/api/user/stats`),
          axiosInstance.get(`/api/user/recent-requests`),
          axiosInstance.get(`/api/user/departments`),
        ]);
        console.log(recentRes.data);
        setStats(statsRes.data);
        setDepartments(departmentsRes.data);

        if (recentRes.data) {
          const recentData = Array.isArray(recentRes.data)
            ? recentRes.data
            : recentRes.data.rows || [];
          setRecentRequests(recentData);
        } else {
          setRecentRequests([]);
        }
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [user]);

  const onSubmit = async (data) => {
    try {
      const formData = new FormData();
      formData.append("department", data.department);
      formData.append("subject", data.subject);
      formData.append("description", data.description);

      if (selectedFiles.length > 0) {
        formData.append("attachment", selectedFiles[0]);
      }

      const response = await axiosInstance.post(
        "/api/user/new-request",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        setSelectedFiles([]);
        const [statsRes, recentRes] = await Promise.all([
          axiosInstance.get("/api/user/stats"),
          axiosInstance.get("/api/user/recent-requests"),
        ]);

        setStats(statsRes.data);
        setRecentRequests(recentRes.data);
        reset();
        setShowNewRequest(false);
        toast.success("Request submitted successfully!");
      }
    } catch (err) {
      console.error("Submit error:", err);
      setSubmitError(err.response?.data?.error || "Failed to submit request");
      toast.error(err.response?.data?.error || "Failed to submit request");
    }
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-lg text-gray-600">Please log in to access the dashboard.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen p-2 sm:p-4 lg:p-6">
        {/* Header Section */}
        <div className="p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Dashboard</h1>
              <p className="mt-1 sm:mt-2 text-base sm:text-lg lg:text-xl text-gray-600">Welcome back, {user?.name || 'User'}! 👋</p>
            </div>
            <button
              onClick={() => setShowNewRequest(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 sm:px-6 py-2.5 sm:py-3 border border-transparent rounded-xl sm:rounded-2xl shadow-sm text-sm sm:text-base font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200 hover:scale-105"
            >
              <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" />
              New RTI Request
            </button>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-sm p-3 sm:p-4 lg:p-6 border border-gray-100/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Processing</p>
                <p className="mt-1 sm:mt-2 text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{stats.processingRequests || 0}</p>
              </div>
              <div className="p-2 sm:p-3 bg-blue-50 rounded-lg sm:rounded-xl">
                <DocumentTextIcon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-3 sm:mt-4">
              <div className="h-1 sm:h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-1 sm:h-1.5 bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${(stats.ApprovedRequests / stats.totalRequests) * 100}%` }}></div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-sm p-3 sm:p-4 lg:p-6 border border-gray-100/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Approved</p>
                <p className="mt-1 sm:mt-2 text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{stats.ApprovedRequests}</p>
              </div>
              <div className="p-2 sm:p-3 bg-emerald-50 rounded-lg sm:rounded-xl">
                <CheckCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-emerald-600" />
              </div>
            </div>
            <div className="mt-3 sm:mt-4">
              <div className="h-1 sm:h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-1 sm:h-1.5 bg-emerald-600 rounded-full transition-all duration-500" style={{ width: `${(stats.ApprovedRequests / stats.totalRequests) * 100}%` }}></div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-sm p-3 sm:p-4 lg:p-6 border border-gray-100/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Rejected</p>
                <p className="mt-1 sm:mt-2 text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{stats.RejectedRequests}</p>
              </div>
              <div className="p-2 sm:p-3 bg-rose-50 rounded-lg sm:rounded-xl">
                <XCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-rose-600" />
              </div>
            </div>
            <div className="mt-3 sm:mt-4">
              <div className="h-1 sm:h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-1 sm:h-1.5 bg-rose-600 rounded-full transition-all duration-500" style={{ width: `${(stats.RejectedRequests / stats.totalRequests) * 100}%` }}></div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-sm p-3 sm:p-4 lg:p-6 border border-gray-100/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Pending</p>
                <p className="mt-1 sm:mt-2 text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{stats.PendingRequests}</p>
              </div>
              <div className="p-2 sm:p-3 bg-amber-50 rounded-lg sm:rounded-xl">
                <ClockIcon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-amber-600" />
              </div>
            </div>
            <div className="mt-3 sm:mt-4">
              <div className="h-1 sm:h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-1 sm:h-1.5 bg-amber-600 rounded-full transition-all duration-500" style={{ width: `${(stats.PendingRequests / stats.totalRequests) * 100}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Requests Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-sm overflow-hidden border border-gray-100/50">
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b border-gray-200">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Recent Requests</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-white/50">
                <tr>
                  <th scope="col" className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th scope="col" className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                  <th scope="col" className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white/50 divide-y divide-gray-200">
                {recentRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50/50 transition-colors duration-200">
                    <td className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">{request.id}</td>
                    <td className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">{request.subject}</td>
                    <td className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">{new Date(request.created_at).toLocaleDateString()}</td>
                    <td className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                      <button
                        onClick={() => {
                          setSelectedRequest(request);
                          setIsViewModalOpen(true);
                        }}
                        className="text-primary-600 hover:text-primary-900 transition-colors duration-200"
                      >
                        <EyeIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* New Request Modal */}
      <Transition appear show={showNewRequest} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowNewRequest(false)}>
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
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    New RTI Request
                  </Dialog.Title>

                  <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Department</label>
                      <select
                        {...register("department", { required: "Department is required" })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      >
                        <option value="">Select Department</option>
                        {departments.map((dept) => (
                          <option key={dept.code} value={dept.code}>
                            {dept.name_en}
                          </option>
                        ))}
                      </select>
                      {errors.department && (
                        <p className="mt-1 text-sm text-red-600">{errors.department.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Subject</label>
                      <input
                        type="text"
                        {...register("subject", { required: "Subject is required" })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      />
                      {errors.subject && (
                        <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <textarea
                        {...register("description", { required: "Description is required" })}
                        rows={4}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      />
                      {errors.description && (
                        <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Attachment</label>
                      <input
                        type="file"
                        onChange={handleFileChange}
                        className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                      />
                    </div>

                    {submitError && (
                      <p className="text-sm text-red-600">{submitError}</p>
                    )}

                    <div className="mt-6 flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setShowNewRequest(false)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        Submit Request
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* View Request Modal */}
      <ViewRequestModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        requestId={selectedRequest?.id}
      />
    </DashboardLayout>
  );
};

// StatCard component
function StatCard({ title, value, icon: Icon }) {
  const getIconColor = (title) => {
    switch (title) {
      case "Processing":
        return "text-blue-500";
      case "Approved":
        return "text-emerald-500";
      case "Rejected":
        return "text-rose-500";
      case "Pending":
        return "text-amber-500";
      default:
        return "text-gray-500";
    }
  };

  const getFaintIcon = (title) => {
    switch (title) {
      case "Processing":
        return <DocumentTextIcon className="h-32 w-32 text-blue-100 opacity-50" />;
      case "Approved":
        return <CheckCircleIcon className="h-32 w-32 text-emerald-100 opacity-50" />;
      case "Rejected":
        return <XCircleIcon className="h-32 w-32 text-rose-100 opacity-50" />;
      case "Pending":
        return <ClockIcon className="h-32 w-32 text-amber-100 opacity-50" />;
      default:
        return null;
    }
  };

  return (
    <div className="relative bg-white overflow-hidden shadow rounded-lg p-5">
      {/* Faint background icon */}
      <div className="absolute bottom-0 right-0 pr-2 pb-2 flex items-center pointer-events-none">
        {getFaintIcon(title)}
      </div>

      {/* Main icon */}
      <div className="absolute top-4 right-4">
        <Icon className={`h-8 w-8 ${getIconColor(title)}`} aria-hidden="true" />
      </div>

      {/* Content: Title and Value */}
      <div className="relative z-10">
        <dl>
          <dt className="text-base font-medium text-gray-500">{title}</dt>
          <dd className="mt-1">
            <div className="text-4xl font-extrabold text-gray-900">{value}</div>
          </dd>
        </dl>
      </div>
    </div>
  );
}

export default CitizenDashboard;
