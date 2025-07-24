import {Link, Outlet, useLocation} from "react-router-dom";
import {useContext, useState, useRef, useEffect} from "react";
import {AuthContext} from "../contexts/AuthContext";
import {NotificationContext} from "../contexts/NotificationContext";
import {OrganizationProfile} from "../models/OrganizationProfile";
import {useOrg} from "../contexts/OrgContext";

export function Navbar() {
    const {user, logout} = useContext(AuthContext);
    const {unreadMessageCount} = useContext(NotificationContext);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLLIElement | null>(null);
    const location = useLocation();
    const orgs = user?.organizations || [];
    const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
    const orgDropDownRef = useRef<HTMLDivElement>(null);
    const {selectedOrg, setSelectedOrg} = useOrg();

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
            if (orgDropDownRef.current && !orgDropDownRef.current.contains(event.target as Node)) {
                setOrgDropdownOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (orgs.length > 0) {
            const storedOrg = localStorage.getItem("org_select");
            if (storedOrg) {
                const parsedOrg = JSON.parse(storedOrg);
                const matchedOrg = orgs.find(
                    (org) => org.organization_id === parsedOrg.organization_id
                );
                if (matchedOrg) {
                    setSelectedOrg(matchedOrg);
                    return;
                }
            }
            setSelectedOrg(orgs[0]); // fallback if no match found
        }
    }, [orgs]);

    function handleOrgChange(org: OrganizationProfile) {
        // You can update currentOrg in context or local state
        if (selectedOrg?.organization_id !== org.organization_id) {
            console.log("Switched org to: ", org.organization_name, org.organization_id);
            setSelectedOrg(org);
            localStorage.setItem("org_select", JSON.stringify(org));
        }
        setOrgDropdownOpen(false);
    }

    const isActive = (path: string) =>
        location.pathname === path || location.pathname.startsWith(path + "/");

    return (
        <>
            <div className="flex flex-col min-h-screen">

                <nav className="bg-white shadow-md px-4 sm:px-6 py-2.5 rounded">
                    <div className="max-w-5xl mx-auto flex flex-wrap justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Link to="/" className="flex items-center">
                                <span className="self-center text-xl font-semibold whitespace-nowrap text-black">
                                  RapidConsult
                                </span>
                            </Link>

                            {orgs.length > 0 && selectedOrg && (
                                <div className="relative" ref={orgDropDownRef}>
                                    <button
                                        onClick={() => setOrgDropdownOpen((prev) => !prev)}
                                        className="text-base font-semibold bg-white px-9 py-2 rounded-md hover:bg-gray-200 md:font-medium"
                                    >
                                        {selectedOrg.organization_name}
                                        <svg
                                            className="inline w-4 h-4 ml-1"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M19 9l-7 7-7-7"
                                            />
                                        </svg>
                                    </button>

                                    {orgDropdownOpen && (
                                        <div
                                            className="absolute left-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-20">
                                            {orgs.map((org) => (
                                                <div
                                                    key={org.organization_id}
                                                    className="px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                                                    onClick={() => handleOrgChange(org)}
                                                >
                                                    {org.organization_name}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <button
                            data-collapse-toggle="mobile-menu"
                            type="button"
                            className="inline-flex items-center p-2 ml-3 text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
                            aria-controls="mobile-menu"
                            aria-expanded="false"
                        >
                            <span className="sr-only">Open main menu</span>
                            {/* ...hamburger and close icons... */}
                        </button>

                        <div className="hidden w-full md:block md:w-auto text-center" id="mobile-menu">
                            <ul className="flex flex-col items-center mt-4 md:flex-row md:justify-center md:space-x-8 md:mt-0 md:text-sm md:font-medium">
                                {user && (
                                    <>
                                        <li>
                                            <Link
                                                to="/schedules"
                                                className={`block py-2 pr-4 pl-3 md:p-0 ${
                                                    isActive("/schedules")
                                                        ? "text-red-700 font-semibold"
                                                        : "text-black"
                                                }`}
                                            >
                                                Schedules
                                            </Link>
                                        </li>
                                        <li>
                                            <Link
                                                to="/oncall"
                                                className={`block py-2 pr-4 pl-3 md:p-0 ${
                                                    location.pathname === "/oncall"
                                                        ? "text-red-700 font-semibold"
                                                        : "text-black"
                                                }`}
                                            >
                                                On-Call
                                            </Link>
                                        </li>
                                        <li>
                                            <Link
                                                to="/"
                                                className={`block py-2 pr-4 pl-3 md:p-0 ${
                                                    isActive("/")
                                                        ? "text-red-700 font-semibold"
                                                        : "text-black"
                                                }`}
                                            >
                                                Messages
                                                {unreadMessageCount > 0 && (
                                                    <span
                                                        className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                                                    {unreadMessageCount}
                                                </span>
                                                )}
                                            </Link>
                                        </li>
                                        <li>
                                            <Link
                                                to="/contacts"
                                                className={`block py-2 pr-4 pl-3 md:p-0 ${
                                                    isActive("/contacts")
                                                        ? "text-red-700 font-semibold"
                                                        : "text-black"
                                                }`}
                                            >
                                                Contacts
                                            </Link>
                                        </li>
                                    </>
                                )}

                                <li className="relative" ref={dropdownRef}>
                                    {user ? (
                                        <>
                                            <button
                                                onClick={() => setDropdownOpen((prev) => !prev)}
                                                className="flex items-center gap-2 focus:outline-none"
                                            >
                                                <img
                                                    src={user.profile_picture || "/doctor-default.png"}
                                                    alt="Profile"
                                                    className="w-8 h-8 rounded-full object-cover"
                                                />
                                            </button>

                                            {dropdownOpen && (
                                                <div
                                                    className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-md z-10">
                                                    <div className="px-4 py-2 text-sm text-gray-700">
                                                        Logged in: <strong>{user.username}</strong>
                                                    </div>
                                                    <hr className="border-gray-200"/>
                                                    <button
                                                        onClick={logout}
                                                        className="block w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                                    >
                                                        Logout
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <Link
                                            to="/login"
                                            className={`block py-2 pr-4 pl-3 md:p-0 ${
                                                isActive("/login")
                                                    ? "text-red-700 font-semibold"
                                                    : "text-black"
                                            }`}
                                        >
                                            Login
                                        </Link>
                                    )}
                                </li>
                            </ul>
                        </div>
                    </div>
                </nav>

                <hr className="border-t border-gray-300"/>

                {/* Main content area */}
                <div className="flex-1 overflow-auto bg-green-600 ">
                    <Outlet/>
                </div>
            </div>
        </>
    );
}
