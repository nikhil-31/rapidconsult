import React, {useEffect, useState, useContext} from 'react';
import {
    Table, Button, Avatar, Space, Typography, message, Tooltip, Row, Col
} from 'antd';
import {
    EditOutlined, DeleteOutlined, PlusOutlined
} from '@ant-design/icons';
import {AuthContext} from '../contexts/AuthContext';
import {Unit} from '../models/Unit';
import axios, {AxiosResponse} from 'axios';
import {PaginatedResponse} from "../models/PaginatedResponse";

const {Title} = Typography;

interface UnitTableProps {
    selectedOrgId: string;
    onCreate: () => void;
    onEdit: (unit: Unit) => void;
    onReload: () => void;
}

export default function UnitTable({selectedOrgId, onCreate, onEdit, onReload,}: UnitTableProps) {

    const {user} = useContext(AuthContext);
    const [units, setUnits] = useState<Unit[]>([]);
    const [loading, setLoading] = useState(true);
    const apiUrl = process.env.REACT_APP_API_URL;

    const fetchUnits = async () => {
        if (!selectedOrgId) return;
        setLoading(true);
        try {
            const response: AxiosResponse<PaginatedResponse<Unit>> = await axios.get(
                `${apiUrl}/api/units/?organization_id=${selectedOrgId}`,
                {
                    headers: {
                        Authorization: `Token ${user?.token}`,
                    },
                }
            );
            const data = response.data.results
            setUnits(data);
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
    };

    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            ellipsis: true,
            render: (text: string) => text || '—',
        },
        {
            title: 'Department',
            key: 'department',
            ellipsis: true,
            render: (_: any, record: Unit) =>
                record.department?.name || '—',
        },
        {
            title: 'Location',
            key: 'location',
            ellipsis: true,
            render: (_: any, record: Unit) =>
                record.department?.location_details?.name || '—',
        },
        {
            title: 'Members',
            key: 'members',
            align: 'center' as const,
            render: (_: any, record: Unit) => record.members?.length || 0,
        },
        {
            title: 'Picture',
            key: 'display_picture',
            align: 'center' as const,
            render: (_: any, record: Unit) =>
                record.display_picture ? (
                    <Avatar src={record.display_picture} shape="circle" size={40}/>
                ) : (
                    '—'
                ),
        },
        {
            title: 'Actions',
            key: 'actions',
            align: 'right' as const,
            render: (_: any, record: Unit) => (
                <Space>
                    <Tooltip title="Edit">
                        <Button
                            type="text"
                            icon={<EditOutlined/>}
                            onClick={() => onEdit(record)}
                        />
                    </Tooltip>
                    <Tooltip title="Delete">
                        <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined/>}
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
            <Row justify="space-between" align="middle" style={{marginBottom: 16}}>
                <Col>
                    <Title level={4} style={{margin: 0}}>
                        Units
                    </Title>
                </Col>
                <Col>
                    <Button type="primary" danger icon={<PlusOutlined/>} onClick={onCreate}>
                        Create Unit
                    </Button>
                </Col>
            </Row>

            <Table
                rowKey="id"
                columns={columns}
                dataSource={units}
                loading={loading}
                bordered
                pagination={false}
                size="middle"
            />
        </div>
    );
}
