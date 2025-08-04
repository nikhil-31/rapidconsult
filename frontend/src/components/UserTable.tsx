import React from 'react';
import {
    Table,
    Button,
    Avatar,
    Space,
    Typography,
    Tooltip,
    Row,
    Col,
    message,
} from 'antd';
import {
    EditOutlined,
    DeleteOutlined,
    PlusOutlined,
} from '@ant-design/icons';
import {UserModel} from '../models/UserModel';

const {Title} = Typography;

interface UserTableSectionProps {
    users: UserModel[];
    selectedOrgId: string;
    onCreateUser: () => void;
    onEditUser: (user: UserModel) => void;
    onDeleteUser: (user: UserModel) => void;
}

export default function UserTableSection({
                                             users,
                                             selectedOrgId,
                                             onCreateUser,
                                             onEditUser,
                                             onDeleteUser,
                                         }: UserTableSectionProps) {
    const handleCreateClick = () => {
        if (!selectedOrgId) {
            message.warning('Please select an organization first.');
            return;
        }
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
                            onClick={() => {
                                message.warning('Delete not supported.');
                                // Optional: confirm dialog and deletion logic
                                // if (window.confirm('Are you sure?')) onDeleteUser(record);
                            }}
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
                pagination={false}
                scroll={{x: true}}
                size="middle"
            />
        </div>
    );
}
