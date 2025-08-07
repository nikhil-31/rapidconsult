// ShiftDetailModal.tsx
import React from 'react';
import {Modal, Descriptions, Typography, Space, Tag, Avatar} from 'antd';
import {ClockCircleOutlined, UserOutlined} from '@ant-design/icons';
import dayjs from 'dayjs';

const {Title, Text} = Typography;

type ShiftDetailModalProps = {
    visible: boolean;
    onClose: () => void;
    event: {
        id: number;
        title: string;
        start: Date;
        end: Date;
        user: number;
        role: number;
        username: string;
        role_name: string;
        profile_picture: string;
    } | null;
};

const ShiftDetailModal: React.FC<ShiftDetailModalProps> = ({visible, onClose, event}) => {
    if (!event) return null;

    return (
        <Modal
            open={visible}
            title={null}
            onCancel={onClose}
            onOk={onClose}
            footer={null}
        >
            <div style={{marginBottom: 16}}>
                <Title level={4} style={{margin: 0}}>
                    Shift Details
                </Title>
                <Text type="secondary">ID: {event.id}</Text>
            </div>

            <Descriptions
                column={1}
                bordered
                size="middle"
                labelStyle={{fontWeight: 500, width: 120}}
            >
                <Descriptions.Item label="User">
                    <Space>
                        <Avatar src={event.profile_picture} alt={event.username}>
                            {event.username?.[0]?.toUpperCase()}
                        </Avatar>
                        <span>{event.username}</span>
                    </Space>
                </Descriptions.Item>

                <Descriptions.Item label="Role">
                    {event.role_name}
                </Descriptions.Item>

                <Descriptions.Item label="Start Time">
                    <Space>
                        <span>{dayjs(event.start).format('dddd, MMM D YYYY — hh:mm A')}</span>
                    </Space>
                </Descriptions.Item>

                <Descriptions.Item label="End Time">
                    <Space>
                        <span>{dayjs(event.end).format('dddd, MMM D YYYY — hh:mm A')}</span>
                    </Space>
                </Descriptions.Item>
            </Descriptions>
        </Modal>
    );
};

export default ShiftDetailModal;
