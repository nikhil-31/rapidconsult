import {Link, Outlet} from "react-router-dom";
import {useContext} from "react";
import {AuthContext} from "../contexts/AuthContext";
import {NotificationContext} from "../contexts/NotificationContext";


export function Navbar() {
    const {user, logout} = useContext(AuthContext);
    const {unreadMessageCount} = useContext(NotificationContext)

    return (
        <>
            <nav className="bg-white shadow-md px-4 sm:px-6 py-2.5 rounded mb-6">
                <div className="max-w-5xl mx-auto flex flex-wrap justify-between items-center">
                    <Link to="/" className="flex items-center">
        <span className="self-center text-xl font-semibold whitespace-nowrap text-black">
          RapidConsult
        </span>
                    </Link>
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
                                        <Link to="/" className="block py-2 pr-4 pl-3 text-black md:p-0">Schedules</Link>
                                    </li>
                                    <li>
                                        <Link to="/" className="block py-2 pr-4 pl-3 text-black md:p-0">On-Call</Link>
                                    </li>
                                    <li>
                                        <Link to="/" className="block py-2 pr-4 pl-3 text-black md:p-0">Messages</Link>
                                    </li>
                                    <li>
                                        <Link to="/" className="block py-2 pr-4 pl-3 text-black md:p-0">Contacts</Link>
                                    </li>
                                </>
                            )}
                            <li className="flex items-center gap-2">
                                {user ? (
                                    <>
                                        {/* Profile Picture */}
                                        {user.profile_picture && (
                                            <img
                                                src={user.profile_picture}
                                                alt="Profile"
                                                className="w-8 h-8 rounded-full object-cover"
                                            />
                                        )}
                                        {/* Username */}
                                        <span className="text-black block py-2 pr-4 pl-3 md:p-0">
            Logged in: {user.username}</span>
                                        {/* Logout Button */}
                                        <button
                                            className="block py-2 pr-4 pl-3 text-black md:p-0"
                                            onClick={logout}
                                        >
                                            Logout
                                        </button>
                                    </>
                                ) : (
                                    <Link to="/login" className="block py-2 pr-4 pl-3 text-black md:p-0">Login</Link>
                                )}
                            </li>
                        </ul>
                    </div>


                </div>
            </nav>

            {/* Main content area with adequate spacing */}
            <div className="max-w-5xl mx-auto py-6 bg-white text-black">
                <Outlet/>
            </div>
        </>
    );
}
