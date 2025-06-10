import { useState, useEffect, Fragment } from "react";
import DashboardLayout from "./DashboardLayout";
import axiosInstance from "../../middleware/axiosInstance";
import { Dialog, Transition } from "@headlessui/react";
import { EyeIcon, ArrowDownTrayIcon } from "@heroicons/react/24/outline";

const getStatusColor = (status) => {
  switch (status.toLowerCase()) {
    case "approved":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20";
    case "rejected":
      return "bg-rose-50 text-rose-700 ring-1 ring-rose-600/20";
    case "processing":
      return "bg-blue-50 text-blue-700 ring-1 ring-blue-600/20";
    case "pending":
      return "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20";
    default:
      return "bg-gray-50 text-gray-700 ring-1 ring-gray-600/20";
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
          const response = await axiosInstance.get(
            `/api/user/request/${requestId}`
          );
          if (response.data) {
            setRequest(response.data);
          } else {
            setError("No data received from server");
          }
        } catch (err) {
          console.error("Request details error:", err.response || err);
          setError(
            err.response?.data?.error || "Failed to fetch request details"
          );
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
          <div className="flex min-h-full items-center justify-center p-3 sm:p-4">
            <Transition.Child
              as="div"
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-xl sm:rounded-2xl bg-white p-4 sm:p-6 shadow-xl transition-all">
                <div className="flex justify-between items-center mb-3 sm:mb-4">
                  <Dialog.Title className="text-base sm:text-lg font-medium text-gray-900">
                    Request Details
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {loading ? (
                  <div className="flex justify-center py-6 sm:py-8">
                    <svg className="animate-spin h-6 w-6 sm:h-8 sm:w-8 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                ) : error ? (
                  <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-red-50 text-red-600 rounded-md text-sm">
                    {error}
                  </div>
                ) : request ? (
                  <div className="mt-3 sm:mt-4 space-y-4 sm:space-y-6">
                    {/* Status Section */}
                    <div className="flex justify-between items-center">
                      <p className="text-xs sm:text-sm font-medium text-gray-500">Status</p>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 sm:px-2.5 sm:py-1 text-xs font-semibold ${getStatusColor(
                          request.status
                        )}`}
                      >
                        {request.status}
                      </span>
                    </div>

                    {/* Rejection Reason (if applicable) */}
                    {request.status === 'Rejected' && request.rejection_reason && (
                      <div className="p-3 sm:p-4 bg-red-50 rounded-lg">
                        <p className="text-xs sm:text-sm font-medium text-red-800">Rejection Reason:</p>
                        <p className="mt-1 text-xs sm:text-sm text-red-600">{request.rejection_reason}</p>
                      </div>
                    )}

                    {/* Basic Info Section */}
                    <div className="grid grid-cols-1 gap-3 sm:gap-4">
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-gray-500">Request ID</p>
                        <p className="mt-1 text-xs sm:text-sm text-gray-900">{request.id}</p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-gray-500">Subject</p>
                        <p className="mt-1 text-xs sm:text-sm text-gray-900">{request.subject}</p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-gray-500">Description</p>
                        <p className="mt-1 text-xs sm:text-sm text-gray-900">{request.description}</p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-gray-500">Department</p>
                        <p className="mt-1 text-xs sm:text-sm text-gray-900">{request.department?.name_en || request.department}</p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-gray-500">Submission Date</p>
                        <p className="mt-1 text-xs sm:text-sm text-gray-900">{request.date}</p>
                      </div>
                    </div>

                    {/* File Attachments Section */}
                    {(request.file_name || (request.status === 'Approved' && request.response_file_name)) && (
                      <div className="space-y-2 sm:space-y-3">
                        <h4 className="text-xs sm:text-sm font-medium text-gray-900">Attachments</h4>
                        {request.file_name && (
                          <div className="flex items-center space-x-2">
                            <span className="text-xs sm:text-sm text-gray-500">{request.file_name}</span>
                          </div>
                        )}
                        {request.status === 'Approved' && request.response_file_name && (
                          <div>
                            <button
                              onClick={downloadAttachment}
                              className="inline-flex items-center px-2 py-1.5 sm:px-3 sm:py-2 border border-gray-300 shadow-sm text-xs sm:text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            >
                              <ArrowDownTrayIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                              Download Response
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : null}

                <div className="mt-4 sm:mt-6 flex justify-end">
                  <button
                    onClick={onClose}
                    className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-md bg-gray-100 text-gray-800 hover:bg-gray-200 text-xs sm:text-sm"
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

const CitizenRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await axiosInstance.get("/api/user/all-requests");
        const data = Array.isArray(response.data)
          ? response.data
          : response.data.requests || [];

        setRequests(data);
      } catch (err) {
        console.error("Failed to load requests:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  const openModal = (requestId) => {
    setSelectedRequestId(requestId);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedRequestId(null);
    setIsModalOpen(false);
  };

  return (
    <DashboardLayout>
      <div className="bg-white shadow rounded-lg">
        <div className="px-3 py-4 sm:px-4 sm:py-5">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">
            All Requests
          </h3>
          {loading ? (
            <div className="flex justify-center py-8">
              <svg className="animate-spin h-6 w-6 sm:h-8 sm:w-8 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : (
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
                  {requests.length > 0 ? (
                    requests.map((r) => (
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
                            onClick={() => openModal(r.id)}
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
          )}
        </div>
      </div>

      {/* View Request Modal */}
      <ViewRequestModal
        isOpen={isModalOpen}
        onClose={closeModal}
        requestId={selectedRequestId}
      />
    </DashboardLayout>
  );
};

export default CitizenRequests;
