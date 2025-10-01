import React, {useEffect, useState, useContext} from 'react';
import {Table, Button, Avatar, Typography, Space, Spin, Tooltip, message} from 'antd';
import {EditOutlined, DeleteOutlined, PlusOutlined} from '@ant-design/icons';
import {AuthContext} from '../contexts/AuthContext';
import {Department} from '../models/Department';
import {getDepartments} from "../api/services";

const {Title} = Typography;

interface DepartmentTableProps {
    selectedOrgId: string;
    onEdit: (department: Department) => void;
    onCreate: () => void;
    refresh: number;
}

export default function DepartmentTable({
                                            selectedOrgId,
                                            onEdit,
                                            onCreate,
                                            refresh,
                                        }: DepartmentTableProps) {

    const {user} = useContext(AuthContext);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 20,
        total: 0,
    });

    const fetchDepartments = async (page = 1, pageSize = 20) => {
        if (!selectedOrgId) return;

        setLoading(true);
        try {
            const res = await getDepartments(selectedOrgId, page, pageSize);

            setDepartments(res.results);
            setPagination(prev => ({
                ...prev,
                current: page,
                pageSize,
                total: res.count,
            }));
        } catch (error) {
            console.error("Failed to fetch departments:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedOrgId) {
            fetchDepartments(pagination.current, pagination.pageSize);
        }
    }, [selectedOrgId, refresh]);

    const handleDelete = async (deptId: number) => {
        message.warning('Delete is not supported.');
    };

    const handleTableChange = (newPagination: any) => {
        fetchDepartments(newPagination.current, newPagination.pageSize);
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
                    bordered
                    size="middle"
                    loading={loading}
                    pagination={{
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                        total: pagination.total,
                        showSizeChanger: true,
                        showTotal: (total) => `Total ${total} departments`,
                    }}
                    onChange={handleTableChange}
                />
            )}
        </div>
    );
}
