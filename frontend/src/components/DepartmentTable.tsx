import React, {useEffect, useState, useContext} from 'react';
import axios, {AxiosResponse} from 'axios';
import {Table, Button, Avatar, Typography, Space, Spin, Tooltip, message} from 'antd';
import {EditOutlined, DeleteOutlined, PlusOutlined} from '@ant-design/icons';
import {AuthContext} from '../contexts/AuthContext';
import {Department} from '../models/Department';
import {PaginatedResponse} from "../models/PaginatedResponse";

const {Title} = Typography;

interface DepartmentTableProps {
    selectedOrgId: string;
    onEdit: (department: Department) => void;
    onReload: () => void;
    onCreate: () => void;
}

export default function DepartmentTable({
                                            selectedOrgId,
                                            onEdit,
                                            onReload,
                                            onCreate,
                                        }: DepartmentTableProps) {

    const {user} = useContext(AuthContext);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const apiUrl = process.env.REACT_APP_API_URL;

    useEffect(() => {
        const fetchDepartments = async () => {
            if (!selectedOrgId) return;

            try {
                const response: AxiosResponse<PaginatedResponse<Department>> = await axios.get(
                    `${apiUrl}/api/departments/org?organization_id=${selectedOrgId}`,
                    {
                        headers: {
                            Authorization: `Token ${user?.token}`,
                        },
                    }
                );
                const data = response.data.results
                setDepartments(data);
            } catch (error) {
                console.error('Failed to fetch departments:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDepartments();
    }, [selectedOrgId, onReload]);

    const handleDelete = async (deptId: number) => {
        message.warning('Delete is not supported.');
    };

    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            ellipsis: true,
        },
        {
            title: 'Location',
            dataIndex: ['location_details', 'name'],
            key: 'location',
            ellipsis: true,
        },
        {
            title: 'Picture',
            dataIndex: 'display_picture',
            key: 'display_picture',
            render: (url: string | null) =>
                url ? (
                    <Tooltip title="Department Image">
                        <Avatar src={url} size={40}/>
                    </Tooltip>
                ) : (
                    '—'
                ),
        },
        {
            title: 'Actions',
            key: 'actions',
            align: 'right' as const,
            render: (_: any, record: Department) => (
                <Space>
                    <Tooltip title="Edit">
                        <Button
                            icon={<EditOutlined/>}
                            type="text"
                            onClick={() => onEdit(record)}
                        />
                    </Tooltip>
                    <Tooltip title="Delete">
                        <Button
                            icon={<DeleteOutlined/>}
                            type="text"
                            danger
                            onClick={() => handleDelete(record.id)}
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    if (!selectedOrgId) {
        return <p style={{color: '#999'}}>Please select an organization.</p>;
    }

    return (
        <div style={{marginTop: 24}}>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 16}}>
                <Title level={4} style={{margin: 0}}>
                    Departments
                </Title>
                <Button
                    type="primary"
                    icon={<PlusOutlined/>}
                    danger
                    onClick={onCreate}
                >
                    Create Department
                </Button>
            </div>

            {loading ? (
                <div style={{textAlign: 'center', padding: '2rem'}}>
                    <Spin size="large"/>
                </div>
            ) : (
                <Table
                    columns={columns}
                    dataSource={departments}
                    rowKey="id"
                    pagination={false}
                    bordered
                    size="middle"
                />
            )}
        </div>
    );
}
