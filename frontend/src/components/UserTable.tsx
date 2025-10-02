import React, {useEffect, useState} from 'react';
import {Table, Button, Avatar, Space, Typography, Tooltip, Row, Col} from 'antd';
import {EditOutlined, DeleteOutlined, PlusOutlined} from '@ant-design/icons';
import {UserModel} from '../models/UserModel';
import {getUsers} from "../api/services";

const {Title} = Typography;

interface UserTableSectionProps {
    selectedOrgId: string;
    onCreateUser: () => void;
    onEditUser: (user: UserModel) => void;
    onDeleteUser: (user: UserModel) => void;
    refresh: number;
}

export default function UserTableSection({
                                             selectedOrgId,
                                             onCreateUser,
                                             onEditUser,
                                             onDeleteUser,
                                             refresh
                                         }: UserTableSectionProps) {

    const [users, setUsers] = useState<UserModel[]>([]);
    const [pagination, setPagination] = useState({current: 1, pageSize: 20, total: 0,});
    const [loading, setLoading] = useState(false);

    const fetchUsers = async (page = 1, pageSize = 20) => {
        if (!selectedOrgId) return;

        setLoading(true);
        try {
            const res = await getUsers(selectedOrgId, page, pageSize);
            setUsers(res.results);
            setPagination((prev) => ({
                ...prev,
                current: page,
                pageSize,
                total: res.count,
            }));
        } catch (error) {
            console.error("Error fetching users", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers(pagination.current, pagination.pageSize);
    }, [selectedOrgId, refresh]);

    const handleTableChange = (newPagination: any) => {
        fetchUsers(newPagination.current, newPagination.pageSize);
    };

    const handleCreateClick = () => {
        if (!selectedOrgId) return;
        onCreateUser();
    };

    const columns = [
        {
            title: 'Username',
            dataIndex: 'username',
            key: 'username',
            render: (text: string) => text || '—',
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            render: (text: string) => text || '—',
        },
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            render: (text: string) => text || '—',
        },
        {
            title: 'Picture',
            dataIndex: 'profile_picture',
            key: 'profile_picture',
            align: 'center' as const,
            render: (url: string | null) =>
                url ? <Avatar src={url} size={40}/> : '—',
        },
        {
            title: 'Actions',
            key: 'actions',
            align: 'right' as const,
            render: (_: any, record: UserModel) => (
                <Space>
                    <Tooltip title="Edit">
                        <Button
                            type="text"
                            icon={<EditOutlined/>}
                            onClick={() => onEditUser(record)}
                        />
                    </Tooltip>
                    <Tooltip title="Delete">
                        <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined/>}
                            onClick={() => onDeleteUser(record)}
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <div style={{marginTop: 24}}>
            <Row justify="space-between" align="middle" style={{marginBottom: 16}}>
                <Col>
                    <Title level={4} style={{margin: 0}}>
                        Users
                    </Title>
                </Col>
                <Col>
                    <Button
                        type="primary"
                        danger
                        icon={<PlusOutlined/>}
                        onClick={handleCreateClick}
                    >
                        Create User
                    </Button>
                </Col>
            </Row>

            <Table
                columns={columns}
                dataSource={users}
                rowKey="id"
                bordered
                loading={loading}
                pagination={{
                    current: pagination.current,
                    pageSize: pagination.pageSize,
                    total: pagination.total,
                    showSizeChanger: true,
                    showTotal: (total) => `Total ${total} users`,
                }}
                onChange={handleTableChange}
                scroll={{x: true}}
                size="middle"
            />
        </div>
    );
}
