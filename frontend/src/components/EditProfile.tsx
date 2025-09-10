// pages/EditProfile.tsx
import React, {useContext, useEffect, useState} from 'react';
import axios from 'axios';
import {AuthContext} from '../contexts/AuthContext';
import {useNavigate} from 'react-router-dom';
import {ProfileData} from '../models/ProfileData';
import {Contact} from '../models/Contact';
import {
    Card,
    Form,
    Input,
    Button,
    Avatar,
    Upload,
    message,
    Table,
    Modal,
    Checkbox,
    Typography,
    Space,
    Row,
    Col
} from 'antd';
import {UploadOutlined, PlusOutlined} from '@ant-design/icons';

const {Title, Text} = Typography;

interface FormErrors {
    name?: string;
    username?: string;
    email?: string;
    profile_picture?: string;
    general?: string;

    [key: string]: string | undefined;
}

const EditProfile: React.FC = () => {
    const [profile, setProfile] = useState<ProfileData>({
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
    const [errors, setErrors] = useState<FormErrors>({});
    const [contactModalVisible, setContactModalVisible] = useState(false);
    const [editingContact, setEditingContact] = useState<Contact | null>(null);
    const [contactForm] = Form.useForm();

    const apiUrl = process.env.REACT_APP_API_URL;
    const {user} = useContext(AuthContext);
    const navigate = useNavigate();

    const fetchProfile = async () => {
        try {
            const res = await axios.get(`${apiUrl}/api/profile/me/`, {
                headers: {Authorization: `Token ${user?.token}`},
            });
            const profileData = res.data;
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
            message.error('Failed to load profile');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleFileChange = (file: File) => {
        if (!file.type.startsWith('image/')) {
            message.error('Please select a valid image file');
            return Upload.LIST_IGNORE;
        }
        if (file.size > 5 * 1024 * 1024) {
            message.error('File size must be less than 5MB');
            return Upload.LIST_IGNORE;
        }
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        return false; // prevent upload
    };

    const handleSubmit = async (values: any) => {
        setSaving(true);
        try {
            const formData = new FormData();
            formData.append('name', values.name);
            formData.append('email', values.email);

            if (selectedFile) formData.append('profile_picture', selectedFile);

            await axios.patch(`${apiUrl}/api/profile/me/`, formData, {
                headers: {
                    Authorization: `Token ${user?.token}`,
                    'Content-Type': 'multipart/form-data',
                },
            });
            message.success('Profile updated successfully');
            navigate('/profile');
        } catch (err: any) {
            console.error(err);
            message.error(err.response?.data?.general || 'Failed to update profile');
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
                await axios.put(`${apiUrl}/api/contacts/${editingContact.id}/`, contactData, {
                    headers: {Authorization: `Token ${user?.token}`},
                });
                message.success('Contact updated');
            } else {
                await axios.post(`${apiUrl}/api/contacts/`, contactData, {
                    headers: {Authorization: `Token ${user?.token}`},
                });
                message.success('Contact added');
            }
            fetchProfile();
            setContactModalVisible(false);
        } catch (err) {
            console.error(err);
            message.error('Failed to save contact');
        }
    };

    const handleDeleteContact = async (contactId: number) => {
        console.log(`Delete contact ${contactId}`)

        Modal.confirm({
            title: 'Delete Contact',
            content: 'Are you sure you want to delete this contact?',
            okText: 'Yes',
            cancelText: 'No',
            onOk: async () => {
                try {
                    await axios.delete(`${apiUrl}/api/contacts/${contactId}/`, {
                        headers: {Authorization: `Token ${user?.token}`},
                    });
                    fetchProfile();
                    message.success('Contact deleted');
                } catch (err) {
                    console.error(err);
                    message.error('Failed to delete contact');
                }
            },
        });
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
                    <Button type="link" danger onClick={() => handleDeleteContact(record.id)}>
                        Delete
                    </Button>
                </Space>
            ),
        },
    ];

    if (loading) return <Card loading style={{maxWidth: 600, margin: '50px auto'}}/>;

    return (

        <div style={{maxWidth: 960, margin: '0 auto', padding: 24}}>
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
                    <Button type="dashed" icon={<PlusOutlined/>} onClick={() => openContactModal()} block>
                        Add Contact
                    </Button>
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
                    <Space>
                        <Button type="primary" danger htmlType="submit" loading={saving}>
                            Save Changes
                        </Button>
                        <Button onClick={() => navigate('/profile')}>Cancel</Button>
                    </Space>
                </Form.Item>
            </Form>

            {/* Contact Modal */}
            <Modal
                title={editingContact ? 'Edit Contact' : 'Add Contact'}
                open={contactModalVisible}
                onCancel={() => setContactModalVisible(false)}
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
                        <Space style={{display: 'flex', justifyContent: 'flex-end'}}>
                            <Button onClick={() => setContactModalVisible(false)}>Cancel</Button>
                            <Button type="primary" htmlType="submit">
                                {editingContact ? 'Update Contact' : 'Add Contact'}
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default EditProfile;
