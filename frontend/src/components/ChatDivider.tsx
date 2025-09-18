import React from "react";

interface ChatDividerProps {
    id: string | number;
    style?: "unread" | string;
    dateLabel: string;
}

export const ChatDivider: React.FC<ChatDividerProps> = ({id, style, dateLabel}) => {
    return (
        <div
            key={id}
            id={String(id)}
            className={`flex items-center my-3 ${
                style === "unread" ? "text-red-500" : "text-gray-500"
            }`}
        >
            <div className="flex-grow border-t border-gray-300"/>
            <span
                className={`px-3 text-xs font-medium ${
                    style === "unread"
                        ? "bg-red-50 border border-red-300 rounded-full"
                        : ""
                }`}
            >
                {dateLabel}
            </span>
            <div className="flex-grow border-t border-gray-300"/>
        </div>
    );
};
