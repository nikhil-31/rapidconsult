import React, {createContext, ReactNode, useContext, useEffect, useState} from "react";
import useWebSocket, {ReadyState} from "react-use-websocket";
import {AuthContext} from "./AuthContext";

const DefaultProps = {
    unreadMessageCount: 0,
    connectionStatus: "Uninstantiated",
};

export interface NotificationProps {
    unreadMessageCount: number;
    connectionStatus: string;
}

export const NotificationContext =
    createContext<NotificationProps>(DefaultProps);

export const NotificationContextProvider: React.FC<{ children: ReactNode }> = ({
                                                                                   children,
                                                                               }) => {
    const {user} = useContext(AuthContext);
    const [unreadMessageCount, setUnreadMessageCount] = useState(0);
    const wsUrl = process.env.REACT_APP_WS_URL;

    const {readyState, sendMessage} = useWebSocket(
        user ? `${wsUrl}/notifications/` : null,
        {
            queryParams: {
                token: user ? user.token : "",
            },
            onOpen: () => {
                console.log("Connected to Notifications!");
            },
            onClose: () => {
                console.log("Disconnected from Notifications!");
            },
            onMessage: (e) => {
                console.log("Received message", e);
                const data = JSON.parse(e.data);
                switch (data.type) {
                    case "unread_count":
                        setUnreadMessageCount(data.unread_count);
                        break;
                    case "new_message_notification":
                        setUnreadMessageCount((count) => (count += 1));
                        break;
                    case "user_status":
                        console.log(`User Message ${JSON.stringify(data)}`)
                        break;
                    case "pong":
                        console.log(`Pong ${JSON.stringify(data)}`)
                        break;
                    default:
                        console.error("Unknown message type!");
                        break;
                }
            },
        }
    );

    // 🔹 Heartbeat every 20 seconds
    useEffect(() => {
        if (readyState === ReadyState.OPEN) {
            const interval = setInterval(() => {
                sendMessage(JSON.stringify({type: "heartbeat"}));
            }, 20000);
            return () => clearInterval(interval);
        }
    }, [readyState, sendMessage]);

    const connectionStatus = {
        [ReadyState.CONNECTING]: "Connecting",
        [ReadyState.OPEN]: "Open",
        [ReadyState.CLOSING]: "Closing",
        [ReadyState.CLOSED]: "Closed",
        [ReadyState.UNINSTANTIATED]: "Uninstantiated",
    }[readyState];

    return (
        <NotificationContext.Provider
            value={{unreadMessageCount, connectionStatus}}
        >
            {children}
        </NotificationContext.Provider>
    );
};
