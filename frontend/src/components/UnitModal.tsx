import React, {useState, useEffect, ChangeEvent, useContext} from 'react';
import {
    Modal,
    Form,
    Input,
    Select,
    Button,
    Upload,
    Checkbox,
    List,
    Typography,
    message,
    Tooltip,
    Space,
} from 'antd';
import {UploadOutlined} from '@ant-design/icons';
import axios from 'axios';
import {AuthContext} from '../contexts/AuthContext';
import {Department} from '../models/Department';
import {Unit} from '../models/Unit';
import {UserModel} from '../models/UserModel';
import {DeleteOutlined, CrownOutlined} from '@ant-design/icons';

const {Option} = Select;

interface UnitModalProps {
    selectedOrgId: string;
    departments: Department[];
    users: UserModel[];
    unitToEdit?: Unit | null;
    onClose: () => void;
    onSuccess: () => void;
}

export default function UnitModal({
                                      selectedOrgId,
                                      departments,
                                      users,
                                      unitToEdit,
                                      onClose,
                                      onSuccess,
                                  }: UnitModalProps) {
    const {user} = useContext(AuthContext);
    const apiUrl = process.env.REACT_APP_API_URL;

    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    // const [displayPicture, setDisplayPicture] = useState<File | null>(null);
    const [fileList, setFileList] = useState<any[]>([]);
    const [members, setMembers] = useState<{ id: number; user: number; is_admin: boolean }[]>([]);
    const [selectedOrgUserId, setSelectedOrgUserId] = useState<string>('');

    const isEditMode = !!unitToEdit;

    useEffect(() => {
        if (unitToEdit) {
            form.setFieldsValue({
                name: unitToEdit.name,
                department: unitToEdit.department?.id,
            });
            setMembers(
                unitToEdit.members?.map((m) => ({
                    id: m.id,
                    user: m.user,
                    is_admin: m.is_admin,
                })) || []
            );
            if (unitToEdit.display_picture) {
                setFileList([
                    {
                        uid: '-1',
                        name: 'Existing Image',
                        status: 'done',
                        url: unitToEdit.display_picture,
                    },
                ]);
            }
        } else {
            form.resetFields();
            setMembers([]);
        }
    }, [unitToEdit, form]);

    const getEligibleUsersForOrg = () =>
        users.flatMap((user) => {
            const orgProfile = user.organizations.find(
                (org) => String(org.organization_id) === selectedOrgId
            );
            return orgProfile
                ? [{...user, org_user_id: orgProfile.org_user_id, job_title: orgProfile.job_title}]
                : [];
        });

    const handleAddMember = async () => {
        const orgUserId = parseInt(selectedOrgUserId);
        if (!orgUserId || members.find((m) => m.user === orgUserId)) return;

        try {
            const response = await axios.post(
                `${apiUrl}/api/unit-memberships/`,
                {
                    unit: unitToEdit?.id,
                    user: orgUserId,
                    is_admin: false,
                },
                {
                    headers: {
                        Authorization: `Token ${user?.token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            setMembers((prev) => [...prev, response.data]);
            setSelectedOrgUserId('');
        } catch (error) {
            console.error('Failed to add member:', error);
            message.error('Failed to add member');
        }
    };

    const handleRemoveMember = async (orgUserId: number, id: number) => {
        try {
            await axios.delete(`${apiUrl}/api/unit-memberships/${id}/`, {
                headers: {
                    Authorization: `Token ${user?.token}`,
                },
            });
            setMembers((prev) => prev.filter((m) => m.user !== orgUserId));
        } catch (error) {
            console.error('Failed to remove member:', error);
            message.error('Failed to remove member');
        }
    };

    const toggleAdmin = async (orgUserId: number, id: number, is_admin: boolean) => {
        try {
            const response = await axios.patch(
                `${apiUrl}/api/unit-memberships/${id}/`,
                {is_admin: !is_admin},
                {
                    headers: {
                        Authorization: `Token ${user?.token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            setMembers((prev) =>
                prev.map((m) => (m.user === orgUserId ? response.data : m))
            );
        } catch (error) {
            console.error('Failed to update admin status:', error);
            message.error('Failed to update admin status');
        }
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);

            const formData = new FormData();
            formData.append('name', values.name);
            formData.append('department', values.department);
            const file = fileList?.[0]?.originFileObj;
            if (file) {
                formData.append('display_picture', file);
            }

            const request = isEditMode
                ? axios.patch(`${apiUrl}/api/units/${unitToEdit?.id}/`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Token ${user?.token}`,
                    },
                })
                : axios.post(`${apiUrl}/api/units/`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Token ${user?.token}`,
                    },
                });

            await request;
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to submit unit:', error);
            message.error('Failed to submit unit');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            open={true}
            title={isEditMode ? 'Edit Unit' : 'Create New Unit'}
            onCancel={onClose}
            onOk={handleSubmit}
            confirmLoading={loading}
            okText={isEditMode ? 'Update Unit' : 'Create Unit'}
            destroyOnClose
        >
            <Form form={form} layout="vertical">
                <Form.Item
                    name="name"
                    label="Unit Name"
                    rules={[{required: true, message: 'Please enter a unit name'}]}
                >
                    <Input placeholder="Unit Name"/>
                </Form.Item>

                <Form.Item
                    name="department"
                    label="Department"
                    rules={[{required: true, message: 'Please select a department'}]}
                >
                    <Select placeholder="Select Department">
                        {departments
                            .filter((d) => String(d.location_details?.organization) === selectedOrgId)
                            .map((dep) => (
                                <Option key={dep.id} value={dep.id}>
                                    {dep.name} - {dep.location_details.name}
                                </Option>
                            ))}
                    </Select>
                </Form.Item>

                <Form.Item label="Display Picture">
                    <Upload
                        fileList={fileList}
                        onChange={({fileList: newFileList}) => {
                            // Optional: Limit to max 1 file
                            if (newFileList.length > 1) newFileList = [newFileList[newFileList.length - 1]];
                            setFileList(newFileList);
                        }}
                        beforeUpload={() => false}  // prevent auto-upload
                        listType="picture"
                        maxCount={1}
                        accept="image/*"
                    >
                        <Button icon={<UploadOutlined/>}>Upload</Button>
                    </Upload>
                </Form.Item>

                {/*<Form.Item label="Add Member" style={{width: '100%'}}>*/}
                {/*    <Input.Group compact style={{display: 'flex'}}>*/}
                {/*        <Select*/}
                {/*            value={selectedOrgUserId}*/}
                {/*            onChange={setSelectedOrgUserId}*/}
                {/*            style={{flex: 1}}*/}
                {/*            placeholder="Select Member"*/}
                {/*        >*/}
                {/*            {getEligibleUsersForOrg().map((u) => (*/}
                {/*                <Option key={u.org_user_id} value={u.org_user_id}>*/}
                {/*                    {u.name} ({u.job_title})*/}
                {/*                </Option>*/}
                {/*            ))}*/}
                {/*        </Select>*/}
                {/*        <Button type="primary" onClick={handleAddMember} style={{marginLeft: 8}}>*/}
                {/*            Add*/}
                {/*        </Button>*/}
                {/*    </Input.Group>*/}
                {/*</Form.Item>*/}
                <Form.Item label="Add Member" style={{width: '100%'}}>
                    <Input.Group compact style={{display: 'flex'}}>
                        <Select
                            value={selectedOrgUserId}
                            onChange={setSelectedOrgUserId}
                            style={{flex: 1}}
                            placeholder="Select Member"
                            optionFilterProp="children"
                            showSearch
                        >
                            {getEligibleUsersForOrg().map((u) => {
                                const isAlreadyMember = members.some((m) => m.user === u.org_user_id);
                                return (
                                    <Select.Option
                                        key={u.org_user_id}
                                        value={u.org_user_id}
                                        disabled={isAlreadyMember}
                                    >
                                        {u.name} ({u.job_title}) {isAlreadyMember ? ' - Added' : ''}
                                    </Select.Option>
                                );
                            })}
                        </Select>
                        <Button
                            type="primary"
                            onClick={handleAddMember}
                            style={{marginLeft: 8}}
                            disabled={!selectedOrgUserId}
                        >
                            Add
                        </Button>
                    </Input.Group>
                </Form.Item>

                {members.length > 0 && (
                    <List
                        header="Members"
                        bordered
                        dataSource={members}
                        renderItem={(member) => {
                            const userDetails = getEligibleUsersForOrg().find(
                                (u) => u.org_user_id === member.user
                            );
                            return (
                                <List.Item
                                    actions={[
                                        <Tooltip title="Toggle Admin Access" key="admin-toggle">
                                            <Checkbox
                                                checked={member.is_admin}
                                                onChange={() =>
                                                    toggleAdmin(member.user, member.id, member.is_admin)
                                                }
                                            >
                                                Admin
                                            </Checkbox>
                                        </Tooltip>,

                                        <Tooltip title="Remove Member" key="remove">
                                            <Button
                                                danger
                                                type="text"
                                                icon={<DeleteOutlined/>}
                                                onClick={() => handleRemoveMember(member.user, member.id)}
                                            />
                                        </Tooltip>
                                    ]}
                                >
                                    <Space direction="vertical" size={0}>
                                        <Typography.Text strong>{userDetails?.name}</Typography.Text>
                                        <Typography.Text type="secondary" style={{fontSize: 12}}>
                                            {userDetails?.job_title || '—'}
                                        </Typography.Text>
                                    </Space>
                                </List.Item>
                            );
                        }}
                    />
                )}
            </Form>
        </Modal>
    );
}
