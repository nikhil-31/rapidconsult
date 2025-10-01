import {Table, Button, Popconfirm, Space, Image, Typography, Row, Col, Tooltip, message} from 'antd';
import {EditOutlined, DeleteOutlined, PlusOutlined} from '@ant-design/icons';
import {Location} from '../models/Location';
import {useEffect, useState} from "react";
import {getLocations} from "../api/services";

const {Title} = Typography;

interface LocationTableProps {
    selectedOrgId: string;
    onCreateLocation: () => void;
    onEditLocation: (location: Location) => void;
    onDeleteLocation: (location: Location) => void;
    refreshKey: number;
}

export default function LocationTable({
                                          selectedOrgId,
                                          onCreateLocation,
                                          onEditLocation,
                                          onDeleteLocation,
                                          refreshKey,
                                      }: LocationTableProps) {

    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(false);

    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 20,
        total: 0,
    });

    const fetchLocations = async (page = 1, pageSize = 10) => {
        if (!selectedOrgId) return;

        setLoading(true);
        try {
            const res = await getLocations(selectedOrgId, page, pageSize);

            setLocations(res.results);
            setPagination((prev) => ({
                ...prev,
                current: page,
                pageSize,
                total: res.count,
            }));
        } catch (error) {
            console.error("Error fetching locations", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedOrgId) {
            fetchLocations(pagination.current, pagination.pageSize);
        }
    }, [selectedOrgId, refreshKey]);

    const handleTableChange = (newPagination: any) => {
        fetchLocations(newPagination.current, newPagination.pageSize);
    };

    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            ellipsis: true,
        },
        {
            title: 'Address',
            key: 'address',
            ellipsis: true,
            render: (_: any, loc: Location) => {
                const addr = loc.address;
                if (!addr) return '—';
                return [
                    addr.label,
                    addr.address_1,
                    addr.address_2,
                    addr.city,
                    addr.state,
                    addr.zip_code ? `- ${addr.zip_code}` : '',
                ]
                    .filter(Boolean)
                    .join(', ');
            },
        },
        {
            title: 'Picture',
            key: 'display_picture',
            render: (_: any, loc: Location) =>
                loc.display_picture ? (
                    <Tooltip title="Location Picture">
                        <Image
                            width={40}
                            height={40}
                            src={loc.display_picture}
                            alt="Location"
                            style={{borderRadius: '50%', objectFit: 'cover'}}
                            preview={false}
                        />
                    </Tooltip>
                ) : (
                    '—'
                ),
        },
        {
            title: 'Actions',
            key: 'actions',
            align: 'right' as const,
            render: (_: any, loc: Location) => (
                <Space>
                    <Tooltip title="Edit">
                        <Button
                            type="text"
                            icon={<EditOutlined/>}
                            onClick={() => onEditLocation(loc)}
                        />
                    </Tooltip>
                    <Tooltip title="Delete">
                        <Popconfirm
                            title={`Are you sure you want to delete "${loc.name}"?`}
                            onConfirm={() => onDeleteLocation(loc)}
                            okText="Yes"
                            cancelText="No"
                        >
                            <Button
                                type="text"
                                icon={<DeleteOutlined/>}
                                danger
                            />
                        </Popconfirm>
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
                        Locations
                    </Title>
                </Col>
                <Col>
                    <Button
                        type="primary"
                        danger
                        icon={<PlusOutlined/>}
                        onClick={() => {
                            if (!selectedOrgId) {
                                message.warning('Please select an organization first.');
                                return;
                            }
                            onCreateLocation();
                        }}
                    >
                        Create Location
                    </Button>
                </Col>
            </Row>

            <Table
                rowKey="id"
                columns={columns}
                dataSource={locations}
                bordered
                size="middle"
                loading={loading}
                pagination={{
                    current: pagination.current,
                    pageSize: pagination.pageSize,
                    total: pagination.total,
                    showSizeChanger: true,
                    showTotal: (total) => `Total ${total} locations`,
                }}
                onChange={handleTableChange}
            />
        </div>
    );
}
