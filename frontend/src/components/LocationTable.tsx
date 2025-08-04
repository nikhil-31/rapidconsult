import { Table, Button, Popconfirm, Space, Image, Typography, Row, Col } from 'antd';
import { Pencil, Trash2 } from 'lucide-react';
import { Location } from '../models/Location';

const { Title } = Typography;

interface LocationTableProps {
    locations: Location[];
    selectedOrgId: string;
    onCreateLocation: () => void;
    onEditLocation: (location: Location) => void;
    onDeleteLocation: (location: Location) => void;
}

export default function LocationTable({
    locations,
    selectedOrgId,
    onCreateLocation,
    onEditLocation,
    onDeleteLocation,
}: LocationTableProps) {
    if (!locations.length) return null;

    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Address',
            key: 'address',
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
                    <Image
                        width={40}
                        height={40}
                        src={loc.display_picture}
                        alt="Location"
                        style={{ borderRadius: '50%', objectFit: 'cover' }}
                        preview={false}
                    />
                ) : (
                    '—'
                ),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, loc: Location) => (
                <Space size="middle">
                    <Button
                        type="link"
                        icon={<Pencil size={16} />}
                        onClick={() => onEditLocation(loc)}
                    />
                    <Popconfirm
                        title={`Are you sure to delete "${loc.name}"?`}
                        onConfirm={() => onDeleteLocation(loc)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button type="link" danger icon={<Trash2 size={16} />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ marginTop: 24 }}>
            <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
                <Col>
                    <Title level={4} style={{ margin: 0 }}>
                        Locations
                    </Title>
                </Col>
                <Col>
                    <Button
                        type="primary"
                        danger
                        onClick={() => {
                            if (!selectedOrgId) {
                                alert('Please select an organization first.');
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
                pagination={false}
                bordered
            />
        </div>
    );
}
