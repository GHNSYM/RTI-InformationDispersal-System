import { useState, useEffect, Fragment } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import axiosInstance from '../../../middleware/axiosInstance';
import { toast } from 'react-hot-toast';
import { Dialog, Transition, Menu } from '@headlessui/react';
import {
  DocumentTextIcon, 
  ArrowDownTrayIcon, 
  ArrowPathIcon, 
  ClockIcon,
  CheckCircleIcon,
  XMarkIcon,
  PaperClipIcon,
  EyeIcon,
  BellIcon,
  Bars3Icon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

const SpioAssistantDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showRemarkModal, setShowRemarkModal] = useState(false);
  const [remarkText, setRemarkText] = useState('');
  const [verificationStatus, setVerificationStatus] = useState('verified');
  const [actionLoading, setActionLoading] = useState({
    download: new Set(),
    submit: new Set(),
  });
  const [stats, setStats] = useState({
    totalAssigned: 0,
    pendingReview: 0,
    reviewed: 0
  });

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await axiosInstance.get('/api/assistant/assigned-requests');
      const requestsWithStatus = response.data.requests.map(request => ({
        ...request,
        review_status: request.assistant_remarks ? 'reviewed' : 'pending'
      }));
      setRequests(requestsWithStatus);
      setStats({
        totalAssigned: response.data.totalAssigned,
        pendingReview: response.data.pendingReview,
        reviewed: response.data.reviewed
      });
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (requestId) => {
    try {
      setActionLoading(prev => ({
        ...prev,
        download: new Set([...prev.download, requestId])
      }));

      const response = await axiosInstance.get(
        `/api/assistant/request/${requestId}/attachment`,
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'attachment');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      
    } catch (err) {
      toast.error('Failed to download attachment');
      console.error('Download failed:', err);
    } finally {
      setActionLoading(prev => ({
        ...prev,
        download: new Set([...prev.download].filter(id => id !== requestId))
      }));
    }
  };

  const handleSubmitRemark = async () => {
    if (!remarkText.trim()) {
      toast.error('Please enter your remarks');
      return;
    }

    if (!selectedRequest?.id) {
      toast.error('No request selected');
      return;
    }

    try {
      setActionLoading(prev => ({
        ...prev,
        submit: new Set([...prev.submit, selectedRequest.id])
      }));

      await axiosInstance.put(`/api/assistant/request/${selectedRequest.id}/review`, {
        remarks: remarkText,
        verification_status: verificationStatus
      });

      // Update the request's review status in the local state
      setRequests(prevRequests => 
        prevRequests.map(req => 
          req.id === selectedRequest.id 
            ? { ...req, review_status: 'reviewed', assistant_remarks: remarkText, verification_status: verificationStatus }
            : req
        )
      );

      await fetchRequests();
      setShowRemarkModal(false);
      setRemarkText('');
      setVerificationStatus('verified');
      setSelectedRequest(null);
      toast.success('Remarks submitted successfully');
    } catch (error) {
      console.error('Error submitting remarks:', error);
      toast.error('Failed to submit remarks');
    } finally {
      setActionLoading(prev => ({
        ...prev,
        submit: new Set([...prev.submit].filter(id => id !== selectedRequest.id))
      }));
    }
  };

  const getStatusColor = (status) => {
    switch ((status || "").toLowerCase()) {
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

  const handleLogout = async () => {
    try {
      await axiosInstance.post(
        "/api/auth/logout",
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      // Clear token and redirect
      logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600" />
      </div>
    );
  }

  const StatCard = ({ icon: Icon, title, value, className }) => {
    const baseGradient = (baseColor) => `bg-gradient-to-br from-${baseColor}-400 to-${baseColor}-600 hover:from-${baseColor}-500 hover:to-${baseColor}-700`;
    
    // Choose gradient based on type
    let gradientClass;
    switch (title.toLowerCase()) {
      case 'total assigned':
        gradientClass = baseGradient('blue');
        break;
      case 'pending review':
        gradientClass = baseGradient('amber');
        break;
      case 'reviewed':
        gradientClass = baseGradient('emerald');
        break;
      default:
        gradientClass = baseGradient('gray');
    }

    return (
      <div className={`relative overflow-hidden rounded-2xl p-6 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl ${gradientClass}`}>
        <div className="absolute top-0 right-0 mt-4 mr-4 opacity-75">
          <Icon className="h-8 w-8 text-white" />
        </div>
        <div className="relative z-10">
          <h3 className="text-lg font-medium text-white/90">{title}</h3>
          <p className="text-4xl font-bold text-white mt-2">{value}</p>
        </div>
        <div className="absolute bottom-0 right-0 opacity-10 transform translate-x-4 translate-y-4">
          <Icon className="h-24 w-24" />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 bg-blue-600 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
        <div className="flex flex-1 gap-x-4 self-stretch items-center justify-end">
          <div className="flex items-center gap-x-4 lg:gap-x-6">
            {/* Notification Dropdown */}
            <Menu as="div" className="relative">
              <Menu.Button className="flex items-center text-white hover:text-gray-200 transition-colors">
                <span className="sr-only">View notifications</span>
                <BellIcon className="h-6 w-6" aria-hidden="true" />
              </Menu.Button>
              <Transition
                as="div"
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 z-10 mt-2 w-80 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="px-4 py-3">
                    <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
                  </div>
                  <div className="px-4 py-3 border-t border-gray-100">
                    <p className="text-sm text-gray-500">No new notifications</p>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>

            {/* Profile Dropdown */}
            <Menu as="div" className="relative">
              <Menu.Button className="flex items-center">
                <span className="sr-only">Open user menu</span>
                <div className="h-8 w-8 rounded-full bg-black flex items-center justify-center text-white hover:scale-105 transition-transform duration-200">
                  {user?.name?.[0]?.toUpperCase() || "U"}
                </div>
              </Menu.Button>
              <Transition
                as="div"
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="px-4 py-3 space-y-1">
                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                    <p className="text-sm text-gray-500">{user?.phone}</p>
                  </div>
                  <div className="border-t border-gray-100 pt-2 pb-1 px-2">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={handleLogout}
                          className="w-full px-3 py-1.5 text-xs font-medium text-white bg-black rounded hover:bg-gray-800 transition-colors"
                        >
                          Sign out
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section with Gradient */}
        <div className="py-8">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">SPIO Assistant Dashboard</h2>
              <p className="mt-1 text-sm text-gray-500">Manage and review assigned RTI requests</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          <StatCard
            icon={DocumentTextIcon}
            title="Total Assigned"
            value={stats.totalAssigned}
          />
          <StatCard
            icon={ClockIcon}
            title="Pending Review"
            value={stats.pendingReview}
          />
          <StatCard
            icon={CheckCircleIcon}
            title="Reviewed"
            value={stats.reviewed}
          />
        </div>

        {/* Requests Table */}
        <div className="mt-8 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <table className="min-w-full divide-y divide-gray-300">
                <thead>
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">
                      Request ID
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
                      Review Status
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {requests.map((request) => (
                    <tr key={request.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                        {request.id}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {request.subject}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {request.department?.name_en || request.department}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${getStatusColor(request.status)}`}>
                          {request.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                          request.assistant_remarks ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {request.assistant_remarks ? 'Reviewed' : 'Pending Review'}
                        </span>
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowViewModal(true);
                            }}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            View
                          </button>
                          <button
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowRemarkModal(true);
                            }}
                            disabled={request.assistant_remarks || actionLoading.submit.has(request.id)}
                            className={`text-blue-600 hover:text-blue-900 ${
                              (request.assistant_remarks || actionLoading.submit.has(request.id)) ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            Add Remarks
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* View Request Modal */}
      <Transition.Root show={showViewModal} as="div">
        <Dialog as="div" className="relative z-50" onClose={() => {
          setShowViewModal(false);
          setSelectedRequest(null);
        }}>
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
          
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <Dialog.Title className="text-lg font-semibold">
                  Request Details
                </Dialog.Title>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {selectedRequest ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Request ID</h4>
                    <p className="mt-1">{selectedRequest.id}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Subject</h4>
                    <p className="mt-1">{selectedRequest.subject}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Description</h4>
                    <p className="mt-1">{selectedRequest.description}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Status</h4>
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium mt-1 ${getStatusColor(selectedRequest.status)}`}>
                      {selectedRequest.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Department</h4>
                    <p className="mt-1">{selectedRequest.department?.name_en}</p>
                  </div>

                  {selectedRequest.assistant_remarks && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Your Remarks</h4>
                      <p className="mt-1 whitespace-pre-wrap">{selectedRequest.assistant_remarks}</p>
                    </div>
                  )}

                  {selectedRequest.file_name && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Attachment</h4>
                      <button
                        onClick={() => handleDownload(selectedRequest.id)}
                        disabled={actionLoading.download.has(selectedRequest.id)}
                        className="mt-2 inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        {actionLoading.download.has(selectedRequest.id) ? (
                          <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                        )}
                        Download {selectedRequest.file_name}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500">No request selected</p>
                </div>
              )}
            </Dialog.Panel>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Add Remarks Modal */}
      <Transition.Root show={showRemarkModal} as="div">
        <Dialog as="div" className="relative z-50" onClose={() => {
          setShowRemarkModal(false);
          setRemarkText('');
          setVerificationStatus('verified');
          setSelectedRequest(null);
        }}>
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div>
                  <div className="mt-3 text-center sm:mt-5">
                    <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                      Add Remarks
                    </Dialog.Title>
                    <div className="mt-4 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Verification Status
                        </label>
                        <div className="flex gap-4">
                          <label className="inline-flex items-center">
                            <input
                              type="radio"
                              value="verified"
                              checked={verificationStatus === 'verified'}
                              onChange={(e) => setVerificationStatus(e.target.value)}
                              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                            />
                            <span className="ml-2 text-sm text-green-700 font-medium">Verified</span>
                          </label>
                          <label className="inline-flex items-center">
                            <input
                              type="radio"
                              value="verification_failed"
                              checked={verificationStatus === 'verification_failed'}
                              onChange={(e) => setVerificationStatus(e.target.value)}
                              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                            />
                            <span className="ml-2 text-sm text-red-700 font-medium">Verification Failed</span>
                          </label>
                        </div>
                      </div>
                      <div>
                        <label htmlFor="remarks" className="block text-sm font-medium text-gray-700">
                          Remarks
                        </label>
                        <textarea
                          id="remarks"
                          rows={4}
                          className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                          value={remarkText}
                          onChange={(e) => setRemarkText(e.target.value)}
                          placeholder="Enter your remarks here..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md bg-black px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 sm:col-start-2"
                    onClick={handleSubmitRemark}
                    disabled={!remarkText.trim() || !selectedRequest?.id || actionLoading.submit.has(selectedRequest?.id)}
                  >
                    {actionLoading.submit.has(selectedRequest?.id) ? (
                      <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" />
                    ) : null}
                    Submit
                  </button>
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
                    onClick={() => {
                      setShowRemarkModal(false);
                      setRemarkText('');
                      setVerificationStatus('verified');
                      setSelectedRequest(null);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </Dialog.Panel>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </div>
  );
};

export default SpioAssistantDashboard;