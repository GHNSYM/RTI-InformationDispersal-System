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
          as={div}
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
              as={div}
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
                        <p className="text-sm text-gray-900">{request.department?.name_en}</p>
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
                        className="text-sm font-medium text-primary-600 hover:text-primary-500"
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
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [showNewRequest, setShowNewRequest] = useState(false);

  //the handleFileChange function
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

  // real data state
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

  // fetch dashboard data on mount
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        console.log("Token in localStorage:", localStorage.getItem("token"));

        // Modify the Promise.all to include departments
        const [statsRes, recentRes, departmentsRes] = await Promise.all([
          axiosInstance.get(`/api/user/stats`),
          axiosInstance.get(`/api/user/recent-requests`),
          axiosInstance.get(`/api/user/departments`), // New endpoint to fetch departments
        ]);

        setStats(statsRes.data);
        setDepartments(departmentsRes.data); // Store departments

        // Ensure recentRes.data is handled correctly
        if (recentRes.data) {
          console.log("Recent requests data:", recentRes.data); // Debug log

          // If the data is already an array, use it directly
          // If not, try to access the rows property or default to empty array
          const recentData = Array.isArray(recentRes.data)
            ? recentRes.data
            : recentRes.data.rows || [];

          setRecentRequests(recentData);
        } else {
          setRecentRequests([]);
        }
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
        // Add detailed error logging
        console.error("Error details:", {
          status: err.response?.status,
          statusText: err.response?.statusText,
          data: err.response?.data,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  // handle new RTI request submission
  const onSubmit = async (data) => {
    try {
      const formData = new FormData();
      formData.append("department", data.department);
      formData.append("subject", data.subject);
      formData.append("description", data.description);

      // Debug log
      console.log("Files:", selectedFiles[0]);

      // Handle file upload - use selectedFiles state instead of data.files
      if (selectedFiles.length > 0) {
        console.log("ApPending file:", selectedFiles[0]);
        formData.append("attachment", selectedFiles[0]); // Use the first selected file
      }

      // Log FormData contents
      for (let pair of formData.entries()) {
        console.log(pair[0], pair[1]);
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
        // Refresh the dashboard data
        setSelectedFiles([]);

        const [statsRes, recentRes] = await Promise.all([
          axiosInstance.get("/api/user/stats"),
          axiosInstance.get("/api/user/recent-requests"),
        ]);

        setStats(statsRes.data);
        setRecentRequests(recentRes.data);
        reset();
        setShowNewRequest(false);
      }
    } catch (err) {
      console.error("Submit error:", err);
      setSubmitError(err.response?.data?.error || "Failed to submit request");
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <p className="text-center py-10">Loading...</p>
      </DashboardLayout>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
          {/* Header Section */}
          <div className="bg-white shadow rounded-lg p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name}</h1>
                <p className="mt-1 text-sm text-gray-500">Track and manage your RTI requests</p>
              </div>
              <div className="mt-4 sm:mt-0">
          <button
            onClick={() => setShowNewRequest(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  New Request
                </button>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.name}
                className="bg-white overflow-hidden shadow rounded-lg"
              >
                <div className="p-4 sm:p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <stat.icon
                        className="h-6 w-6 text-gray-400"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="ml-4 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          {stat.name}
                        </dt>
                        <dd>
                          <div className="text-lg font-medium text-gray-900">
                            {stat.value}
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Requests Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Recent Requests
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      ID
                    </th>
                    <th
                      scope="col"
                      className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Subject
                    </th>
                    <th
                      scope="col"
                      className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Department
                    </th>
                    <th
                      scope="col"
                      className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Date
                    </th>
                    <th scope="col" className="relative px-4 sm:px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentRequests.map((request) => (
                    <tr key={request.id}>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {request.id}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {request.subject}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {request.department?.name_en || request.department}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            request.status
                          )}`}
                        >
                          {request.status}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(request.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => {
                            setSelectedRequest(request.id);
                            setIsViewModalOpen(true);
                          }}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          View
          </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        </div>

      {/* New Request Modal */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  New RTI Request
                </h3>
                <button
                  onClick={() => setShowNewRequest(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Subject */}
                <div>
                  <label
                    htmlFor="subject"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Request Subject
                  </label>
                  <input
                    id="subject"
                    {...register("subject", {
                      required: "Subject is required",
                    })}
                    className="input-field mt-1"
                  />
                  {errors.subject && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.subject.message}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Request Description
                  </label>
                  <textarea
                    id="description"
                    rows={4}
                    {...register("description", {
                      required: "Description is required",
                    })}
                    className="mt-1 input-field"
                  />
                  {errors.description && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.description.message}
                    </p>
                  )}
                </div>

                {/* Department */}
                <div>
                  <label
                    htmlFor="department"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Select Department
                  </label>
                  <select
                    id="department"
                    {...register("department", {
                      required: "Department is required",
                    })}
                    className="mt-1 input-field"
                  >
                    <option value="">Select...</option>
                    {departments.map((dept) => (
                      <option key={dept.code} value={dept.code}>
                        {dept.name_en}
                      </option>
                    ))}
                  </select>
                  {errors.department && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.department.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Attach Files
                  </label>

                  {/* Hidden file input */}
                  <input
                    id="files"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {/* Custom-styled button to trigger file input */}
                  <label
                    htmlFor="files"
                    className="inline-block mt-2 cursor-pointer text-sm text-white bg-black px-4 py-2 rounded-xl transition-transform hover:scale-105"
                  >
                    Select Files
                  </label>

                  {/* Display selected file names */}
                  {selectedFiles.length > 0 && (
                    <ul className="mt-2 text-sm text-gray-600 list-disc list-inside">
                      {selectedFiles.map((file, idx) => (
                        <li key={idx}>{file.name}</li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Error */}
                {submitError && (
                  <p className="text-red-600 text-center">{submitError}</p>
                )}

                {/* Actions */}
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowNewRequest(false)}
                    className="bg-gray-200 text-gray-800 rounded-lg px-4 py-2 hover:scale-105 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-black text-white rounded-lg px-4 py-2 hover:scale-105 transition"
                  >
                    Submit
                  </button>
                </div>
              </form>
            </div>
          </div>

      {/* View Request Modal */}
      <ViewRequestModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        requestId={selectedRequest}
      />
    </div>
  );
};

export default CitizenDashboard;

// --- Helper component for stats ---
function StatCard({ title, value, icon: Icon }) {
  const getIconColor = (title) => {
    switch (title.toLowerCase()) {
      case 'processing':
        return 'text-blue-500';
      case 'approved':
        return 'text-emerald-500';
      case 'rejected':
        return 'text-red-500';
      case 'pending':
        return 'text-amber-500';
      default:
        return 'text-gray-400';
    }
  };

  const iconColor = getIconColor(title);

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-white to-gray-100 shadow-sm border border-gray-100 transition-all duration-300">
      <div className="absolute top-0 right-0 mt-2 mr-2 sm:mt-4 sm:mr-4 opacity-75">
        <Icon className={`h-6 w-6 sm:h-8 sm:w-8 ${iconColor}`} />
      </div>
      <div className="relative z-10 p-3 sm:p-6">
        <h3 className="text-sm sm:text-lg font-medium text-gray-600">{title}</h3>
        <p className="text-2xl sm:text-4xl font-bold text-gray-900 mt-1 sm:mt-2">{value}</p>
      </div>
      <div className="absolute bottom-0 right-0 opacity-5 transform translate-x-2 translate-y-2 sm:translate-x-4 sm:translate-y-4">
        <Icon className={`h-16 w-16 sm:h-24 sm:w-24 ${iconColor}`} />
      </div>
    </div>
  );
}
