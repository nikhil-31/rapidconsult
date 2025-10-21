import React, { useEffect, useState } from "react";
import { Modal, Form, Input, Select, Button } from "antd";
import {
    createConsultation,
    getDepartmentsByLocation,
    getUnitsByDepartment,
    searchUsers,
} from "../api/services";
import { Department } from "../models/Department";
import { Unit } from "../models/Unit";

import { useOrgLocation } from "../contexts/LocationContext";
import debounce from "lodash.debounce";
import {UserModel} from "../models/UserModel";

const { Option } = Select;

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

    const { selectedLocation } = useOrgLocation();

    const [departments, setDepartments] = useState<Department[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);
    const [unitLoading, setUnitLoading] = useState(false);
    const [doctorResults, setDoctorResults] = useState<UserModel[]>([]);
    const [doctorLoading, setDoctorLoading] = useState(false);

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
        form.setFieldsValue({ unit: undefined });
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

            values.location_id = selectedLocation?.location.id
            values.organization_id = selectedLocation?.organization.id

            values.status = "pending";
            console.log(values)
            // const res = await createConsultation(values);

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
                    name="patientName"
                    rules={[{ required: true, message: "Please enter patient name" }]}
                >
                    <Input />
                </Form.Item>

                <Form.Item label="Patient Age" name="patientAge">
                    <Input type="number" min="0" />
                </Form.Item>

                <Form.Item label="Patient Sex" name="patientSex">
                    <Select>
                        <Option value="male">Male</Option>
                        <Option value="female">Female</Option>
                        <Option value="other">Other</Option>
                    </Select>
                </Form.Item>

                {/* Department Dropdown */}
                <Form.Item
                    label="Department"
                    name="department"
                    rules={[{ required: true, message: "Please select a department" }]}
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
                    name="unit"
                    rules={[{ required: true, message: "Please select a unit" }]}
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
                    <Input />
                </Form.Item>

                {/* Doctor Search Dropdown */}
                <Form.Item
                    label="Referred To Doctor"
                    name="referredToDoctorId"
                    rules={[{ required: true, message: "Please select a doctor" }]}
                >
                    <Select
                        showSearch
                        placeholder="Search doctor by name or username"
                        filterOption={false}
                        onSearch={handleDoctorSearch}
                        loading={doctorLoading}
                        notFoundContent={doctorLoading ? "Searching..." : "No doctors found"}
                    >
                        {doctorResults.map((user) => (
                            <Option key={user.id} value={user.id}>
                                {user.name || user.username}
                            </Option>
                        ))}
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
                    <Input />
                </Form.Item>

                <Form.Item label="Reason for Referral" name="reasonForReferral">
                    <Input.TextArea rows={2} />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default ConsultationModal;
