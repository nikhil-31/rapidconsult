import React from "react";
import {Modal, Descriptions, Tag} from "antd";
import {Consultation} from "../models/Consultation";

interface ConsultationDetailsModalProps {
    visible: boolean;
    consultation: Consultation | null;
    onClose: () => void;
}

const ConsultationDetailsModal: React.FC<ConsultationDetailsModalProps> = ({
                                                                               visible,
                                                                               consultation,
                                                                               onClose,
                                                                           }) => {
    if (!consultation) return null;

    return (
        <Modal
            open={visible}
            title="Consultation Details"
            onCancel={onClose}
            footer={null}
            width={700}
        >
            <Descriptions bordered column={1}>
                <Descriptions.Item label="Patient Name">
                    {consultation.patient_name}
                </Descriptions.Item>

                <Descriptions.Item label="Age / Sex">
                    {consultation.patient_age} / {consultation.patient_sex}
                </Descriptions.Item>

                <Descriptions.Item label="Ward">
                    {consultation.ward}
                </Descriptions.Item>

                <Descriptions.Item label="Department">
                    {consultation.department?.name || "-"}
                </Descriptions.Item>

                <Descriptions.Item label="Unit">
                    {consultation.unit?.name || "-"}
                </Descriptions.Item>

                <Descriptions.Item label="Referred By Doctor">
                    {consultation.referred_by_doctor?.user?.name ||
                        consultation.referred_by_doctor?.user?.username ||
                        "-"}
                </Descriptions.Item>

                <Descriptions.Item label="Referred To Doctor">
                    {consultation.referred_to_doctor?.user?.name ||
                        consultation.referred_to_doctor?.user?.username ||
                        "-"}
                </Descriptions.Item>

                <Descriptions.Item label="Urgency">
                    <Tag
                        color={
                            consultation.urgency === "emergency"
                                ? "red"
                                : consultation.urgency === "urgent"
                                    ? "orange"
                                    : "blue"
                        }
                    >
                        {consultation.urgency?.toUpperCase()}
                    </Tag>
                </Descriptions.Item>

                <Descriptions.Item label="Diagnosis">
                    {consultation.diagnosis || "-"}
                </Descriptions.Item>

                <Descriptions.Item label="Reason for Referral">
                    {consultation.reason_for_referral || "-"}
                </Descriptions.Item>

                <Descriptions.Item label="Status">
                    <Tag
                        color={
                            consultation.status === "closed"
                                ? "green"
                                : consultation.status === "pending"
                                    ? "orange"
                                    : "blue"
                        }
                    >
                        {consultation.status?.toUpperCase()}
                    </Tag>
                </Descriptions.Item>

                <Descriptions.Item label="Consultant Review">
                    {consultation.consultant_review || "-"}
                </Descriptions.Item>

                <Descriptions.Item label="Consultant Remarks">
                    {consultation.consultant_remarks || "-"}
                </Descriptions.Item>
            </Descriptions>
        </Modal>
    );
};

export default ConsultationDetailsModal;
