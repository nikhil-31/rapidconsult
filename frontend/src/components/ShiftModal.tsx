import React, {useEffect, useState} from 'react';
import {Modal, Form, Select, DatePicker, Button, message} from 'antd';
import {useOrgLocation} from "../contexts/LocationContext";
import {Department} from '../models/Department';
import {Unit} from '../models/Unit';
import {
    createShift,
    getDepartmentsByLocation,
    getUnitsByDepartment,
    getUnitById
} from "../api/services";

const {Option} = Select;
const {RangePicker} = DatePicker;

interface Props {
    visible: boolean;
    onClose: () => void;
    onShiftCreated: () => void;
}

interface Member {
    id: number;
    name: string;
}

const CreateShiftModal: React.FC<Props> = ({visible, onClose, onShiftCreated}) => {
    const [form] = Form.useForm();

    const [departments, setDepartments] = useState<Department[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);
    const [members, setMembers] = useState<Member[]>([]);

    const {selectedLocation} = useOrgLocation();
    const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
    const [selectedDepartment, setSelectedDepartment] = useState<number | null>(null);
    const [selectedUnit, setSelectedUnit] = useState<number | null>(null);

    useEffect(() => {
        setSelectedLocationId(selectedLocation?.location?.id ?? null);
    }, [selectedLocation]);

    useEffect(() => {
        if (!selectedLocationId) return;
        const loadDepartments = async () => {
            try {
                const departments = await getDepartmentsByLocation(selectedLocationId);
                setDepartments(departments);
            } catch (err) {
                console.error("Failed to fetch departments:", err);
            }
        };
        loadDepartments();
    }, [selectedLocationId]);

    useEffect(() => {
        if (!selectedDepartment) return;

        const loadUnits = async () => {
            try {
                const units = await getUnitsByDepartment(selectedDepartment);
                setUnits(units);
            } catch (err) {
                console.error("Failed to fetch units:", err);
            }
        };

        loadUnits();
    }, [selectedDepartment]);

    useEffect(() => {
        if (!selectedUnit) return;

        const loadUnitMembers = async () => {
            try {
                const unitData = await getUnitById(selectedUnit);
                const formattedMembers: Member[] = (unitData.members || []).map((member: any) => ({
                    id: member.user_details.id,
                    name: `${member.user_details.user.name || 'User'} (${member.user_details.role.name})`
                }));
                setMembers(formattedMembers);
            } catch (err) {
                console.error('Failed to fetch unit members', err);
            }
        };

        loadUnitMembers();
    }, [selectedUnit]);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            const [start, end] = values.time_range;

            const res = await createShift({
                user: values.user,
                unit: values.unit,
                start_time: start.toISOString(),
                end_time: end.toISOString(),
                shift_type: values.shift_type,
            });

            message.success('Shift created successfully!');
            onClose();
            form.resetFields();
            onShiftCreated();
        } catch (error) {
            console.error(error);
            message.error('Failed to create shift');
        }
    };

    return (
        <Modal
            open={visible}
            title="Create New Shift"
            onCancel={onClose}
            footer={null}
        >
            <Form layout="vertical" form={form} onFinish={handleSubmit}>
                <Form.Item
                    label="Shift Type"
                    name="shift_type"
                    rules={[{required: true, message: "Please select a shift type"}]}
                >
                    <Select placeholder="Select shift type">
                        <Option value="oncall">On-Call</Option>
                        <Option value="outpatient">Outpatient</Option>
                    </Select>
                </Form.Item>

                <Form.Item label="Department" name="department" rules={[{required: true}]}>
                    <Select
                        placeholder="Select department"
                        onChange={(val) => {
                            form.setFieldsValue({unit: undefined, user: undefined});
                            setSelectedDepartment(val);
                        }}
                        disabled={!selectedLocationId}
                    >
                        {departments.map((d: any) => (
                            <Option key={d.id} value={d.id}>{d.name}</Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item label="Unit" name="unit" rules={[{required: true}]}>
                    <Select
                        placeholder="Select unit"
                        onChange={(val) => {
                            form.setFieldsValue({user: undefined});
                            setSelectedUnit(val);
                        }}
                        disabled={!selectedDepartment}
                    >
                        {units.map((u: any) => (
                            <Option key={u.id} value={u.id}>{u.name}</Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item label="Member" name="user" rules={[{required: true}]}>
                    <Select placeholder="Select member" disabled={!selectedUnit}>
                        {members.map((m: any) => (
                            <Option key={m.id} value={m.id}>{m.name}</Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item label="Time Range" name="time_range" rules={[{required: true}]}>
                    <RangePicker
                        showTime
                        style={{width: '100%'}}
                        format="YYYY-MM-DD HH:mm"
                    />
                </Form.Item>

                <Form.Item>
                    <Button type="primary" htmlType="submit" block>
                        Create Shift
                    </Button>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default CreateShiftModal;
