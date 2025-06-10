import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import AdminDashboardLayout from "./AdminDashboardLayout";
import axios from "axios";
import {
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  PaperClipIcon,
} from "@heroicons/react/24/outline";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import axiosInstance from "../../middleware/axiosInstance";
import { toast } from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";

// ViewRequestModal component
const ViewRequestModal = ({ isOpen, onClose, request, onForward, actionLoading }) => {
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'bg-green-50 text-green-800';
      case 'rejected':
        return 'bg-red-50 text-red-800';
      case 'processing':
        return 'bg-blue-50 text-blue-800';
      default:
        return 'bg-yellow-50 text-yellow-800';
    }
  };

  const handleDownload = async () => {
    try {
      const response = await axiosInstance.get(`/api/spio/request/${request.id}/attachment`, {
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
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as="div"
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

                {request && (
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
                      <div>
                        <p className="text-sm font-medium text-gray-500">Citizen Details</p>
                        <div className="mt-1 p-3 bg-gray-50 rounded-md">
                          <p className="text-sm text-gray-900">Name: {request.citizen?.name}</p>
                          <p className="text-sm text-gray-900">Email: {request.citizen?.email}</p>
                          <p className="text-sm text-gray-900">Phone: {request.citizen?.phone}</p>
                        </div>
                      </div>
                      {request.assignedAssistant && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">Assigned Assistant</p>
                          <div className="mt-1 p-3 bg-gray-50 rounded-md">
                            <p className="text-sm text-gray-900">Name: {request.assignedAssistant.name}</p>
                            <p className="text-sm text-gray-900">Email: {request.assignedAssistant.email}</p>
                            <p className="text-sm text-gray-900">Phone: {request.assignedAssistant.phone}</p>
                          </div>
                        </div>
                      )}
                      {request.assistant_remarks && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">Assistant Remarks</p>
                          <p className="text-sm text-gray-900 mt-1">{request.assistant_remarks}</p>
                        </div>
                      )}
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
                    </div>
                  </div>
                )}

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-md bg-gray-100 text-gray-800 hover:bg-gray-200"
                  >
                    Close
                  </button>
                  {request?.status.toLowerCase() === "pending" && (
                    <button
                      onClick={() => onForward(request.id)}
                      disabled={actionLoading}
                      className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 inline-flex items-center"
                    >
                      {actionLoading ? (
                        <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" />
                      ) : null}
                      Forward Request
                    </button>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [stats, setStats] = useState({
    processingRequests: 0,
    ApprovedRequests: 0,
    RejectedRequests: 0,
    PendingRequests: 0,
  });
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [district, setDistrict] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const [statsRes, recentRes] = await Promise.all([
        axiosInstance.get('/api/spio/stats'),
        axiosInstance.get('/api/spio/all-requests'),
      ]);

      setStats(statsRes.data);
      setRecentRequests(recentRes.data);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      toast.error('Failed to refresh dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchDistrictName = async () => {
    try {
      const response = await axiosInstance.get(`/api/admin/district/${user.district_code}`);
      setDistrict(response.data);
    } catch (err) {
      console.error('Error fetching district:', err);
      toast.error('Failed to fetch district information');
    }
  };

  useEffect(() => {
    fetchDistrictName();
    fetchDashboard();
  }, []);

  const handleViewRequest = async (requestId) => {
    try {
      const response = await axiosInstance.get(`/api/spio/request/${requestId}`);
      setSelectedRequest(response.data);
      setIsViewModalOpen(true);
    } catch (error) {
      console.error('Error fetching request details:', error);
      toast.error('Failed to fetch request details');
    }
  };

  const handleForwardRequest = async (requestId) => {
    try {
      setActionLoading(true);
      await axiosInstance.put(`/api/spio/request/${requestId}/forward`);
      await fetchDashboard();
      toast.success('Request forwarded successfully');
      setIsViewModalOpen(false);
    } catch (err) {
      console.error('Failed to forward request:', err);
      toast.error('Failed to forward request. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminDashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      </AdminDashboardLayout>
    );
  }

  return (
    <AdminDashboardLayout>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">
              {district ? `${district.district_name} District Admin Panel` : 'District Admin Panel'}
            </h1>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mt-8">
          <StatCard
            title="Processing"
            value={stats.processingRequests}
            color="processing"
          />
          <StatCard
            title="Approved"
            value={stats.ApprovedRequests}
            color="approved"
          />
          <StatCard
            title="Rejected"
            value={stats.RejectedRequests}
            color="rejected"
          />
          <StatCard
            title="Pending"
            value={stats.PendingRequests}
            color="pending"
          />
        </div>

        {/* Recent Requests Table */}
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
                        Department
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Status
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Date
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Attachment
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {recentRequests.map((request) => (
                      <tr key={request.id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {request.id}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {request.subject}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {request.department}
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
                          {request.date}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {request.file_name ? (
                            <span className="text-sm text-gray-600">{request.file_name}</span>
                          ) : (
                            <span className="text-sm text-gray-400 italic">No attachment</span>
                          )}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <button
                            onClick={() => handleViewRequest(request.id)}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            <EyeIcon className="h-5 w-5" />
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

      {/* View Request Modal */}
      <ViewRequestModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedRequest(null);
        }}
        request={selectedRequest}
        onForward={handleForwardRequest}
        actionLoading={actionLoading}
      />
    </AdminDashboardLayout>
  );
};

// Helper component for stats
const StatCard = ({ title, value, color }) => {
  const styles = {
    'processing': {
      bg: 'bg-gradient-to-br from-blue-400 to-blue-600',
      icon: <ClockIcon className="h-8 w-8 text-blue-100 opacity-75" />,
      hover: 'hover:from-blue-500 hover:to-blue-700'
    },
    'approved': {
      bg: 'bg-gradient-to-br from-emerald-400 to-emerald-600',
      icon: <CheckCircleIcon className="h-8 w-8 text-emerald-100 opacity-75" />,
      hover: 'hover:from-emerald-500 hover:to-emerald-700'
    },
    'rejected': {
      bg: 'bg-gradient-to-br from-rose-400 to-rose-600',
      icon: <XCircleIcon className="h-8 w-8 text-rose-100 opacity-75" />,
      hover: 'hover:from-rose-500 hover:to-rose-700'
    },
    'pending': {
      bg: 'bg-gradient-to-br from-amber-400 to-amber-600',
      icon: <DocumentTextIcon className="h-8 w-8 text-amber-100 opacity-75" />,
      hover: 'hover:from-amber-500 hover:to-amber-700'
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
      </div>
      <div className="absolute bottom-0 right-0 opacity-10 transform translate-x-4 translate-y-4">
        {styles.icon && React.cloneElement(styles.icon, { className: 'h-24 w-24' })}
      </div>
    </div>
  );
};

export default AdminDashboard;
