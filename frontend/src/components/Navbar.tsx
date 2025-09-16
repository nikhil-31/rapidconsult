import {Link, Outlet, useLocation} from "react-router-dom";
import {useContext, useState, useRef, useEffect} from "react";
import {AuthContext} from "../contexts/AuthContext";
import {NotificationContext} from "../contexts/NotificationContext";
import {useOrgLocation} from "../contexts/LocationContext";
import {OrgLocation} from "../models/OrgLocation";
import {Select} from 'antd';


export function Navbar() {
    const {Option} = Select;
    const {user, logout} = useContext(AuthContext);
    const {unreadMessageCount} = useContext(NotificationContext);
    const {selectedLocation, setSelectedLocation} = useOrgLocation();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLLIElement | null>(null);
    const location = useLocation();
    const orgs = user?.organizations || [];

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const isActive = (path: string) =>
        location.pathname === path || location.pathname.startsWith(path + "/");

    const handleLocationChange = (locationId: number) => {
        for (const org of orgs) {
            const found = org.allowed_locations.find((loc) => loc.id === locationId);
            if (found) {
                const orgLocation: OrgLocation = {
                    organization: org.organization,
                    location: found,
                };
                setSelectedLocation(orgLocation);
                break;
            }
        }
    };

    return (
        <>
            <div className="flex flex-col min-h-screen">
                <nav className="bg-white shadow-md px-4 sm:px-6 py-2.5 rounded">
                    <div className="max-w-5xl mx-auto flex flex-wrap justify-between items-center">
                        <div className="flex items-center gap-4">
                            <Link to="/" className="flex items-center">
                                <span className="self-center text-xl font-semibold whitespace-nowrap text-black">
                                    RapidConsult
                                </span>
                            </Link>

                            {user && orgs.length > 0 && (
                                <Select
                                    style={{width: 280}}
                                    placeholder="Select Location"
                                    value={selectedLocation?.location?.id || undefined}
                                    onChange={handleLocationChange}
                                    size="middle"
                                    optionLabelProp="label"
                                    dropdownStyle={{padding: '4px 0'}}
                                >
                                    {orgs.map((org) =>
                                        org.allowed_locations.map((loc) => (
                                            <Option key={loc.id} value={loc.id} label={loc.name}>
                                                <div style={{padding: '4px 8px',}}>
                                                    <div style={{fontWeight: 500}}>{loc.name}</div>
                                                    <div style={{fontSize: '12px', color: '#999'}}>
                                                        {org.organization.name}
                                                    </div>
                                                </div>
                                            </Option>
                                        ))
                                    )}
                                </Select>
                            )}
                        </div>

                        <div className="hidden w-full md:block md:w-auto text-center" id="mobile-menu">
                            <ul className="flex flex-col items-center mt-4 md:flex-row md:justify-center md:space-x-8 md:mt-0 md:text-sm md:font-medium">
                                {user && (
                                    <>
                                        <li>
                                            <Link
                                                to="/consults"
                                                className={`block py-2 pr-4 pl-3 md:p-0 ${
                                                    isActive("/consults")
                                                        ? "text-red-700 font-semibold"
                                                        : "text-black"
                                                }`}
                                            >
                                                Consults
                                            </Link>
                                        </li>
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
                                                    isActive("/oncall")
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
                                                    <Link
                                                        to="/profile"
                                                        className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                    >
                                                        Profile
                                                    </Link>
                                                    <hr className="border-gray-200"/>
                                                    <Link
                                                        to="/admin"
                                                        className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                    >
                                                        Admin
                                                    </Link>
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

                <div className="flex-1 overflow-auto bg-white">
                    <Outlet/>
                </div>
            </div>
        </>
    )
        ;
}
