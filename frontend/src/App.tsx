import {BrowserRouter, Route, Routes} from "react-router-dom";

import {Chat} from "./components/Chat";
import {Login} from "./components/Login";
import {Navbar} from "./components/Navbar";
import {AuthContextProvider} from "./contexts/AuthContext";
import {ProtectedRoute} from "./components/ProtectedRoute";

// export default function App() {
//     const [welcomeMessage, setWelcomeMessage] = useState("");
//     const [messageHistory, setMessageHistory] = useState<any[]>([]);
//     const {sendJsonMessage} = useWebSocket("ws://127.0.0.1:8000/");
//
//
//     const [message, setMessage] = useState("");
//     const [name, setName] = useState("");
//
//     const {readyState} = useWebSocket("ws://127.0.0.1:8000/", {
//
//         onOpen: () => {
//             console.log("Connected!");
//         },
//
//         onClose: () => {
//             console.log("Disconnected!");
//         },
//
//         onMessage: (e) => {
//             console.log("Received message", e);
//             const data = JSON.parse(e.data);
//             switch (data.type) {
//                 case "welcome_message":
//                     setWelcomeMessage(data.message);
//                     break;
//                 case "chat_message_echo":
//                     setMessageHistory((prev: any) => prev.concat(data));
//                     break;
//                 default:
//                     console.error("Unknown message type!");
//                     break;
//             }
//         },
//
//         onError: (e) => {
//             console.error('WebSocket Error:', e);
//         },
//     });
//
//     const connectionStatus = {
//         [ReadyState.CONNECTING]: "Connecting",
//         [ReadyState.OPEN]: "Open",
//         [ReadyState.CLOSING]: "Closing",
//         [ReadyState.CLOSED]: "Closed",
//         [ReadyState.UNINSTANTIATED]: "Uninstantiated"
//     }[readyState];
//
//     function handleChangeMessage(e: any) {
//         setMessage(e.target.value);
//     }
//
//     function handleChangeName(e: any) {
//         setName(e.target.value);
//     }
//
//     const handleSubmit = () => {
//         sendJsonMessage({
//             type: "chat_message",
//             message,
//             name
//         });
//         setName("");
//         setMessage("");
//     };
//
//     return (
//         <div>
//             <span>The WebSocket is currently {connectionStatus}</span>
//             <p>{welcomeMessage}</p>
//             <input
//                 name="name"
//                 placeholder="Name"
//                 onChange={handleChangeName}
//                 value={name}
//                 className="shadow-sm sm:text-sm border-gray-300 bg-gray-100 rounded-md"
//             />
//             <input
//                 name="message"
//                 placeholder="Message"
//                 onChange={handleChangeMessage}
//                 value={message}
//                 className="ml-2 shadow-sm sm:text-sm border-gray-300 bg-gray-100 rounded-md"
//             />
//             <button className="ml-3 bg-gray-300 px-3 py-1" onClick={handleSubmit}>
//                 Submit
//             </button>
//             <hr/>
//             <ul>
//                 {messageHistory.map((message: any, idx: number) => (
//                     <div className="border border-gray-200 py-3 px-3" key={idx}>
//                         {message.name}: {message.message}
//                     </div>
//                 ))}
//             </ul>
//         </div>
//     );
// }

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
                    {/*<Route path="" element={<Chat/>}/>*/}
                    <Route path="login" element={<Login/>}/>

                    <Route
                        path=""
                        element={
                            <ProtectedRoute>
                                {/*<Conversations/>*/}
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="chats/:conversationName"
                        element={
                            <ProtectedRoute>
                                <Chat/>
                            </ProtectedRoute>
                        }
                    />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}
