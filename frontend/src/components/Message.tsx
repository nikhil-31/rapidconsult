import {useContext} from "react";
import {AuthContext} from "../contexts/AuthContext";
import {MessageModel} from "../models/MessageModel";

export function classNames(...classes: any) {
    return classes.filter(Boolean).join(" ");
}

export function Message({message}: { message: MessageModel }) {
    const {user} = useContext(AuthContext);
    const isOwnMessage = user!.username === message.from_user.username;

    function formatMessageTimestamp(timestamp: string) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
    }

    function formatDate(timestamp: string) {
        const date = new Date(timestamp);
        return date.toLocaleDateString([], {
            month: 'short',
            day: 'numeric'
        });
    }

    return (
        <li
            className={classNames(
                "mt-1 mb-1 flex",
                isOwnMessage ? "justify-end" : "justify-start"
            )}
        >
            <div
                className={classNames(
                    "relative max-w-xl rounded-lg px-2 py-1 text-gray-700 shadow",
                    isOwnMessage ? "bg-gray-100" : "bg-white"
                )}
            >
                <div className="flex flex-col space-y-1">
                    {message.file && (
                        <img
                            src={message.file}
                            alt="Sent image"
                            className="max-w-xs rounded"
                        />
                    )}
                    {message.content && (
                        <span className="block whitespace-pre-wrap break-words">{message.content}</span>
                    )}

                    <div className="text-right text-xs text-gray-500">
                        <div>
                            {formatMessageTimestamp(message.timestamp)}, {formatDate(message.timestamp)}
                            {isOwnMessage && (
                                <span className="ml-1">{message.read ? "✓✓ Read" : "✓ Sent"}</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </li>

    );
}
