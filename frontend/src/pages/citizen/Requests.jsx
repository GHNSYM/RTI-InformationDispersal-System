import { useState, useEffect, Fragment } from "react";
import DashboardLayout from "./DashboardLayout";
import axiosInstance from "../../middleware/axiosInstance";
import { Dialog, Transition } from "@headlessui/react";
import { EyeIcon, ArrowDownTrayIcon, ClockIcon, DocumentTextIcon } from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";

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
            console.log('Requests Page Request Data:', requestRes.data);
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
      const response = await axiosInstance.get(`/api/user/request/${requestId}/response-file`, {
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
                        <p className="text-sm text-gray-900">{typeof request.department === 'object' 
                          ? request.department.name_en 
                          : request.department}</p>
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

                <div className="mt-6">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-primary-100 px-4 py-2 text-sm font-medium text-primary-900 hover:bg-primary-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
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
      <div className="min-h-screen">
        <div className="py-4 sm:py-6">
          <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-semibold text-gray-900">All Requests</h1>
          </div>
          <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
            <div className="mt-6 sm:mt-8">
              <div className="overflow-x-auto">
                <div className="inline-block min-w-full align-middle">
                  <div className="overflow-hidden rounded-xl shadow-sm border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-white">
                        <tr>
                          <th scope="col" className="px-2 sm:px-6 lg:px-8 py-3 sm:py-4 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">ID</th>
                          <th scope="col" className="px-2 sm:px-6 lg:px-8 py-3 sm:py-4 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                          <th scope="col" className="px-2 sm:px-6 lg:px-8 py-3 sm:py-4 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th scope="col" className="px-2 sm:px-6 lg:px-8 py-3 sm:py-4 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th scope="col" className="px-2 sm:px-6 lg:px-8 py-3 sm:py-4 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {requests.map((request) => (
                          <tr key={request.id} className="hover:bg-gray-50/50 transition-colors duration-200">
                            <td className="px-2 sm:px-6 lg:px-8 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">{request.id}</td>
                            <td className="px-2 sm:px-6 lg:px-8 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">{request.subject}</td>
                            <td className="px-2 sm:px-6 lg:px-8 py-3 sm:py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium ${getStatusColor(request.status)}`}>
                                {request.status}
                              </span>
                            </td>
                            <td className="px-2 sm:px-6 lg:px-8 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">{request.date}</td>
                            <td className="px-2 sm:px-6 lg:px-8 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                              <button
                                onClick={() => openModal(request.id)}
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
            </div>
          </div>
        </div>
      </div>

      <ViewRequestModal
        isOpen={isModalOpen}
        onClose={closeModal}
        requestId={selectedRequestId}
      />
    </DashboardLayout>
  );
};

export default CitizenRequests;
