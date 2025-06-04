import {useContext, useEffect, useRef, useState} from "react";
import useWebSocket, {ReadyState} from "react-use-websocket";
import {AuthContext} from "../contexts/AuthContext"
import {useParams} from "react-router-dom";
import {MessageModel} from "../models/MessageModel";
import {Message} from "./Message";
import {ChatLoader} from "./ChatLoader";
import InfiniteScroll from "react-infinite-scroll-component";
import {useHotkeys} from "react-hotkeys-hook";


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

    const inputReference: any = useHotkeys(
        "enter",
        () => {
            handleSubmit();
        },
        {
            enableOnTags: ["INPUT"]
        }
    );

    useEffect(() => {
        (inputReference.current as HTMLElement).focus();
    }, [inputReference]);

    const {readyState, sendJsonMessage} =
        useWebSocket(user ? `ws://127.0.0.1:8000/${conversationName}/` : null, {
            queryParams: {
                token: user ? user.token : "",
            },

            onOpen: () => {
                console.log("Connected!");
            },

            onClose: () => {
                console.log("Disconnected!");
            },

            onMessage: (e) => {
                console.log("Received message", e);
                const data = JSON.parse(e.data);
                switch (data.type) {
                    case "welcome_message":
                        setWelcomeMessage(data.message);
                        break;
                    case "chat_message_echo":
                        setMessageHistory((prev: any) => [data.message, ...prev]);
                        break;
                    case "last_50_messages":
                        setMessageHistory(data.messages);
                        setHasMoreMessages(data.has_more);
                        break;
                    case 'typing':
                        updateTyping(data);
                        break;
                    default:
                        console.error("Unknown message type!");
                        break;
                }
            },

            onError: (e) => {
                console.error('WebSocket Error:', e);
            },
        });

    const connectionStatus = {
        [ReadyState.CONNECTING]: "Connecting",
        [ReadyState.OPEN]: "Open",
        [ReadyState.CLOSING]: "Closing",
        [ReadyState.CLOSED]: "Closed",
        [ReadyState.UNINSTANTIATED]: "Uninstantiated"
    }[readyState];

    function handleChangeMessage(e: any) {
        setMessage(e.target.value);
        onType()
    }

    function handleChangeName(e: any) {
        setName(e.target.value);
    }

    const handleSubmit = () => {
        if (message.length === 0) return;
        if (message.length > 512) return;
        sendJsonMessage({
            type: "chat_message",
            message,
            name
        });
        setName("");
        setMessage("");
        if (timeout.current) {
            clearTimeout(timeout.current);
        }
        timeoutFunction();
    };

    async function fetchMessages() {
        const apiRes = await fetch(
            `http://127.0.0.1:8000/api/messages/?conversation=${conversationName}&page=${page}`,
            {
                method: "GET",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    Authorization: `Token ${user?.token}`
                }
            }
        );
        if (apiRes.status === 200) {
            const data: {
                count: number;
                next: string | null; // URL
                previous: string | null; // URL
                results: MessageModel[];
            } = await apiRes.json();
            setHasMoreMessages(data.next !== null);
            setPage(page + 1);
            setMessageHistory((prev: MessageModel[]) => prev.concat(data.results));
        }
    }

    // Typing stuff
    function timeoutFunction() {
        setMeTyping(false);
        sendJsonMessage({type: "typing", typing: false});
    }

    function onType() {
        if (!meTyping) {
            setMeTyping(true);
            sendJsonMessage({type: "typing", typing: true});
        }
        if (timeout.current) {
            clearTimeout(timeout.current);
        }
        timeout.current = setTimeout(timeoutFunction, 5000);
    }

    useEffect(() => {
        return () => {
            if (timeout.current) {
                clearTimeout(timeout.current);
            }
        };
    }, []);

    function updateTyping(event: { user: string; typing: boolean }) {
        if (event.user !== user!.username) {
            setTyping(event.typing);
        }
    }

    return (
        <div>
            <span>The WebSocket is currently {connectionStatus}</span>
            <p>{welcomeMessage}</p>
            {typing && (
                <p className="truncate text-sm text-gray-500">typing...</p>
            )}
            <input
                name="message"
                value={message}
                onChange={handleChangeMessage}
                required
                ref={inputReference}
                maxLength={511}
                type="text"
                placeholder="Message"
                className="ml-2 shadow-sm sm:text-sm border-gray-300 bg-gray-100 rounded-md"
            />
            <button className="ml-3 bg-gray-300 px-3 py-1" onClick={handleSubmit}>
                Submit
            </button>
            <hr/>
            <div
                id="scrollableDiv"
                className="h-[20rem] mt-3 flex flex-col-reverse relative w-full border border-gray-200 overflow-y-auto p-6"
            >
                <div>
                    {/* Put the scroll bar always on the bottom */}
                    <InfiniteScroll
                        dataLength={messageHistory.length}
                        next={fetchMessages}
                        className="flex flex-col-reverse" // To put endMessage and loader to the top
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
            </div>
        </div>
    );
}
