import React, {useContext, useEffect, useState} from 'react';
import {Table, Button, Avatar, Space, Typography, Tooltip, Row, Col} from 'antd';
import {EditOutlined, DeleteOutlined, PlusOutlined} from '@ant-design/icons';
import {UserModel} from '../models/UserModel';
import axios, {AxiosResponse} from "axios";
import {PaginatedResponse} from "../models/PaginatedResponse";
import {AuthContext} from "../contexts/AuthContext";

const {Title} = Typography;

interface UserTableSectionProps {
    selectedOrgId: string;
    onCreateUser: () => void;
    onEditUser: (user: UserModel) => void;
    onDeleteUser: (user: UserModel) => void;
}

export default function UserTableSection({
                                             selectedOrgId,
                                             onCreateUser,
                                             onEditUser,
                                             onDeleteUser,
                                         }: UserTableSectionProps) {
    const apiUrl = process.env.REACT_APP_API_URL;
    const [users, setUsers] = useState<UserModel[]>([]);
    const {user} = useContext(AuthContext);

    // pagination state
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });
    const [loading, setLoading] = useState(false);

    const fetchUsers = async (page = 1, pageSize = 10) => {
        if (!selectedOrgId) return;

        setLoading(true);
        try {
            const res: AxiosResponse<PaginatedResponse<UserModel>> = await axios.get(
                `${apiUrl}/api/users/all`,
                {
                    headers: {Authorization: `Token ${user?.token}`},
                    params: {
                        organization: selectedOrgId,
                        page,
                        page_size: pageSize,
                    },
                }
            );

            setUsers(res.data.results);
            setPagination((prev) => ({
                ...prev,
                current: page,
                pageSize,
                total: res.data.count, // DRF returns `count` in paginated responses
            }));
        } catch (error) {
            console.error('Error fetching users', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers(pagination.current, pagination.pageSize);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedOrgId]);

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
