import React from 'react';
import {Table, Button, Avatar, Space, Typography, message} from 'antd';
import {Pencil, Trash2} from 'lucide-react';
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
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Picture',
            dataIndex: 'profile_picture',
            key: 'profile_picture',
            render: (url: string | null) =>
                url ? <Avatar src={url} size={40}/> : '—',
        },
        {
            title: 'Actions',
            key: 'actions',
            align: 'right' as const,
            render: (_: any, record: UserModel) => (
                <Space>
                    <Button
                        type="link"
                        icon={<Pencil size={16}/>}
                        onClick={() => onEditUser(record)}
                    />
                    <Button
                        type="link"
                        danger
                        icon={<Trash2 size={16}/>}
                        onClick={() =>
                            window.confirm('Not supported!!!') && onDeleteUser(record)
                        }
                    />
                </Space>
            ),
        },
    ];

    return (
        <div style={{marginTop: 24}}>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 16}}>
                <Title level={4} style={{margin: 0}}>
                    Users
                </Title>
                <Button type="primary" danger onClick={handleCreateClick}>
                    Create User
                </Button>
            </div>

            <Table
                columns={columns}
                dataSource={users}
                rowKey="id"
                bordered
                pagination={false}
                scroll={{x: true}}
            />
        </div>
    );
}
