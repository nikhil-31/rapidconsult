import React, {useContext, useEffect, useState} from "react";
import {Button, Form, Input, Modal, Select} from "antd";
import {createConsultation, getDepartmentsByLocation, getUnitsByDepartment, searchUsers,} from "../api/services";
import {Department} from "../models/Department";
import {Unit} from "../models/Unit";
import {UserModel} from "../models/UserModel";
import {useOrgLocation} from "../contexts/LocationContext";
import {AuthContext} from "../contexts/AuthContext";
import debounce from "lodash.debounce";

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

    // Fetch departments based on selected location
    useEffect(() => {
        const fetchDepartments = async () => {
            if (!selectedLocation?.location.id) return;
            try {
                const data = await getDepartmentsByLocation(selectedLocation?.location.id);
                setDepartments(data);
            } catch (err) {
                console.error("Failed to fetch departments:", err);
            }
        };
        fetchDepartments();
    }, [selectedLocation, visible]);

    // Fetch units when department changes
    const handleDepartmentChange = async (departmentId: number) => {
        form.setFieldsValue({unit: undefined});
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

    // Search doctors (debounced)
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

            if (values.consultationDateTime)
                values.consultationDateTime = values.consultationDateTime.toISOString();
            if (values.closedAt)
                values.closedAt = values.closedAt.toISOString();

            const organization_id = selectedLocation?.organization.id
            values.location_id = selectedLocation?.location.id
            values.organization_id = organization_id
            values.status = "pending";
            values.referred_by_doctor_id = getOrgUserIdByOrgId(organization_id)

            const res = await createConsultation(values);

            form.resetFields();
            onClose();
            onCreated?.();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            open={visible}
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

                {/* Department Dropdown */}
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

                {/* Unit Dropdown */}
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

                <Form.Item label="Ward" name="ward">
                    <Input/>
                </Form.Item>

                {/* Doctor Search Dropdown */}
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
                            const orgId = user.organizations
                                .find((org) =>
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
