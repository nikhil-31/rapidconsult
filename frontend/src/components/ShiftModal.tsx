import React, {useEffect, useState, useContext} from 'react';
import {Modal, Form, Select, DatePicker, Button, message} from 'antd';
import axios from 'axios';
import {AuthContext} from '../contexts/AuthContext';
import dayjs from 'dayjs';

const {Option} = Select;
const {RangePicker} = DatePicker;

interface Props {
    visible: boolean;
    onClose: () => void;
    onShiftCreated: () => void;
}

const CreateShiftModal: React.FC<Props> = ({visible, onClose, onShiftCreated}) => {
    const {user} = useContext(AuthContext);
    const orgs = user?.organizations || [];
    const apiUrl = process.env.REACT_APP_API_URL;

    const [form] = Form.useForm();
    const [users, setUsers] = useState([]);
    const [locations, setLocations] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [units, setUnits] = useState([]);

    const [selectedOrgId, setSelectedOrgId] = useState<string>('');
    const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
    const [selectedDepartment, setSelectedDepartment] = useState<number | null>(null);

    useEffect(() => {
        if (!selectedOrgId || !user?.token) return;

        axios.get(`${apiUrl}/api/users/all?organization=${selectedOrgId}`, {
            headers: {Authorization: `Token ${user.token}`},
        }).then(res => setUsers(res.data))
            .catch(err => console.error("Failed to fetch users", err));

        axios.get(`${apiUrl}/api/locations?organization_id=${selectedOrgId}`, {
            headers: {Authorization: `Token ${user.token}`},
        }).then(res => setLocations(res.data))
            .catch(err => console.error("Failed to fetch locations", err));
    }, [selectedOrgId, user]);

    useEffect(() => {
        if (!selectedLocation) return;

        axios.get(`${apiUrl}/api/departments/?location_id=${selectedLocation}`, {
            headers: {Authorization: `Token ${user?.token}`},
        }).then(res => {
            setDepartments(res.data);
        });
    }, [selectedLocation]);

    useEffect(() => {
        if (!selectedDepartment) return;

        axios.get(`${apiUrl}/api/units?department_id=${selectedDepartment}`, {
            headers: {Authorization: `Token ${user?.token}`},
        }).then(res => setUnits(res.data));
    }, [selectedDepartment]);

    useEffect(() => {
        if (orgs.length > 0) {
            const storedOrg = localStorage.getItem('org_select');
            const matchedOrg = storedOrg
                ? orgs.find(org => org.organization_id === JSON.parse(storedOrg).organization_id)
                : null;

            const defaultOrgId = matchedOrg
                ? matchedOrg.organization_id.toString()
                : orgs[0].organization_id.toString();

            setSelectedOrgId(defaultOrgId);
        }
    }, [orgs]);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            const [start, end] = values.time_range;

            const payload = {
                user: values.user,
                unit: values.unit,
                start_time: start.toISOString(),
                end_time: end.toISOString(),
            };

            await axios.post(`${apiUrl}/api/shifts/`, payload, {
                headers: {
                    Authorization: `Token ${user?.token}`,
                    'Content-Type': 'application/json',
                },
            });

            message.success('Shift created successfully!');
            onClose();
            form.resetFields();
            onShiftCreated();
        } catch (error) {
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
                <Form.Item label="User" name="user" rules={[{required: true}]}>
                    <Select placeholder="Select user">
                        {users.map((u: any) => (
                            <Option key={u.id} value={u.id}>{u.name || u.username}</Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item label="Location" name="location" rules={[{required: true}]}>
                    <Select
                        placeholder="Select location"
                        onChange={(val) => {
                            form.setFieldsValue({department: undefined, unit: undefined});
                            setSelectedLocation(val);
                        }}
                    >
                        {locations.map((loc: any) => (
                            <Option key={loc.id} value={loc.id}>{loc.name}</Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item label="Department" name="department" rules={[{required: true}]}>
                    <Select
                        placeholder="Select department"
                        onChange={(val) => {
                            form.setFieldsValue({unit: undefined});
                            setSelectedDepartment(val);
                        }}
                        disabled={!selectedLocation}
                    >
                        {departments.map((d: any) => (
                            <Option key={d.id} value={d.id}>{d.name}</Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item label="Unit" name="unit" rules={[{required: true}]}>
                    <Select placeholder="Select unit" disabled={!selectedDepartment}>
                        {units.map((u: any) => (
                            <Option key={u.id} value={u.id}>{u.name}</Option>
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
