import {useContext, useEffect, useRef, useState} from "react";
import useWebSocket, {ReadyState} from "react-use-websocket";
import {AuthContext} from "../contexts/AuthContext";
import {useParams} from "react-router-dom";
import {MessageModel} from "../models/MessageModel";
import {Message} from "./Message";
import {ChatLoader} from "./ChatLoader";
import InfiniteScroll from "react-infinite-scroll-component";
import {useHotkeys} from "react-hotkeys-hook";
import {ConversationModel} from "../models/Conversation";

export function Chat() {
    const [welcomeMessage, setWelcomeMessage] = useState("");
    const [messageHistory, setMessageHistory] = useState<any>([]);
    const {user} = useContext(AuthContext);
    const [message, setMessage] = useState("");
    const [name, setName] = useState("");
    const {conversationName} = useParams();
    const [page, setPage] = useState(2);
    const [hasMoreMessages, setHasMoreMessages] = useState(false);
    const [meTyping, setMeTyping] = useState(false);
    const [typing, setTyping] = useState(false);
    const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [participants, setParticipants] = useState<string[]>([]);
    const [conversation, setConversation] = useState<ConversationModel | null>(null);
    const [shouldConnect, setShouldConnect] = useState(true);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [fileToUpload, setFileToUpload] = useState<File | null>(null);
    const apiUrl = process.env.REACT_APP_API_URL;
    const wsUrl = process.env.REACT_APP_WS_URL;

    const inputReference: any = useHotkeys(
        "enter",
        () => handleSubmit(),
        {enableOnTags: ["INPUT"]}
    );

    useEffect(() => {
        (inputReference.current as HTMLElement).focus();
    }, [inputReference]);

    const {readyState, sendJsonMessage} = useWebSocket(
        user ? `${wsUrl}/chats/${conversationName}/` : null,
        {
            shouldReconnect: () => false,
            retryOnError: false,
            share: true,
            queryParams: {
                token: user ? user.token : "",
            },
            onOpen: () => {
                console.log("Connected!");
                setInterval(() => sendJsonMessage({type: "ping"}), 30000);
            },
            onClose: () => console.log("Disconnected Message!"),
            onMessage: (e) => {
                const data = JSON.parse(e.data);
                switch (data.type) {
                    case "welcome_message":
                        setWelcomeMessage(data.message);
                        break;
                    case "chat_message_echo":
                        setMessageHistory((prev: any) => [data.message, ...prev]);
                        sendJsonMessage({type: "read_messages"});
                        break;
                    case "last_50_messages":
                        setMessageHistory(data.messages);
                        setHasMoreMessages(data.has_more);
                        break;
                    case "typing":
                        updateTyping(data);
                        break;
                    case "user_join":
                        setParticipants((pcpts: string[]) =>
                            pcpts.includes(data.user) ? pcpts : [...pcpts, data.user]
                        );
                        break;
                    case "user_leave":
                        setParticipants((pcpts: string[]) =>
                            pcpts.filter((x) => x !== data.user)
                        );
                        break;
                    case "online_user_list":
                        setParticipants(data.users);
                        break;
                    case "message_read":
                        setMessageHistory((prev: MessageModel[]) =>
                            prev.map((msg) =>
                                msg.id === data.message_id ? {...msg, read: true} : msg
                            )
                        );
                        break;
                    case "pong":
                        break;
                    case "unread_count":
                        break;
                    default:
                        console.error("Unknown message type!", data.type);
                        break;
                }
            },
            onError: (e) => console.error("WebSocket Error:", e),
        },
        shouldConnect
    );

    const closeSocket = () => setShouldConnect(false);
    const openSocket = () => setShouldConnect(true);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") openSocket();
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () =>
            document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, []);

    const connectionStatus = {
        [ReadyState.CONNECTING]: "Connecting",
        [ReadyState.OPEN]: "Open",
        [ReadyState.CLOSING]: "Closing",
        [ReadyState.CLOSED]: "Closed",
        [ReadyState.UNINSTANTIATED]: "Uninstantiated",
    }[readyState];

    useEffect(() => {
        if (connectionStatus === "Open") {
            sendJsonMessage({type: "read_messages"});
        }
    }, [connectionStatus]);

    function handleChangeMessage(e: any) {
        setMessage(e.target.value);
        onType();
    }

    const handleSubmit = () => {
        if (message.length === 0 || message.length > 512) return;
        sendJsonMessage({
            type: "chat_message",
            message,
            name,
        });
        setMessage("");
        if (timeout.current) clearTimeout(timeout.current);
        timeoutFunction();
    };

    async function fetchMessages() {
        const res = await fetch(
            `${apiUrl}/api/messages/?conversation=${conversationName}&page=${page}`,
            {
                method: "GET",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    Authorization: `Token ${user?.token}`,
                },
            }
        );
        if (res.status === 200) {
            const data = await res.json();
            setHasMoreMessages(data.next !== null);
            setPage(page + 1);
            setMessageHistory((prev: MessageModel[]) => prev.concat(data.results));
        }
    }

    useEffect(() => {
        async function fetchConversation() {
            const res = await fetch(`${apiUrl}/api/conversations/${conversationName}/`, {
                method: "GET",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    Authorization: `Token ${user?.token}`,
                },
            });
            if (res.status === 200) {
                const data: ConversationModel = await res.json();
                setConversation(data);
            }
        }

        fetchConversation();
    }, [conversationName, user]);

    function timeoutFunction() {
        setMeTyping(false);
        sendJsonMessage({type: "typing", typing: false});
    }

    function onType() {
        if (!meTyping) {
            setMeTyping(true);
            sendJsonMessage({type: "typing", typing: true});
        }
        if (timeout.current) clearTimeout(timeout.current);
        timeout.current = setTimeout(timeoutFunction, 5000);
    }

    useEffect(() => () => {
        if (timeout.current) clearTimeout(timeout.current);
    }, []);

    function updateTyping(event: { user: string; typing: boolean }) {
        if (event.user !== user!.username) setTyping(event.typing);
    }

    function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setFileToUpload(file);
        const reader = new FileReader();
        reader.onloadend = () => setPreviewImage(reader.result as string);
        reader.readAsDataURL(file);
    }

    async function handleSendImage() {
        if (!fileToUpload || !user) return;
        const formData = new FormData();
        formData.append("file", fileToUpload);
        formData.append("conversation", conversationName!);
        try {
            const res = await fetch(`${apiUrl}/api/messages/image/`, {
                method: "POST",
                headers: {Authorization: `Token ${user.token}`},
                body: formData,
            });
            if (res.ok) {
                const data = await res.json();
                sendJsonMessage({
                    type: "chat_message",
                    message: "",
                    file_url: data.file,
                    name,
                });
                setMessageHistory((prev: MessageModel[]) => [data, ...prev]);
                setPreviewImage(null);
                setFileToUpload(null);
            } else {
                console.error("Failed to send image");
            }
        } catch (error) {
            console.error("Image send error:", error);
        }
    }

    return (
        <div className="flex flex-col h-[80vh] border rounded shadow-md">
            {/* Header */}
            <div className="p-3 border-b bg-white">
                <span className="text-xs text-gray-500">
                    WebSocket: {connectionStatus}
                </span>
                <div className="mt-2 flex gap-2">
                    <button className="px-2 py-1 bg-gray-200 rounded" onClick={closeSocket}>Close</button>
                    <button className="px-2 py-1 bg-gray-200 rounded" onClick={openSocket}>Open</button>
                </div>
                <p className="mt-2 text-sm text-gray-700">{welcomeMessage}</p>
                {conversation && (
                    <div className="mt-2 text-sm">
                        <strong>{conversation.other_user.username}</strong> is{" "}
                        <span
                            className={participants.includes(conversation.other_user.username) ? "text-green-600" : "text-red-500"}>
                            {participants.includes(conversation.other_user.username) ? "online" : "offline"}
                        </span>
                        {typing && <p className="italic text-gray-500">typing...</p>}
                    </div>
                )}
            </div>

            {/* Messages */}
            <div id="scrollableDiv" className="flex-1 overflow-y-auto flex flex-col-reverse p-3 bg-gray-50">
                <InfiniteScroll
                    dataLength={messageHistory.length}
                    next={fetchMessages}
                    className="flex flex-col-reverse"
                    inverse={true}
                    hasMore={hasMoreMessages}
                    loader={<ChatLoader/>}
                    scrollableTarget="scrollableDiv"
                >
                    {messageHistory.map((message: MessageModel) => (
                        <Message key={message.id} message={message}/>
                    ))}
                </InfiniteScroll>
            </div>

            {/* Image Preview */}
            {previewImage && (
                <div className="p-3 bg-gray-100 border-t">
                    <p className="text-sm text-gray-700 mb-1">Image Preview:</p>
                    <img src={previewImage} alt="Preview" className="max-w-xs rounded mb-2"/>
                    <div className="flex gap-2">
                        <button className="bg-green-500 text-white px-3 py-1 rounded" onClick={handleSendImage}>Send
                            Image
                        </button>
                        <button className="bg-red-500 text-white px-3 py-1 rounded" onClick={() => {
                            setPreviewImage(null);
                            setFileToUpload(null);
                        }}>Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Input */}
            <div className="border-t p-3 flex items-center space-x-2 bg-white">
                <input
                    name="message"
                    value={message}
                    onChange={handleChangeMessage}
                    ref={inputReference}
                    maxLength={511}
                    type="text"
                    placeholder="Message"
                    className="w-full px-2 py-1 text-sm border rounded bg-gray-100"
                />
                <button className="bg-blue-500 text-white px-3 py-1 rounded" onClick={handleSubmit}>Send</button>
                <input type="file" accept="image/*" onChange={handleImageUpload}/>
            </div>
        </div>
    );
}
