import React, {useState} from "react";
import {Modal, Form, Input, Button} from "antd";
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

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);
            const response = await updateConsultationStatus(
                consultationId!,
                "completed",
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
            footer={[
                <Button key="cancel" onClick={onClose}>
                    Cancel
                </Button>,
                <Button
                    key="submit"
                    type="primary"
                    loading={loading}
                    onClick={handleSubmit}
                >
                    submit consult
                </Button>,
            ]}
        >
            <Form form={form} layout="vertical">
                <Form.Item
                    name="remarks"
                    label="Consultant Review"
                    rules={[{required: true, message: "Please add closing remarks"}]}
                >
                    <Input.TextArea
                        rows={4}
                        placeholder="Enter your final remarks..."
                    />
                </Form.Item>

                <Form.Item
                    name="review"
                    label="Additional remarks"
                >
                    <Input.TextArea
                        rows={3}
                        placeholder="Add any feedback or notes..."
                    />
                </Form.Item>
            </Form>

        </Modal>
    );
};

export default CloseConsultModal;
