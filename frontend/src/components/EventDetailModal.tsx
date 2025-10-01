import React, {useState, useEffect} from 'react';
import dayjs, {Dayjs} from 'dayjs';
import {Modal, Descriptions, Typography, Space, Avatar, Button, Popconfirm, DatePicker} from 'antd';
import {EventData} from "../models/EventData";
import {updateShift} from "../api/services";

const {Title} = Typography;

type ShiftDetailModalProps = {
    visible: boolean;
    onClose: () => void;
    onDelete: (id: number) => void;
    event: EventData | null;
    onUpdated: () => void;
};

const ShiftDetailModal: React.FC<ShiftDetailModalProps> = ({visible, onClose, onDelete, event, onUpdated}) => {

    const [isEditing, setIsEditing] = useState(false);
    const [startTime, setStartTime] = useState<Dayjs | null>(null);
    const [endTime, setEndTime] = useState<Dayjs | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (event) {
            setStartTime(dayjs(event.start));
            setEndTime(dayjs(event.end));
            setIsEditing(false);
        }
    }, [event]);

    if (!event) return null;

    const handleSave = async () => {
        if (!startTime || !endTime) {
            return;
        }

        try {
            setLoading(true);
            const res = await updateShift(event.id, startTime.toISOString(), endTime.toISOString());
            setIsEditing(false);
            onClose();
            if (onUpdated) onUpdated();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            open={visible}
            title={null}
            onCancel={onClose}
            footer={[
                isEditing ? (
                    <>
                        <Button key="cancel" onClick={() => setIsEditing(false)}>Cancel</Button>
                        <Button key="save" type="primary" loading={loading} onClick={handleSave}>Save</Button>
                    </>
                ) : (
                    <>
                        <Button key="edit" type="primary" onClick={() => setIsEditing(true)}>Edit</Button>
                        <Popconfirm
                            key="delete"
                            title="Are you sure you want to delete this shift?"
                            okText="Yes"
                            cancelText="No"
                            onConfirm={() => onDelete(event.id)}
                        >
                            <Button danger>Delete</Button>
                        </Popconfirm>
                    </>
                )
            ]}
        >
            <div style={{marginBottom: 16}}>
                <Title level={4} style={{margin: 0}}>
                    Shift Details
                </Title>
            </div>

            <Descriptions column={1} bordered size="middle" labelStyle={{fontWeight: 500, width: 120}}>
                <Descriptions.Item label="User">
                    <Space>
                        <Avatar src={event.profile_picture} alt={event.username}>
                            {event.username?.[0]?.toUpperCase()}
                        </Avatar>
                        <span>{event.username}</span>
                    </Space>
                </Descriptions.Item>

                <Descriptions.Item label="Role">{event.role_name}</Descriptions.Item>
                <Descriptions.Item label="Job Title">{event.job_title}</Descriptions.Item>
                {/* New Department Field */}
                <Descriptions.Item label="Department">
                    {event.dept_name || "N/A"}
                </Descriptions.Item>

                {/* New Unit Field */}
                <Descriptions.Item label="Unit">
                    {event.unit_name || "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="Start Time">
                    {isEditing ? (
                        <DatePicker
                            showTime
                            value={startTime}
                            onChange={(value) => setStartTime(value)}
                            format="YYYY-MM-DD HH:mm"
                        />
                    ) : (
                        dayjs(event.start).format('dddd, MMM D YYYY — hh:mm A')
                    )}
                </Descriptions.Item>

                <Descriptions.Item label="End Time">
                    {isEditing ? (
                        <DatePicker
                            showTime
                            value={endTime}
                            onChange={(value) => setEndTime(value)}
                            format="YYYY-MM-DD HH:mm"
                        />
                    ) : (
                        dayjs(event.end).format('dddd, MMM D YYYY — hh:mm A')
                    )}
                </Descriptions.Item>
            </Descriptions>
        </Modal>
    );
};

export default ShiftDetailModal;
