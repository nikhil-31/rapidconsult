// pages/EditProfile.tsx
import React, {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {ProfileData} from '../models/ProfileData';
import {Contact} from '../models/Contact';
import {UploadOutlined, PlusOutlined} from '@ant-design/icons';
import {Card, Form, Input, Button, Avatar, Upload, Table, Modal, Checkbox, Typography, Space, Skeleton,} from 'antd';
import {addContact, deleteContact, getProfile, updateContact, updateProfile} from "../api/services";

const {Title, Text} = Typography;

const EditProfile: React.FC = () => {

    const navigate = useNavigate();
    const [profile, setProfile] = useState<ProfileData>({
        id: 0,
        name: '',
        username: '',
        email: '',
        contacts: [],
        organizations: [],
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [contactModalVisible, setContactModalVisible] = useState(false);
    const [editingContact, setEditingContact] = useState<Contact | null>(null);
    const [contactForm] = Form.useForm();
    const [confirmDelete, setConfirmDelete] = useState(false);

    const fetchProfile = async () => {
        try {
            const profileData = await getProfile();
            setProfile({
                id: profileData.id,
                name: profileData.name || '',
                username: profileData.username || '',
                email: profileData.email || '',
                contacts: profileData.contacts || [],
                organizations: profileData.organizations || [],
            });
            if (profileData.profile_picture) setPreviewUrl(profileData.profile_picture);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleFileChange = (file: File) => {
        if (!file.type.startsWith('image/')) {
            return Upload.LIST_IGNORE;
        }
        if (file.size > 5 * 1024 * 1024) {
            return Upload.LIST_IGNORE;
        }
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        return false;
    };

    const handleSubmit = async (values: any) => {
        setSaving(true);
        try {
            const formData = new FormData();
            formData.append('name', values.name);
            formData.append('email', values.email);
            if (selectedFile) formData.append('profile_picture', selectedFile);

            await updateProfile(formData);
            navigate('/profile');
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    // Contact management
    const openContactModal = (contact?: Contact) => {
        setEditingContact(contact || null);
        contactForm.setFieldsValue({
            label: contact?.label || '',
            type: contact?.type || 'mobile',
            number: contact?.number || '',
            primary: contact?.primary || false,
        });
        setContactModalVisible(true);
    };

    const handleContactSubmit = async (values: any) => {
        try {
            const contactData = {
                label: values.label,
                type: values.type,
                number: values.number,
                primary: values.primary,
            };

            if (editingContact) {
                await updateContact(editingContact.id, contactData);
            } else {
                await addContact(contactData);
            }

            fetchProfile();
            setContactModalVisible(false);
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async () => {
        if (!editingContact) return;
        try {
            await deleteContact(editingContact.id);
            fetchProfile();
            setContactModalVisible(false);
            setConfirmDelete(false);
            setEditingContact(null);
        } catch (err) {
            console.error(err);
        }
    };

    const contactColumns = [
        {
            title: 'Label',
            dataIndex: 'label',
            key: 'label',
            render: (text: string, record: Contact) => (
                <span>
                    {text || record.type}{' '}
                    {record.primary && <Text type="danger">Primary</Text>}
                </span>
            ),
        },
        {
            title: 'Number',
            dataIndex: 'number',
            key: 'number',
        },
        {
            title: 'Type',
            dataIndex: 'type',
            key: 'type',
            render: (text: string) => <Text>{text}</Text>,
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: Contact) => (
                <Space>
                    <Button type="link" onClick={() => openContactModal(record)}>
                        Edit
                    </Button>
                </Space>
            ),
        },
    ];

    if (loading)
        return (
            <div style={{maxWidth: 960, margin: '0 auto', padding: 24}}>
                <Card>
                    {/* Profile Picture */}
                    <Form layout="vertical">
                        <Form.Item label="Profile Picture">
                            <Space direction="vertical">
                                <Skeleton.Avatar size={80} active/>
                                <Skeleton.Button style={{width: 120}} active/>
                            </Space>
                        </Form.Item>

                        {/* Full Name */}
                        <Form.Item label="Full Name">
                            <Skeleton.Input style={{width: '100%'}} active/>
                        </Form.Item>

                        {/* Email */}
                        <Form.Item label="Email">
                            <Skeleton.Input style={{width: '100%'}} active/>
                        </Form.Item>

                        {/* Add Contact Button */}
                        <Form.Item label="Contacts">
                            <div style={{display: 'flex', justifyContent: 'flex-end', marginBottom: 16}}>
                                <Skeleton.Button style={{width: 120}} active/>
                            </div>
                            {/* Contacts Table Skeleton */}
                            <Skeleton active paragraph={{rows: 3}}/>
                        </Form.Item>

                        {/* Actions */}
                        <Form.Item>
                            <div style={{display: 'flex', justifyContent: 'flex-end', gap: 8}}>
                                <Skeleton.Button style={{width: 120}} active/>
                                <Skeleton.Button style={{width: 80}} active/>
                            </div>
                        </Form.Item>
                    </Form>
                </Card>
            </div>
        );

    return (
        <div style={{maxWidth: 960, margin: '0 auto', padding: 24}}>
            <Card>
                <Title level={3}>Edit Profile</Title>

                <Form
                    layout="vertical"
                    onFinish={handleSubmit}
                    initialValues={{name: profile.name, email: profile.email}}
                >
                    {/* Profile Picture */}
                    <Form.Item label="Profile Picture">
                        <Space direction="vertical">
                            <Avatar size={80} src={previewUrl || '/doctor-default.png'}/>
                            <Upload beforeUpload={handleFileChange} showUploadList={false}>
                                <Button icon={<UploadOutlined/>}>Change Picture</Button>
                            </Upload>
                        </Space>
                    </Form.Item>

                    {/* Name */}
                    <Form.Item
                        label="Full Name"
                        name="name"
                        rules={[{required: true, message: 'Name is required'}]}
                    >
                        <Input/>
                    </Form.Item>

                    {/* Email */}
                    <Form.Item
                        label="Email"
                        name="email"
                        rules={[
                            {required: true, message: 'Email is required'},
                            {type: 'email', message: 'Enter a valid email'},
                        ]}
                    >
                        <Input/>
                    </Form.Item>

                    {/* Contact Table */}
                    <Form.Item label="Contacts">
                        <div style={{display: 'flex', justifyContent: 'flex-end', marginBottom: 16}}>
                            <Button
                                type="primary"
                                danger
                                icon={<PlusOutlined/>}
                                onClick={() => openContactModal()}
                            >
                                Add Contact
                            </Button>
                        </div>
                        <Table
                            columns={contactColumns}
                            dataSource={profile.contacts}
                            rowKey="id"
                            style={{marginTop: 16}}
                            pagination={false}
                        />
                    </Form.Item>

                    {/* Actions */}
                    <Form.Item>
                        <div style={{display: 'flex', justifyContent: 'flex-end', gap: 8}}>
                            <Space>
                                <Button type="primary" danger htmlType="submit" loading={saving}>
                                    Save Changes
                                </Button>
                                <Button onClick={() => navigate('/profile')}>Cancel</Button>
                            </Space>
                        </div>
                    </Form.Item>
                </Form>

                {/* Contact Modal */}
                <Modal
                    title={editingContact ? 'Edit Contact' : 'Add Contact'}
                    open={contactModalVisible}
                    onCancel={() => {
                        setContactModalVisible(false);
                        setConfirmDelete(false);
                    }}
                    footer={null}
                >
                    <Form form={contactForm} layout="vertical" onFinish={handleContactSubmit}>
                        <Form.Item label="Label" name="label" rules={[{required: true}]}>
                            <Input placeholder="Mobile, Work, Home"/>
                        </Form.Item>

                        <Form.Item label="Type" name="type" rules={[{required: true}]}>
                            <Input/>
                        </Form.Item>

                        <Form.Item label="Number/Contact" name="number" rules={[{required: true}]}>
                            <Input/>
                        </Form.Item>

                        <Form.Item name="primary" valuePropName="checked">
                            <Checkbox>Set as primary contact</Checkbox>
                        </Form.Item>

                        <Form.Item>
                            <Space style={{display: 'flex', justifyContent: 'space-between', width: '100%'}}>
                                {editingContact && (
                                    <div>
                                        {!confirmDelete && (
                                            <Button danger onClick={() => setConfirmDelete(true)}>
                                                Delete
                                            </Button>
                                        )}
                                        {confirmDelete && (
                                            <Space>
                                                <span>Are you sure?</span>
                                                <Button danger onClick={handleDelete}>
                                                    Yes
                                                </Button>
                                                <Button onClick={() => setConfirmDelete(false)}>No</Button>
                                            </Space>
                                        )}
                                    </div>
                                )}

                                <Space>
                                    <Button onClick={() => setContactModalVisible(false)}>Cancel</Button>
                                    <Button type="primary" htmlType="submit">
                                        {editingContact ? 'Update Contact' : 'Add Contact'}
                                    </Button>
                                </Space>
                            </Space>
                        </Form.Item>
                    </Form>
                </Modal>
            </Card>
        </div>
    );
};

export default EditProfile;
