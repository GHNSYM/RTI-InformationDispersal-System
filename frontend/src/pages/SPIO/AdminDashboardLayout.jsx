import { Fragment, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { Dialog, Transition, Menu } from "@headlessui/react";
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  DocumentTextIcon,
  UserGroupIcon,
  BellIcon,
  UserCircleIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import axiosInstance from "../../middleware/axiosInstance";

const AdminDashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const navigation = [
    {
      name: "Home",
      href: "/admin",
      icon: HomeIcon,
      current: location.pathname === "/admin",
    },    {
      name: "Departments",
      href: "/viewDepartments",
      icon: UserGroupIcon,
      current: location.pathname === "/viewDepartments",
    },
    {
      name: "All Requests",
      href: "/adminRequests",
      icon: DocumentTextIcon,
      current: location.pathname.startsWith("/adminRequests"),
    },
    {
      name: "SPIO Assistants",
      href: "/spio-assistants",
      icon: UsersIcon,
      current: location.pathname === "/spio-assistants",
    },
  ];

  const handleLogout = async () => {
    try {
      // Call logout endpoint
      await axiosInstance.post(
        "/api/auth/logout",
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      // Clear token and user data
      localStorage.removeItem("token");

      // Redirect to login
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile sidebar */}
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50 lg:hidden"
          onClose={setSidebarOpen}
        >
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child as={Fragment}>
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-blue-400 px-6 pb-4">                  <div className="flex h-16 shrink-0 items-center">
                    <h1 className="text-3xl font-bold text-white">RTI Portal</h1>
                  </div>
                  <nav className="flex flex-1 flex-col">
                    <ul role="list" className="flex flex-1 flex-col gap-y-7">
                      <li>
                        <ul role="list" className="-mx-2 space-y-1">
                          {navigation.map((item) => (
                            <li key={item.name}>
                              <Link
                                to={item.href}
                                className={`
                                  group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-all duration-200
                                  ${
                                    item.current
                                      ? "bg-white text-black"
                                      : "text-white hover:bg-blue-500"
                                  }
                                `}
                              >
                                <item.icon
                                  className={`h-6 w-6 shrink-0 transition-colors ${
                                    item.current
                                      ? "text-black"
                                      : "text-white group-hover:text-white"
                                  }`}
                                  aria-hidden="true"
                                />
                                {item.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </li>
                    </ul>
                  </nav>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Static sidebar for desktop */}      
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-56 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gradient-to-b from-blue-600 to-blue-400 px-6 pb-4 backdrop-blur-sm">          <div className="flex h-16 shrink-0 items-center">
            <h1 className="text-4xl font-bold text-white">RTI Portal</h1>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        className={`
                          group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-all duration-200
                          ${
                            item.current
                              ? "bg-white text-black"
                              : "text-white hover:bg-blue-500"
                          }
                        `}
                      >
                        <item.icon
                          className={`h-6 w-6 shrink-0 transition-colors ${
                            item.current
                              ? "text-black"
                              : "text-white group-hover:text-white"
                          }`}
                          aria-hidden="true"
                        />
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      <div className="lg:pl-56">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 bg-blue-600 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-white hover:text-gray-200 transition-colors lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1" />
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {/* Notification Dropdown */}
              <Menu as="div" className="relative">
                <Menu.Button className="flex items-center text-white hover:text-gray-200 transition-colors">
                  <span className="sr-only">View notifications</span>
                  <BellIcon className="h-6 w-6" aria-hidden="true" />
                </Menu.Button>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute right-0 z-10 mt-2 w-80 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="px-4 py-3">
                      <h3 className="text-sm font-medium text-gray-900">
                        Notifications
                      </h3>
                    </div>
                    <div className="px-4 py-3 border-t border-gray-100">
                      <p className="text-sm text-gray-500">
                        No new notifications
                      </p>
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
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="px-4 py-3 space-y-1">
                      <p className="text-sm font-medium text-gray-900">
                        {user?.name}
                      </p>
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

        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
};

// Add global styles for buttons
const globalStyles = `
  button:not([type="submit"]) {
    @apply bg-black text-white rounded-lg px-4 py-2 transition-all duration-200 hover:scale-105;
  }
`;

export default AdminDashboardLayout;
