import React, {useState} from "react";
import {Modal, Form, Input, Button, Space,} from "antd";
import {updateConsultationStatus} from "../api/services";
import {useOrgLocation} from "../contexts/LocationContext";

interface CloseConsultModalProps {
    visible: boolean;
    consultationId: number | null;
    onClose: () => void;
    onSuccess: () => void;
}

const CloseConsultModal: React.FC<CloseConsultModalProps> = ({
                                                                 visible,
                                                                 consultationId,
                                                                 onClose,
                                                                 onSuccess,
                                                             }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const {selectedLocation} = useOrgLocation();

    const handleSubmit = async (status: "closed" | "completed") => {
        try {
            const values = await form.validateFields();
            setLoading(true);

            await updateConsultationStatus(
                consultationId!,
                status,
                values.remarks,
                values.review,
                selectedLocation?.organization?.id ?? 0,
                selectedLocation?.location?.id ?? 0
            );

            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title="Close Consultation"
            open={visible}
            onCancel={onClose}
            footer={
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    {/* Left-aligned button */}
                    <Button
                        key="close"
                        type="primary"
                        danger
                        loading={loading}
                        onClick={() => handleSubmit("closed")}
                    >
                        Close Consultation
                    </Button>

                    {/* Right-aligned buttons */}
                    <Space>
                        <Button
                            key="complete"
                            type="primary"
                            loading={loading}
                            onClick={() => handleSubmit("completed")}
                        >
                            Complete Consultation
                        </Button>
                        <Button key="cancel" onClick={onClose}>
                            Cancel
                        </Button>
                    </Space>
                </div>
            }
        >
            <Form form={form} layout="vertical">
                <Form.Item
                    name="review"
                    label="Consultant Review"
                    rules={[{required: true, message: "Please add consultant review"}]}
                >
                    <Input.TextArea rows={4} placeholder="Enter your final review..."/>
                </Form.Item>

                <Form.Item name="remarks" label="Additional Remarks">
                    <Input.TextArea rows={3} placeholder="Add any feedback or notes..."/>
                </Form.Item>
            </Form>
        </Modal>
    );
};


export default CloseConsultModal;
