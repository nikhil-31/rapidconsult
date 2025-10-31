import React, {useState, useEffect, useCallback} from "react";
import {
    Modal, Input, List, Avatar, Spin, Empty, Button, Checkbox, Form, message, Space
} from "antd";
import {
    UserOutlined, SearchOutlined, TeamOutlined, ArrowLeftOutlined
} from "@ant-design/icons";
import debounce from "lodash/debounce";
import {searchUsers, getUsersLocation, createGroupConversation} from "../api/services";
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
    const {selectedLocation} = useOrgLocation();

    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<UserModel[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    // group chat mode
    const [groupMode, setGroupMode] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
    const [form] = Form.useForm();

    const [selectedLocationId, setSelectedLocationId] = useState<number>(0);
    const [selectedOrganizationId, setSelectedOrganizationId] = useState<number>(0);

    useEffect(() => {
        if (selectedLocation !== null) {
            setSelectedOrganizationId(selectedLocation?.organization.id)
            setSelectedLocationId(selectedLocation?.location.id)
        }
    }, [selectedLocation]);

    // Debounced search
    const handleSearch = useCallback(
        debounce(async (q: string) => {
            if (!selectedOrganizationId || !selectedLocationId) return;
            try {
                setLoading(true);
                setError(null);
                let results: UserModel[] = [];
                if (q.trim()) {
                    results = await searchUsers(q, selectedOrganizationId, selectedLocationId);
                    setHasMore(false);
                } else {
                    const res = await getUsersLocation(
                        selectedOrganizationId.toString(),
                        selectedLocationId.toString(),
                        1
                    );
                    results = res.results;
                    setHasMore(!!res.next);
                }
                setUsers(results);
            } catch (err) {
                console.error("Error fetching users:", err);
                setError("Failed to load users");
            } finally {
                setLoading(false);
            }
        }, 500),
        [selectedOrganizationId, selectedLocationId]
    );

    useEffect(() => {
        if (open) handleSearch(query);
    }, [query, open, handleSearch]);

    const handleUserClick = (user: UserModel) => {
        if (groupMode) {
            toggleUser(Number(user.id));
        } else {
            onSelectUser(user);
            onClose();
        }
    };

    const toggleUser = (id: number) => {
        setSelectedUsers((prev) =>
            prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id]
        );
    };

    const handleCreateGroup = async () => {
        try {
            const values = await form.validateFields();

            if (selectedUsers.length === 0) {
                message.warning("Please select at least one user");
                console.log(`selected users ${selectedUsers}`)
                return;
            }

            const res = await createGroupConversation(
                values.name,
                values.description || "",
                selectedLocation?.organization.id!,
                selectedLocationId!,
                selectedUsers
            );

            // message.success(`Group "${res.name}" created successfully!`);
            form.resetFields();
            setSelectedUsers([]);
            setGroupMode(false);
            onClose();
        } catch (err) {
            console.error(err);
            message.error("Failed to create group chat");
        }
    };

    return (
        <Modal
            open={open}
            title={
                groupMode ? (
                    <Space>
                        <Button
                            icon={<ArrowLeftOutlined/>}
                            type="text"
                            onClick={() => setGroupMode(false)}
                        />
                        Create Group Chat
                    </Space>
                ) : (
                    "Start Conversation"
                )
            }
            onCancel={onClose}
            footer={null}
            centered
            width={420}
        >
            {!groupMode ? (
                <>
                    <Input
                        placeholder="Search users..."
                        prefix={<SearchOutlined/>}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        allowClear
                        style={{marginBottom: 12}}
                    />

                    <Button
                        type="dashed"
                        icon={<TeamOutlined/>}
                        block
                        onClick={() => setGroupMode(true)}
                        style={{marginBottom: 12}}
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
                        <Empty description="No users found"/>
                    )}
                </>
            ) : (
                <>
                    <Form form={form} layout="vertical">
                        <Form.Item
                            label="Group Name"
                            name="name"
                            rules={[{required: true, message: "Please enter a group name"}]}
                        >
                            <Input placeholder="Enter group name"/>
                        </Form.Item>

                        <Form.Item label="Description" name="description">
                            <Input.TextArea
                                placeholder="Enter a short description"
                                autoSize={{minRows: 2, maxRows: 4}}
                            />
                        </Form.Item>
                    </Form>

                    <Input
                        placeholder="Search users..."
                        prefix={<SearchOutlined/>}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        allowClear
                        style={{marginBottom: 12}}
                    />

                    {loading ? (
                        <div style={{textAlign: "center", padding: "40px 0"}}>
                            <Spin/>
                        </div>
                    ) : users.length > 0 ? (
                        <List
                            itemLayout="horizontal"
                            dataSource={users}
                            renderItem={(user: UserModel) => (
                                <List.Item
                                    onClick={() => toggleUser(Number(user.id))}
                                    style={{
                                        cursor: "pointer",
                                        padding: "8px 12px",
                                        borderRadius: 8,
                                    }}
                                    className="hover:bg-gray-50 transition"
                                >
                                    <Checkbox
                                        checked={selectedUsers.includes(Number(user.id))}
                                        style={{marginRight: 12}}
                                    />
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
                        <Empty description="No users found"/>
                    )}

                    <Button
                        type="primary"
                        block
                        style={{marginTop: 16}}
                        disabled={selectedUsers.length === 0}
                        onClick={handleCreateGroup}
                    >
                        Create Group ({selectedUsers.length} selected)
                    </Button>
                </>
            )}
        </Modal>
    );
};

export default StartConversationModal;
