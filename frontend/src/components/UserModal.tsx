import React, {useEffect, useState} from 'react';
import {Modal, Form, Input, Select, Upload, Button, Typography} from 'antd';
import {UploadOutlined} from '@ant-design/icons';
import {Role} from '../models/Role';
import {UserModel} from '../models/UserModel';
import {OrgProfile} from '../models/OrgProfile';
import {createUser, fetchRoles, getLocations, updateAllowedLocations, updateUser} from "../api/services";

const {Title} = Typography;

interface CreateUserModalProps {
    selectedOrgId: string;
    orgs: OrgProfile[];
    onClose: () => void;
    onSuccess: () => void;
    editingUser?: UserModel | null;
}

export default function UserModal({
                                      selectedOrgId,
                                      orgs,
                                      onClose,
                                      onSuccess,
                                      editingUser = null,
                                  }: CreateUserModalProps) {

    const [roles, setRoles] = useState<Role[]>([]);
    const [locations, setLocations] = useState<any[]>([]);
    const [form] = Form.useForm();
    const [fileList, setFileList] = useState<any[]>([]);
    const isEditMode = Boolean(editingUser);

    const loadRoles = async () => {
        try {
            const data = await fetchRoles();
            setRoles(data);
        } catch (error) {
            console.error('Failed to fetch roles:', error);
        }
    };

    const loadLocations = async () => {
        if (!selectedOrgId) return;
        try {
            const res = await getLocations(selectedOrgId);
            setLocations(res.results);
        } catch (error) {
            console.error('Failed to fetch locations:', error);
        }
    };

    useEffect(() => {
        loadRoles();
        loadLocations();
    }, [selectedOrgId]);

    useEffect(() => {
        if (editingUser) {
            const orgProfile = editingUser.organizations.find(
                (o) => o.organization.id.toString() === selectedOrgId
            );

            form.setFieldsValue({
                username: editingUser.username,
                name: editingUser.name,
                email: editingUser.email,
                password: '',
                role: orgProfile?.role?.id?.toString(),
                job_title: orgProfile?.job_title,
                allowed_locations: orgProfile?.allowed_locations?.map((loc) => loc.id) || [],
            });

            if (editingUser.profile_picture) {
                setFileList([
                    {
                        uid: '-1',
                        name: 'Existing Image',
                        status: 'done',
                        url: editingUser.profile_picture,
                    },
                ]);
            }
        }
    }, [editingUser]);

    const handleSubmit = async (values: any) => {
        const formData = new FormData();
        formData.append('username', values.username);
        if (!isEditMode || values.password) {
            formData.append('password', values.password);
        }
        formData.append('name', values.name);
        formData.append('email', values.email);
        formData.append('org_profile.organization', selectedOrgId);
        formData.append('org_profile.role', values.role);
        formData.append('org_profile.job_title', values.job_title);

        const file = fileList[0]?.originFileObj;
        if (file) {
            formData.append('profile_picture', file);
        }

        try {
            let orgProfileId = editingUser?.organizations.find(
                (o) => o.organization.id.toString() === selectedOrgId.toString()
            )?.id;

            let resData;
            try {
                if (isEditMode && editingUser) {
                    resData = await updateUser(editingUser.username, formData);
                } else {
                    resData = await createUser(formData);
                    orgProfileId = resData.organizations?.find(
                        (o: OrgProfile) => o.organization.id === Number(selectedOrgId)
                    )?.id;
                }

                if (resData && orgProfileId) {
                    await updateAllowedLocations(orgProfileId, values.allowed_locations);
                } else {
                    console.warn(`Failed: Missing orgProfileId or invalid response`, resData);
                }
            } catch (error) {
                console.error('Failed to save user or update locations:', error);
            }

            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error saving user:', error);
        }
    };

    return (
        <Modal
            open
            onCancel={onClose}
            title={isEditMode ? 'Edit User' : 'Create New User'}
            footer={null}
            width={600}
        >
            <Form
                layout="vertical"
                form={form}
                onFinish={handleSubmit}
                initialValues={{organization: selectedOrgId}}
            >
                <Title level={5}>User Details</Title>
                <Form.Item name="username" label="Username" rules={[{required: true}]}>
                    <Input disabled={isEditMode}/>
                </Form.Item>

                <Form.Item
                    name="password"
                    label={isEditMode ? 'Change Password (optional)' : 'Password'}
                    rules={!isEditMode ? [{required: true}] : []}
                >
                    <Input.Password disabled={isEditMode}/>
                </Form.Item>

                <Form.Item name="name" label="Full Name">
                    <Input/>
                </Form.Item>

                <Form.Item name="email" label="Email" rules={[{required: true, type: 'email'}]}>
                    <Input/>
                </Form.Item>

                <Form.Item label="Profile Picture">
                    <Upload
                        fileList={fileList}
                        onChange={({fileList: newFileList}) => {
                            if (newFileList.length > 1) {
                                newFileList = [newFileList[newFileList.length - 1]];
                            }
                            setFileList(newFileList);
                        }}
                        beforeUpload={() => false}
                        listType="picture"
                        maxCount={1}
                        accept="image/*"
                    >
                        <Button icon={<UploadOutlined/>}>Upload</Button>
                    </Upload>
                </Form.Item>

                <Form.Item
                    name="allowed_locations"
                    label="Allowed Locations"
                    rules={[{required: true, message: 'Please select at least one location'}]}
                >
                    <Select
                        mode="multiple"
                        placeholder="Select allowed locations"
                        showSearch
                        allowClear
                        optionFilterProp="label"
                        filterOption={(input, option) =>
                            (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                        }
                        options={locations.map(loc => ({
                            label: loc.name,
                            value: loc.id,
                        }))}
                    />
                </Form.Item>

                <Title level={5}>Organization Details</Title>

                <Form.Item label="Organization">
                    <Input
                        value={
                            orgs.find((org) => org.organization.id.toString() === selectedOrgId)
                                ?.organization.name || ''
                        }
                        disabled
                    />
                </Form.Item>

                <Form.Item name="role" label="Role" rules={[{required: true}]}>
                    <Select placeholder="Select Role">
                        {roles.map((role) => (
                            <Select.Option key={role.id} value={role.id}>
                                {role.name}
                            </Select.Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item name="job_title" label="Job Title">
                    <Input/>
                </Form.Item>

                <Form.Item>
                    <Button type="primary" htmlType="submit" block style={{marginTop: '1rem'}}>
                        {isEditMode ? 'Save Changes' : 'Create User'}
                    </Button>
                </Form.Item>
            </Form>
        </Modal>
    );
}
