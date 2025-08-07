import React, {useEffect, useState, useContext} from 'react';
import {Modal, Form, Select, DatePicker, Button, message} from 'antd';
import axios from 'axios';
import {AuthContext} from '../contexts/AuthContext';
import dayjs from 'dayjs';
import {useOrgLocation} from "../contexts/LocationContext";

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
    const [locations, setLocations] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [units, setUnits] = useState([]);
    const [members, setMembers] = useState([]);

    // const [selectedOrgId, setSelectedOrgId] = useState<string>('');
    const {selectedLocation, setSelectedLocation} = useOrgLocation();
    const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
    const [selectedDepartment, setSelectedDepartment] = useState<number | null>(null);
    const [selectedUnit, setSelectedUnit] = useState<number | null>(null);


    useEffect(() => {
        setSelectedLocationId(selectedLocation?.location?.id ?? null);
    }, [selectedLocation]);

    useEffect(() => {
        // if (orgs.length > 0) {
        //     const storedOrg = localStorage.getItem('org_select');
        //     const matchedOrg = storedOrg
        //         ? orgs.find(org => org.organization_id === JSON.parse(storedOrg).organization_id)
        //         : null;
        //
        //     const defaultOrgId = matchedOrg
        //         ? matchedOrg.organization_id.toString()
        //         : orgs[0].organization_id.toString();
        //
        //     setSelectedOrgId(defaultOrgId);
        // }
    }, [orgs]);

    // useEffect(() => {
    //     if (!selectedOrgId || !user?.token) return;
    //
    //     axios.get(`${apiUrl}/api/locations?organization_id=${selectedOrgId}`, {
    //         headers: {Authorization: `Token ${user.token}`},
    //     }).then(res => setLocations(res.data))
    //       .catch(err => console.error("Failed to fetch locations", err));
    // }, [selectedOrgId, user]);

    useEffect(() => {
        if (!selectedLocationId) return;

        axios.get(`${apiUrl}/api/departments/?location_id=${selectedLocationId}`, {
            headers: {Authorization: `Token ${user?.token}`},
        }).then(res => {
            setDepartments(res.data);
        });
    }, [selectedLocationId]);

    useEffect(() => {
        if (!selectedDepartment) return;

        axios.get(`${apiUrl}/api/units?department_id=${selectedDepartment}`, {
            headers: {Authorization: `Token ${user?.token}`},
        }).then(res => setUnits(res.data));
    }, [selectedDepartment]);

    useEffect(() => {
        if (!selectedUnit) return;

        axios.get(`${apiUrl}/api/units/${selectedUnit}`, {
            headers: {Authorization: `Token ${user?.token}`},
        })
            .then(res => {
                const unitData = res.data;
                const unitMembers = unitData.members || [];
                const formattedMembers = unitMembers.map((member: any) => ({
                    id: member.user_details.id,
                    name: `${member.user_details.job_title || 'User'} (${member.user_details.role.name})`
                }));
                setMembers(formattedMembers);
            })
            .catch(err => console.error('Failed to fetch unit members', err));

    }, [selectedUnit]);

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
                {/*<Form.Item label="Location" name="location" rules={[{required: true}]}>*/}
                {/*    <Select*/}
                {/*        placeholder="Select location"*/}
                {/*        onChange={(val) => {*/}
                {/*            form.setFieldsValue({department: undefined, unit: undefined, user: undefined});*/}
                {/*            setSelectedLocationId(val);*/}
                {/*        }}*/}
                {/*    >*/}
                {/*        {locations.map((loc: any) => (*/}
                {/*            <Option key={loc.id} value={loc.id}>{loc.name}</Option>*/}
                {/*        ))}*/}
                {/*    </Select>*/}
                {/*</Form.Item>*/}

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
