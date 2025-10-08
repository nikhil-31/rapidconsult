import React, {useState} from "react";
import {Modal, Form, Input, Select, Button} from "antd";
import {createConsultation} from "../api/services";

const {Option} = Select;

interface ConsultationModalProps {
    visible: boolean;
    onClose: () => void;
    onCreated?: () => void;
}

const ConsultationModal: React.FC<ConsultationModalProps> = ({
                                                                 visible,
                                                                 onClose,
                                                                 onCreated,
                                                             }) => {

    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();

            // Convert DatePicker to ISO string
            if (values.consultationDateTime) {
                values.consultationDateTime = values.consultationDateTime.toISOString();
            }
            if (values.closedAt) {
                values.closedAt = values.closedAt.toISOString();
            }

            setLoading(true);

            try {
                const res = await createConsultation(values);
            } catch (error) {
                console.error('Failed to create consultation:', error);
            }
            form.resetFields();
            onClose();
            onCreated?.();
        } catch (err: any) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            visible={visible}
            title="Create Consultation"
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
                    Create
                </Button>,
            ]}
            width={800}
        >
            <Form
                form={form}
                layout="vertical"
                initialValues={{
                    urgency: "routine",
                    status: "pending",
                    patientSex: "male",
                }}
            >
                {/* Patient Info */}
                <Form.Item
                    label="Patient Name"
                    name="patientName"
                    rules={[{required: true, message: "Please enter patient name"}]}
                >
                    <Input/>
                </Form.Item>

                <Form.Item label="Patient Age" name="patientAge">
                    <Input type="number" min="0"/>
                </Form.Item>

                <Form.Item label="Patient Sex" name="patientSex">
                    <Select>
                        <Option value="male">Male</Option>
                        <Option value="female">Female</Option>
                        <Option value="other">Other</Option>
                    </Select>
                </Form.Item>

                <Form.Item label="Department" name="department">
                    <Input/>
                </Form.Item>

                <Form.Item label="Unit" name="unit">
                    <Input/>
                </Form.Item>

                <Form.Item label="Ward" name="ward">
                    <Input/>
                </Form.Item>

                <Form.Item
                    label="Referred To Doctor ID"
                    name="referredToDoctorId"
                    rules={[{required: true}]}
                >
                    <Input type="number"/>
                </Form.Item>

                <Form.Item label="Urgency" name="urgency">
                    <Select>
                        <Option value="routine">Routine</Option>
                        <Option value="urgent">Urgent</Option>
                        <Option value="emergency">Emergency</Option>
                    </Select>
                </Form.Item>

                <Form.Item label="Diagnosis" name="diagnosis">
                    <Input/>
                </Form.Item>

                <Form.Item label="Reason for Referral" name="reasonForReferral">
                    <Input.TextArea rows={2}/>
                </Form.Item>

                {/* Workflow */}
                <Form.Item label="Status" name="status">
                    <Select>
                        <Option value="pending">Pending</Option>
                        <Option value="in_progress">In Progress</Option>
                        <Option value="completed">Completed</Option>
                        <Option value="closed">Closed</Option>
                    </Select>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default ConsultationModal;
