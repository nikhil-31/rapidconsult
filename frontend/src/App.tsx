import {BrowserRouter, Route, Routes} from "react-router-dom";

import {Chat} from "./components/Chat";
import {Login} from "./components/Login";
import {Navbar} from "./components/Navbar";
import {AuthContextProvider} from "./contexts/AuthContext";
import {ProtectedRoute} from "./components/ProtectedRoute";
import {Conversations} from "./components/Conversations";
import {ActiveConversations} from "./components/ActiveConversations";


export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route
                    path="/"
                    element={
                        <AuthContextProvider>
                            <Navbar/>
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
        </BrowserRouter>
    );
}
