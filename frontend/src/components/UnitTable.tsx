import React, {useEffect, useState, useContext} from 'react';
import {Table, Button, Avatar, Space, Typography, message} from 'antd';
import {AuthContext} from '../contexts/AuthContext';
import {Unit} from '../models/Unit';
import {Pencil, Trash2} from 'lucide-react';
import axios from 'axios';
const {Title} = Typography;

interface UnitTableProps {
    selectedOrgId: string;
    onCreate: () => void;
    onEdit: (unit: Unit) => void;
    onReload: () => void;
}

export default function UnitTable({
                                      selectedOrgId,
                                      onCreate,
                                      onEdit,
                                      onReload,
                                  }: UnitTableProps) {
    const {user} = useContext(AuthContext);
    const [units, setUnits] = useState<Unit[]>([]);
    const [loading, setLoading] = useState(true);
    const apiUrl = process.env.REACT_APP_API_URL;

    const fetchUnits = async () => {
        if (!selectedOrgId) return;
        setLoading(true);
        try {
            const response = await axios.get(
                `${apiUrl}/api/units/?organization_id=${selectedOrgId}`,
                {
                    headers: {
                        Authorization: `Token ${user?.token}`,
                    },
                }
            );
            setUnits(response.data);
        } catch (error) {
            console.error('Failed to fetch units:', error);
            message.error('Failed to load units');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUnits();
    }, [selectedOrgId, onReload]);

    const handleDelete = async (unitId: number) => {
        message.warning('Delete not supported.');
        // Uncomment below if delete is supported
        // const confirmed = window.confirm('Are you sure you want to delete this unit?');
        // if (!confirmed) return;
        // try {
        //   await axios.delete(`${apiUrl}/api/units/${unitId}/`, {
        //     headers: {
        //       Authorization: `Token ${user?.token}`,
        //     },
        //   });
        //   setUnits(prev => prev.filter(u => u.id !== unitId));
        //   message.success('Unit deleted');
        // } catch (err) {
        //   console.error('Delete failed:', err);
        //   message.error('Failed to delete unit');
        // }
    };

    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            render: (text: string) => text || '—',
        },
        {
            title: 'Department',
            key: 'department',
            render: (_: any, record: Unit) =>
                record.department?.name || '—',
        },
        {
            title: 'Location',
            key: 'location',
            render: (_: any, record: Unit) =>
                record.department?.location_details?.name || '—',
        },
        {
            title: 'Members',
            key: 'members',
            render: (_: any, record: Unit) => record.members?.length || 0,
        },
        {
            title: 'Picture',
            key: 'display_picture',
            render: (_: any, record: Unit) =>
                record.display_picture ? (
                    <Avatar src={record.display_picture} shape="circle"/>
                ) : (
                    '—'
                ),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: Unit) => (
                <Space>
                    <Button
                        type="link"
                        onClick={() => onEdit(record)}
                        icon={<Pencil size={16}/>}
                    />
                    <Button
                        type="link"
                        danger
                        onClick={() => handleDelete(record.id)}
                        icon={<Trash2 size={16}/>}
                    />
                </Space>
            ),
        },
    ];

    if (!selectedOrgId) {
        return <p style={{color: '#999'}}>Please select an organization.</p>;
    }

    return (
        <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
                <Title level={4}>Units</Title>
                <Button type="primary" danger onClick={onCreate}>
                    Create Unit
                </Button>
            </div>

            <Table
                rowKey="id"
                columns={columns}
                dataSource={units}
                loading={loading}
                bordered
                pagination={{pageSize: 10}}
            />
        </div>
    );
}
