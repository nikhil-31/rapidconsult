import React, {useContext, useEffect, useState} from "react";
import {Button, Form, Input, Modal, Select} from "antd";
import debounce from "lodash.debounce";
import {
    createConsultation,
    updateConsultation,
    getDepartmentsByLocation,
    getUnitsByDepartment,
    searchUsers,
} from "../api/services";
import {Department} from "../models/Department";
import {Unit} from "../models/Unit";
import {UserModel} from "../models/UserModel";
import {Consultation} from "../models/Consultation";
import {useOrgLocation} from "../contexts/LocationContext";
import {AuthContext} from "../contexts/AuthContext";

const {Option} = Select;

interface ConsultationModalProps {
    visible: boolean;
    onClose: () => void;
    onCreated?: () => void;
    consultation?: Consultation | null;
    isEdit?: boolean;
}

const ConsultationModal: React.FC<ConsultationModalProps> = ({
                                                                 visible,
                                                                 onClose,
                                                                 onCreated,
                                                                 consultation,
                                                                 isEdit = false,
                                                             }) => {
    const {user} = useContext(AuthContext);
    const {selectedLocation} = useOrgLocation();
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();

    const [departments, setDepartments] = useState<Department[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);
    const [unitLoading, setUnitLoading] = useState(false);
    const [doctorResults, setDoctorResults] = useState<UserModel[]>([]);
    const [doctorLoading, setDoctorLoading] = useState(false);

    const getOrgUserIdByOrgId = (organizationId: number | undefined) => {
        const orgProfile = user?.organizations.find(
            (o) => o.organization.id === organizationId
        );
        return orgProfile?.id || null;
    };

    // Prefill data if editing
    useEffect(() => {
        if (isEdit && consultation) {
            form.setFieldsValue({
                patient_name: consultation.patient_name,
                patient_age: consultation.patient_age,
                patient_sex: consultation.patient_sex,
                ward: consultation.ward,
                referred_to_doctor_id: consultation.referred_to_doctor?.id,
                urgency: consultation.urgency,
                diagnosis: consultation.diagnosis,
                reason_for_referral: consultation.reason_for_referral,
            });
        } else {
            form.resetFields();
        }
    }, [consultation, isEdit, visible]);

    // Fetch departments when modal opens (only for create mode)
    useEffect(() => {
        if (isEdit) return;
        const fetchDepartments = async () => {
            if (!selectedLocation?.location.id) return;
            try {
                const data = await getDepartmentsByLocation(selectedLocation.location.id);
                setDepartments(data);
            } catch (err) {
                console.error("Failed to fetch departments:", err);
            }
        };
        fetchDepartments();
    }, [selectedLocation, visible, isEdit]);

    const handleDepartmentChange = async (departmentId: number) => {
        form.setFieldsValue({unit_id: undefined});
        if (!departmentId) {
            setUnits([]);
            return;
        }
        try {
            setUnitLoading(true);
            const data = await getUnitsByDepartment(departmentId);
            setUnits(data);
        } catch (err) {
            console.error("Failed to fetch units:", err);
        } finally {
            setUnitLoading(false);
        }
    };

    const handleDoctorSearch = debounce(async (value: string) => {
        if (!value || value.trim().length < 2) {
            setDoctorResults([]);
            return;
        }
        try {
            setDoctorLoading(true);
            const users = await searchUsers(value);
            setDoctorResults(users);
        } catch (err) {
            console.error("Doctor search failed:", err);
        } finally {
            setDoctorLoading(false);
        }
    }, 500);

    const handleSubmit = async () => {
        try {
            setLoading(true);
            const values = await form.validateFields();
            const organization_id = selectedLocation?.organization.id;
            values.location_id = selectedLocation?.location.id;
            values.organization_id = organization_id;
            values.referred_by_doctor_id = getOrgUserIdByOrgId(organization_id);

            if (!isEdit) {
                values.status = "pending";
                await createConsultation(values);
            } else if (consultation?.id) {
                await updateConsultation(consultation.id, values);
            }

            form.resetFields();
            onClose();
            onCreated?.();
        } catch (err) {
            console.error("Error submitting consultation:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            open={visible}
            title={isEdit ? "Edit Consultation" : "Create Consultation"}
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
                    {isEdit ? "Update" : "Create"}
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
                    patient_sex: "male",
                }}
            >
                <Form.Item
                    label="Patient Name"
                    name="patient_name"
                    rules={[{required: true, message: "Please enter patient name"}]}
                >
                    <Input/>
                </Form.Item>

                <Form.Item label="Patient Age" name="patient_age">
                    <Input type="number" min="0"/>
                </Form.Item>

                <Form.Item label="Patient Sex" name="patient_sex">
                    <Select>
                        <Option value="male">Male</Option>
                        <Option value="female">Female</Option>
                        <Option value="other">Other</Option>
                    </Select>
                </Form.Item>

                {/* Show only in create mode */}
                {!isEdit && (
                    <>
                        <Form.Item
                            label="Department"
                            name="department_id"
                            rules={[{required: true, message: "Please select a department"}]}
                        >
                            <Select
                                placeholder="Select department"
                                onChange={handleDepartmentChange}
                                loading={!departments.length}
                                disabled={!departments.length}
                            >
                                {departments.map((dept) => (
                                    <Option key={dept.id} value={dept.id}>
                                        {dept.name}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item
                            label="Unit"
                            name="unit_id"
                            rules={[{required: true, message: "Please select a unit"}]}
                        >
                            <Select
                                placeholder="Select unit"
                                loading={unitLoading}
                                disabled={!units.length}
                            >
                                {units.map((unit) => (
                                    <Option key={unit.id} value={unit.id}>
                                        {unit.name}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </>
                )}

                <Form.Item label="Ward" name="ward">
                    <Input/>
                </Form.Item>

                <Form.Item
                    label="Referred To Doctor"
                    name="referred_to_doctor_id"
                    rules={[{required: true, message: "Please select a doctor"}]}
                >
                    <Select
                        showSearch
                        placeholder="Search doctor by name or username"
                        filterOption={false}
                        onSearch={handleDoctorSearch}
                        loading={doctorLoading}
                        notFoundContent={doctorLoading ? "Searching..." : "No doctors found"}
                    >
                        {doctorResults.map((user) => {
                            const orgId = user.organizations.find((org) =>
                                org.allowed_locations.some(
                                    (loc: any) => loc.id === selectedLocation?.location.id
                                )
                            )?.id;
                            return (
                                <Option key={orgId} value={orgId}>
                                    {user.name || user.username}
                                </Option>
                            );
                        })}
                    </Select>
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

                <Form.Item label="Reason for Referral" name="reason_for_referral">
                    <Input.TextArea rows={2}/>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default ConsultationModal;
