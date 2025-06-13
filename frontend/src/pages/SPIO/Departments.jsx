import { useState, useEffect } from "react";
import AdminDashboardLayout from "./AdminDashboardLayout";
import axiosInstance from "../../middleware/axiosInstance";
import { PencilIcon, TrashIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useAuth } from "../../contexts/AuthContext";

const Departments = () => {
  const { user } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [district, setDistrict] = useState(null);
  const [isLoadingDistrict, setIsLoadingDistrict] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [formData, setFormData] = useState({
    name_en: "",
    pio_name: "",
    pio_email: "",
    pio_phone: "",
    pio_password: "",
    pio_address: "",
  });
  const [error, setError] = useState("");
  const fetchDepartments = async () => {
    try {
      if (!user.district_code) {
        setError("No district code found");
        return;
      }
      // First get the district details to get district_id
      const districtResponse = await axiosInstance.get(`/api/admin/district/${user.district_code}`);
      const district_id = districtResponse.data.district_id;
      
      // Then fetch departments filtered by district_id
      const response = await axiosInstance.get(`/api/admin/departments/district/${district_id}`);
      setDepartments(response.data);
    } catch (err) {
      console.error("Error fetching departments:", err);
      setError(err.response?.data?.error || "Failed to fetch departments");
    }
  };

  const fetchDistrictName = async () => {
    try {
      setIsLoadingDistrict(true);
      const response = await axiosInstance.get(
        `/api/admin/district/${user.district_code}`
      );
      setDistrict(response.data);
    } catch (err) {
      console.error("Error fetching district:", err);
      setError(err.response?.data?.error || "Failed to fetch district");
    } finally {
      setIsLoadingDistrict(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
    fetchDistrictName();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDepartment) {
        await axiosInstance.put(
          `/api/admin/departments/${editingDepartment.code}`,
          formData
        );      
      } else {
        if (!district || !district.district_id) {
          setError('District information not available');
          return;
        }

        // Format the department name to include the district
        const formattedName = `${formData.name_en}, ${district.district_name}`;

        const departmentData = {
          district_id: parseInt(district.district_id),
          name_en: formattedName,
          pio_name: formData.pio_name,
          pio_email: formData.pio_email,
          pio_phone: formData.pio_phone,
          pio_password: formData.pio_password,
          pio_address: formData.pio_address
        };

        console.log('Sending department data:', departmentData);
        const response = await axiosInstance.post("/api/admin/departments", departmentData);
        console.log('Department creation response:', response.data);
      }
      setIsModalOpen(false);
      setEditingDepartment(null);
      setFormData({
        name_en: "",
        pio_name: "",
        pio_email: "",
        pio_phone: "",
        pio_password: "",
        pio_address: "",
      });
      fetchDepartments();
    } catch (err) {
      console.error('Error submitting department:', err);
      console.error('Error details:', err.response?.data);
      setError(err.response?.data?.error || "Operation failed");
    }
  };
  const handleEdit = (department) => {
    setEditingDepartment(department);
    setFormData({
      name_en: department.name_en,
      pio_name: department.pio_name || "",
      pio_email: department.pio_email || "",
      pio_phone: department.pio_phone || "",
      pio_address: department.pio_address || "",
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (code) => {
    if (window.confirm("Are you sure you want to delete this department?")) {
      try {
        await axiosInstance.delete(`/api/admin/departments/${code}`);
        fetchDepartments();
      } catch (err) {
        setError(err.response?.data?.error || "Failed to delete department");
      }
    }
  };

  return (
    <AdminDashboardLayout>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">
              Departments
            </h1>
            <p className="mt-2 text-sm text-gray-700">
              A list of all departments in the system
            </p>
          </div>
          <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
            <button
              type="button"
              onClick={() => {
                setEditingDepartment(null);
                setFormData({
                  code: "",
                  name_en: "",
                  pio_name: "",
                  pio_email: "",
                  pio_phone: "",
                  pio_password: "",
                  pio_address: "",
                });
                setIsModalOpen(true);
              }}
              className="flex items-center rounded-md bg-black px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Department
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 p-4 rounded-md">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="mt-8 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                      >
                        Department Code
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        Name
                      </th>
                      <th
                        scope="col"
                        className="relative py-3.5 pl-3 pr-4 sm:pr-6"
                      >
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {departments.map((department) => (
                      <tr key={department.code}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {department.code}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {department.name_en}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <button
                            onClick={() => handleEdit(department)}
                            className="text-gray-600 hover:text-black mr-4"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(department.code)}
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

      {/* Modal for Add/Edit Department */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          {/* Modal Container */}
          <div className="relative w-full max-w-3xl mx-4 sm:mx-auto max-h-[90vh] overflow-y-auto bg-white p-6 rounded-lg shadow-lg">
            {/* Modal Header */}
            <h2 className="text-xl font-semibold mb-4">
              {editingDepartment ? "Edit Department" : "Add New Department"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="name_en"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Department Name
                  </label>
                  <input
                    type="text"
                    id="name_en"
                    value={formData.name_en}
                    onChange={(e) =>
                      setFormData({ ...formData, name_en: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    maxLength={100}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    District
                  </label>                  {isLoadingDistrict ? (
                    <div className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 bg-gray-50 text-gray-500">
                      Loading district information...
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={district ? `${district.district_name} (${district.district_code})` : user.district_code}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 bg-gray-50"
                      disabled
                    />
                  )}
                </div>
              </div>

              {/* PIO Details Section */}
              {!editingDepartment && (
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    PIO Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="pio_name"
                        className="block text-sm font-medium text-gray-700"
                      >
                        PIO Name
                      </label>
                      <input
                        type="text"
                        id="pio_name"
                        required
                        value={formData.pio_name}
                        onChange={(e) =>
                          setFormData({ ...formData, pio_name: e.target.value })
                        }
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="pio_email"
                        className="block text-sm font-medium text-gray-700"
                      >
                        PIO Email
                      </label>
                      <input
                        type="email"
                        id="pio_email"
                        required
                        value={formData.pio_email}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            pio_email: e.target.value,
                          })
                        }
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="pio_phone"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Phone
                      </label>
                      <input
                        type="tel"
                        id="pio_phone"
                        required
                        value={formData.pio_phone}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            pio_phone: e.target.value,
                          })
                        }
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="pio_password"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Password
                      </label>
                      <input
                        type="password"
                        id="pio_password"
                        required
                        value={formData.pio_password}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            pio_password: e.target.value,
                          })
                        }
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label
                        htmlFor="pio_address"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Address
                      </label>
                      <textarea
                        id="pio_address"
                        required
                        value={formData.pio_address}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            pio_address: e.target.value,
                          })
                        }
                        rows={3}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Submit + Cancel Buttons */}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingDepartment(null);
                    setFormData({
                      code: "",
                      name_en: "",
                      pio_name: "",
                      pio_email: "",
                      pio_phone: "",
                      pio_password: "",
                      pio_address: "",
                    });
                  }}
                  className="px-4 py-2 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300"
                >
                  {"Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md bg-black text-white hover:bg-gray-800"
                >
                  {editingDepartment ? "Update" : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminDashboardLayout>
  );
};

export default Departments;
