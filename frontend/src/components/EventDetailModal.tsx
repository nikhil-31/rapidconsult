import React from 'react';
import {Modal, Descriptions, Typography, Space, Avatar, Button, Popconfirm} from 'antd';
import dayjs from 'dayjs';

const {Title} = Typography;

type ShiftEvent = {
    id: number;
    title: string;
    start: Date;
    end: Date;
    user: number;
    role: number;
    username: string;
    role_name: string;
    profile_picture: string;
};

type ShiftDetailModalProps = {
    visible: boolean;
    onClose: () => void;
    onDelete: (id: number) => void;
    event: ShiftEvent | null;
};

const ShiftDetailModal: React.FC<ShiftDetailModalProps> = ({visible, onClose, onDelete, event}) => {
    if (!event) return null;

    return (
        <Modal
            open={visible}
            title={null}
            onCancel={onClose}
            footer={[
                <Button key="cancel" onClick={onClose}>
                    Close
                </Button>,
                <Popconfirm
                    key="delete"
                    title="Are you sure you want to delete this shift?"
                    okText="Yes"
                    cancelText="No"
                    onConfirm={() => onDelete(event.id)}
                >
                    <Button danger>Delete</Button>
                </Popconfirm>,
            ]}
        >
            <div style={{marginBottom: 16}}>
                <Title level={4} style={{margin: 0}}>
                    Shift Details
                </Title>
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
                    {dayjs(event.start).format('dddd, MMM D YYYY — hh:mm A')}
                </Descriptions.Item>

                <Descriptions.Item label="End Time">
                    {dayjs(event.end).format('dddd, MMM D YYYY — hh:mm A')}
                </Descriptions.Item>
            </Descriptions>
        </Modal>
    );
};

export default ShiftDetailModal;
