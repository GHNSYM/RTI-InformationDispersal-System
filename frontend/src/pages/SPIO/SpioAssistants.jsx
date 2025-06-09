import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axiosInstance from '../../middleware/axiosInstance';
import { toast } from 'react-hot-toast';
import AdminDashboardLayout from './AdminDashboardLayout';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

const SpioAssistants = () => {
  const { user } = useAuth();
  const [assistants, setAssistants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAssistant, setEditingAssistant] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    address: ''
  });

  useEffect(() => {
    fetchAssistants();
  }, []);

  const fetchAssistants = async () => {
    try {
      const response = await axiosInstance.get('/api/spio/assistants');
      setAssistants(response.data);
    } catch (error) {
      console.error('Error fetching assistants:', error);
      toast.error('Failed to fetch assistants');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAssistant) {
        // Update existing assistant
        await axiosInstance.put(`/api/spio/assistants/${editingAssistant.id}`, formData);
        toast.success('Assistant updated successfully');
      } else {
        // Add new assistant
        await axiosInstance.post('/api/spio/assistants', formData);
        toast.success('Assistant added successfully');
      }
      setShowAddForm(false);
      setEditingAssistant(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        address: ''
      });
      fetchAssistants();
    } catch (error) {
      console.error('Error saving assistant:', error);
      toast.error(error.response?.data?.error || 'Failed to save assistant');
    }
  };

  const handleEdit = (assistant) => {
    setEditingAssistant(assistant);
    setFormData({
      name: assistant.name,
      email: assistant.email,
      phone: assistant.phone,
      password: '', // Don't show password
      address: assistant.address
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to remove this assistant?')) {
      try {
        await axiosInstance.delete(`/api/spio/assistants/${id}`);
        toast.success('Assistant removed successfully');
        fetchAssistants();
      } catch (error) {
        console.error('Error removing assistant:', error);
        toast.error('Failed to remove assistant');
      }
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
              SPIO Assistants
            </h1>
            <p className="mt-2 text-sm text-gray-700">
              A list of all assistants in your district
            </p>
          </div>
          <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
            <button
              type="button"
              onClick={() => {
                setShowAddForm(true);
                setEditingAssistant(null);
                setFormData({
                  name: '',
                  email: '',
                  phone: '',
                  password: '',
                  address: ''
                });
              }}
              className="flex items-center rounded-md bg-black px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add New Assistant
            </button>
          </div>
        </div>

        {showAddForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="relative w-full max-w-3xl mx-4 sm:mx-auto max-h-[90vh] overflow-y-auto bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-semibold mb-4">
                {editingAssistant ? 'Edit Assistant' : 'Add New Assistant'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                  {!editingAssistant && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Password</label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      />
                    </div>
                  )}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Address</label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                      rows={3}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingAssistant(null);
                      setFormData({
                        name: '',
                        email: '',
                        phone: '',
                        password: '',
                        address: ''
                      });
                    }}
                    className="px-4 py-2 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-md bg-black text-white hover:bg-gray-800"
                  >
                    {editingAssistant ? 'Update' : 'Submit'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="mt-8 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                        Name
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Email
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Phone
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Address
                      </th>
                      <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {assistants.map((assistant) => (
                      <tr key={assistant.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {assistant.name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {assistant.email}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {assistant.phone}
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-500">
                          {assistant.address}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <button
                            onClick={() => handleEdit(assistant)}
                            className="text-gray-600 hover:text-black mr-4"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(assistant.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <TrashIcon className="h-5 w-5" />
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
    </AdminDashboardLayout>
  );
};

export default SpioAssistants; 