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
} from "@heroicons/react/24/outline";
import axiosInstance from "../../middleware/axiosInstance";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";

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

  useEffect(() => {
  const fetchRequestDetails = async () => {
      if (isOpen && requestId) {
        try {
          setLoading(true);
          setError(null);
          const response = await axiosInstance.get(`/api/user/request/${requestId}`);
          if (response.data) {
            setRequest(response.data);
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

  const downloadAttachment = async () => {
    try {
      const response = await axiosInstance.get(
        `/api/user/request/${requestId}/response-file`,
        {
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", request.response_file_name);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as="div"
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
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as="div"
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                <div className="flex justify-between items-center mb-4">
                  <Dialog.Title className="text-lg font-medium text-gray-900">
                    Request Details
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {loading ? (
                  <div className="flex justify-center py-8">
                    <svg className="animate-spin h-8 w-8 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                ) : error ? (
                  <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-md">
                    {error}
                  </div>
                ) : request ? (
                  <div className="mt-4 space-y-6">
                    {/* Status Section */}
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-medium text-gray-500">Status</p>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusColor(
                          request.status
                        )}`}
                      >
                        {request.status}
                      </span>
                    </div>

                    {/* Rejection Reason (if applicable) */}
                    {request.status === 'Rejected' && request.rejection_reason && (
                      <div className="p-4 bg-red-50 rounded-lg">
                        <p className="font-medium text-red-800">Rejection Reason:</p>
                        <p className="mt-1 text-sm text-red-600">{request.rejection_reason}</p>
                      </div>
                    )}

                    {/* Basic Info Section */}
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Request ID</p>
                        <p className="mt-1 text-gray-900">{request.id}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Subject</p>
                        <p className="mt-1 text-gray-900">{request.subject}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Description</p>
                        <p className="mt-1 text-gray-900">{request.description}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Department</p>
                        <p className="mt-1 text-gray-900">{request.department?.name_en || request.department}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Submission Date</p>
                        <p className="mt-1 text-gray-900">{request.date}</p>
                      </div>
                    </div>

                    {/* File Attachments Section */}
                    {(request.file_name || (request.status === 'Approved' && request.response_file_name)) && (
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900">Attachments</h4>
                        {request.file_name && (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500">{request.file_name}</span>
                          </div>
                        )}
                        {request.status === 'Approved' && request.response_file_name && (
                          <div>
                            <button
                              onClick={downloadAttachment}
                              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            >
                              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                              Download Response
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : null}

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
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header + New Request Button */}
        <div className="sm:flex sm:items-center sm:justify-between">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Dashboard
          </h2>
          <button
            onClick={() => setShowNewRequest(true)}
            className="bg-black text-white rounded-lg px-4 py-2 hover:scale-105 transition"
          >
            New RTI Request
          </button>
        </div>

        {/* New Request Form */}
        {showNewRequest && (
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
        )}

        {/* Statistics Cards */}
        {!showNewRequest && (
          <>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6 lg:grid-cols-4">
              <StatCard
                title="Processing"
                value={stats.processingRequests}
                icon={DocumentTextIcon}
              />
              <StatCard
                title="Approved"
                value={stats.ApprovedRequests}
                icon={CheckCircleIcon}
              />
              <StatCard
                title="Rejected"
                value={stats.RejectedRequests}
                icon={XCircleIcon}
              />
              <StatCard
                title="Pending"
                value={stats.PendingRequests}
                icon={ClockIcon}
              />
            </div>

            {/* Recent Requests Table */}
            <div className="bg-white shadow rounded-lg mt-4 sm:mt-6">
              <div className="px-3 py-4 sm:px-4 sm:py-5">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">
                  Recent Requests
                </h3>
                <div className="overflow-x-auto -mx-3 sm:mx-0">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead>
                      <tr>
                        {["ID", "Subject", "Status", "Date", "Actions"].map(
                          (h) => (
                            <th
                              key={h}
                              className="px-2 sm:px-3 py-2 sm:py-3.5 text-left text-xs sm:text-sm font-semibold text-gray-900"
                            >
                              {h}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {recentRequests.length > 0 ? (
                        recentRequests.map((r) => (
                          <tr key={r.id}>
                            <td className="px-2 sm:px-3 py-2 sm:py-4 text-xs sm:text-sm text-gray-900 whitespace-nowrap">
                              {r.id}
                            </td>
                            <td className="px-2 sm:px-3 py-2 sm:py-4 text-xs sm:text-sm text-gray-500">
                              {r.subject}
                            </td>
                            <td className="px-2 sm:px-3 py-2 sm:py-4 text-xs sm:text-sm">
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 sm:px-2.5 sm:py-1 text-xs font-semibold ${getStatusColor(
                                  r.status
                                )}`}
                              >
                                {r.status}
                              </span>
                            </td>
                            <td className="px-2 sm:px-3 py-2 sm:py-4 text-xs sm:text-sm text-gray-500 whitespace-nowrap">
                              {r.date}
                            </td>
                            <td className="px-2 sm:px-3 py-2 sm:py-4 text-xs sm:text-sm">
                              <button
                                onClick={() => {
                                  setSelectedRequest(r.id);
                                  setIsViewModalOpen(true);
                                }}
                                className="inline-flex items-center text-indigo-600 hover:text-indigo-900"
                              >
                                <EyeIcon className="h-4 w-4 sm:h-5 sm:w-5 inline-block mr-1" />
                                View
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-2 sm:px-3 py-2 sm:py-4 text-center text-xs sm:text-sm text-gray-500 italic"
                          >
                            No Requests yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <ViewRequestModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        requestId={selectedRequest}
      />
    </DashboardLayout>
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
