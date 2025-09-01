import React, {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
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
    const wsUrl = process.env.REACT_APP_WS_URL;

    // 🔹 Memoize socket URL so it doesn’t rebuild unnecessarily
    const socketUrl = useMemo(
        () => (user ? `${wsUrl}/notifications/` : null),
        [user, wsUrl]
    );

    const {readyState, sendMessage} = useWebSocket(socketUrl, {
        queryParams: {
            token: user ? user.token : "",
        },
        shouldReconnect: () => true,
        reconnectAttempts: Infinity,
        reconnectInterval: 5000,
        onOpen: () => {
            console.log("Connected to Notifications!");
        },
        onClose: () => {
            console.warn("Disconnected from Notifications!");
        },
        onMessage: (e) => {
            try {
                const data = JSON.parse(e.data);
                switch (data.type) {
                    case "unread_count":
                        break;
                    case "new_message_notification":
                        break;
                    case "user_status":
                        console.log(`User Status: ${JSON.stringify(data)}`);
                        break;
                    case "pong":
                        console.log("🔄 Pong received (heartbeat ok)");
                        break;
                    default:
                        console.error("⚠️ Unknown message type notification!", data);
                }
            } catch (err) {
                console.error("Failed to parse WS message:", e.data);
            }
        },
    });

    // 🔹 Heartbeat every 15 seconds
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
    }[readyState] || "Unknown";

    return (
        <NotificationContext.Provider
            value={{unreadMessageCount, connectionStatus}}
        >
            {children}
        </NotificationContext.Provider>
    );
};
