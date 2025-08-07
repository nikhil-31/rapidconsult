// ShiftDetailModal.tsx
import React from 'react';
import {Modal, Descriptions} from 'antd';
import dayjs from 'dayjs';

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
    } | null;
};

const ShiftDetailModal: React.FC<ShiftDetailModalProps> = ({visible, onClose, event}) => {
    if (!event) return null;

    return (
        <Modal
            open={visible}
            title="Shift Details"
            onCancel={onClose}
            onOk={onClose}
            footer={null}
        >
            <Descriptions column={1} bordered>
                <Descriptions.Item label="User">{event.username}</Descriptions.Item>
                <Descriptions.Item label="Role">{event.role_name}</Descriptions.Item>
                <Descriptions.Item label="Start">
                    {dayjs(event.start).format('YYYY-MM-DD HH:mm')}
                </Descriptions.Item>
                <Descriptions.Item label="End">
                    {dayjs(event.end).format('YYYY-MM-DD HH:mm')}
                </Descriptions.Item>
            </Descriptions>
        </Modal>
    );
};

export default ShiftDetailModal;
