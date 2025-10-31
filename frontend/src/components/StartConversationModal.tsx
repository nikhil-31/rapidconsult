import React, {useState, useEffect, useCallback} from "react";
import {Modal, Input, List, Avatar, Spin, Empty, Button} from "antd";
import {UserOutlined, SearchOutlined, TeamOutlined} from "@ant-design/icons";
import debounce from "lodash/debounce";
import {searchUsers} from "../api/services";
import {UserModel} from "../models/UserModel";
import {useOrgLocation} from "../contexts/LocationContext";

interface StartConversationModalProps {
    open: boolean;
    onClose: () => void;
    onSelectUser: (user: UserModel) => void;
    onCreateGroup: () => void;
}

const StartConversationModal: React.FC<StartConversationModalProps> = ({
                                                                           open,
                                                                           onClose,
                                                                           onSelectUser,
                                                                           onCreateGroup
                                                                       }) => {
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<UserModel[]>([]);
    const [error, setError] = useState<string | null>(null);

    const {selectedLocation} = useOrgLocation()

    // Debounced search
    const handleSearch = useCallback(
        debounce(async (q: string) => {
            if (!q.trim()) {
                setUsers([]);
                return;
            }
            try {
                setLoading(true);
                setError(null);
                const results = await searchUsers(q,
                    selectedLocation?.organization.id,
                    selectedLocation?.location.id);
                setUsers(results);
            } catch (err) {
                console.error("Error fetching users:", err);
                setError("Failed to load users");
            } finally {
                setLoading(false);
            }
        }, 500),
        [selectedLocation?.organization.id, selectedLocation?.location.id]
    );

    useEffect(() => {
        handleSearch(query);
    }, [query, handleSearch]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value);
    };

    const handleUserClick = (user: UserModel) => {
        onSelectUser(user);
        onClose();
    };

    return (
        <Modal
            open={open}
            title="Start New Chat"
            onCancel={onClose}
            footer={null}
            centered
            width={400}
        >
            <Input
                placeholder="Search users..."
                prefix={<SearchOutlined/>}
                value={query}
                onChange={handleInputChange}
                style={{marginBottom: 12}}
                allowClear
            />


            {/* 👇 New "Create Group Chat" button */}
            <Button
                type="dashed"
                icon={<TeamOutlined/>}
                block
                onClick={() => {
                    onCreateGroup();
                }}
                style={{
                    marginBottom: 8,
                    fontWeight: 500,
                    borderColor: "#1890ff",
                }}
            >
                Create Group Chat
            </Button>

            {loading ? (
                <div style={{textAlign: "center", padding: "40px 0"}}>
                    <Spin/>
                </div>
            ) : error ? (
                <Empty description={error}/>
            ) : users.length > 0 ? (
                <List
                    itemLayout="horizontal"
                    dataSource={users}
                    renderItem={(user) => (
                        <List.Item
                            onClick={() => handleUserClick(user)}
                            style={{
                                cursor: "pointer",
                                padding: "8px 12px",
                                borderRadius: 8,
                            }}
                            className="hover:bg-gray-50 transition"
                        >
                            <List.Item.Meta
                                avatar={
                                    user.profile_picture ? (
                                        <Avatar src={user.profile_picture}/>
                                    ) : (
                                        <Avatar icon={<UserOutlined/>}/>
                                    )
                                }
                                title={user.name || user.username}
                                description={user.email}
                            />
                        </List.Item>
                    )}
                />
            ) : (
                <Empty description={query ? "No users found" : "Start by typing a name"}/>
            )}
        </Modal>
    );
};

export default StartConversationModal;
