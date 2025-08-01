import {BrowserRouter, Route, Routes} from "react-router-dom";

import {Chat} from "./components/Chat";
import {Login} from "./components/Login";
import {Navbar} from "./components/Navbar";
import {AuthContextProvider} from "./contexts/AuthContext";
import {ProtectedRoute} from "./components/ProtectedRoute";
import {Conversations} from "./components/Conversations";
import {ActiveConversations} from "./components/ActiveConversations";
import {NotificationContextProvider} from "./contexts/NotificationContext";
import CalendarView from "./components/Schedules";
import {OnCall} from "./components/OnCall";
import {Contacts} from "./components/Contacts";
import {OrgProvider} from "./contexts/OrgContext";
import Admin from "./components/Admin";
import Profile from "./components/Profile";
import EditProfile from "./components/EditProfile";
// import {Profile} from "./components/Profile";


export default function App() {
    return (
        <BrowserRouter>
            <OrgProvider>
                <Routes>
                    <Route
                        path="/"
                        element={
                            <AuthContextProvider>
                                <NotificationContextProvider>
                                    <Navbar/>
                                </NotificationContextProvider>
                            </AuthContextProvider>
                        }
                    >
                        <Route path="login" element={<Login/>}/>
                        <Route path="" element={<Conversations/>}/>
                        <Route
                            path="chats/:conversationName"
                            element={
                                <ProtectedRoute>
                                    <Chat/>
                                </ProtectedRoute>
                            }
                        />
                        <Route path="/oncall" element={<OnCall/>}/>
                        <Route path="/contacts" element={<Contacts/>}/>
                        <Route path="/schedules" element={<CalendarView/>}/>
                        <Route path="/admin" element={<Admin/>}/>
                        <Route path="/profile" element={<Profile/>}/>
                        <Route path="/profile/edit" Component={EditProfile}/>
                        <Route
                            path="conversations/"
                            element={
                                <ProtectedRoute>
                                    <ActiveConversations/>
                                </ProtectedRoute>
                            }
                        />
                    </Route>
                </Routes>
            </OrgProvider>
        </BrowserRouter>
    );
}
