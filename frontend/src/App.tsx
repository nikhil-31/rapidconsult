import {BrowserRouter, Route, Routes} from "react-router-dom";

import {Login} from "./components/Login";
import {Navbar} from "./components/Navbar";
import {AuthContextProvider} from "./contexts/AuthContext";
import {ProtectedRoute} from "./components/ProtectedRoute";
import {NotificationContextProvider} from "./contexts/NotificationContext";
import CalendarView from "./components/Schedules";
import Contacts from "./components/Contacts";
import Admin from "./components/Admin";
import Profile from "./components/Profile";
import EditProfile from "./components/EditProfile";
import OnCall from "./components/OnCall";
import {LocationProvider} from "./contexts/LocationContext";
import Vox from "./components/Vox";
import NotFound from "./components/NotFound";
import Consults from "./components/Consults";

export default function App() {
    return (
        <BrowserRouter>
            <AuthContextProvider>
                <LocationProvider>
                    <Routes>
                        <Route
                            path="/"
                            element={
                                <NotificationContextProvider>
                                    <Navbar/>
                                </NotificationContextProvider>
                            }
                        >
                            <Route path="login" element={
                                <Login/>
                            }/>
                            <Route path="" element={
                                <ProtectedRoute>
                                    <Vox/>
                                </ProtectedRoute>
                            }/>
                            <Route path="/oncall" element={
                                <ProtectedRoute>
                                    <OnCall/>
                                </ProtectedRoute>
                            }/>
                            <Route path="/contacts" element={
                                <ProtectedRoute>
                                    <Contacts/>
                                </ProtectedRoute>
                            }/>
                            <Route path="/schedules" element={
                                <ProtectedRoute>
                                    <CalendarView/>
                                </ProtectedRoute>
                            }/>
                            <Route path="/consults" element={
                                <ProtectedRoute>
                                    <Consults/>
                                </ProtectedRoute>
                            }/>
                            <Route path="/admin" element={
                                <ProtectedRoute>
                                    <Admin/>
                                </ProtectedRoute>
                            }/>
                            <Route path="/profile" element={
                                <ProtectedRoute>
                                    <Profile/>
                                </ProtectedRoute>
                            }/>
                            <Route
                                path="/profile/edit"
                                element={
                                    <ProtectedRoute>
                                        <EditProfile/>
                                    </ProtectedRoute>
                                }
                            />
                        </Route>
                        <Route
                            path="*"
                            element={
                                <ProtectedRoute>
                                    <NotFound/>
                                </ProtectedRoute>
                            }
                        />
                    </Routes>
                </LocationProvider>
            </AuthContextProvider>
        </BrowserRouter>
    );
}
