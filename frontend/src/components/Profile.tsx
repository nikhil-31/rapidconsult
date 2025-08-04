import React, {useContext, useEffect, useState} from 'react';
import axios from 'axios';
import {AuthContext} from '../contexts/AuthContext';
import ContactFormModal from '../components/ContactModal';
import {useNavigate} from 'react-router-dom';
import {
    Avatar,
    Button,
    Card,
    Col,
    Divider,
    List,
    Row,
    Table,
    Typography,
    message,
} from 'antd';

const {Title, Text} = Typography;

const Profile = () => {
    const [profile, setProfile] = useState<any>(null);
    const [showForm, setShowForm] = useState(false);
    const [editingContact, setEditingContact] = useState<any | null>(null);
    const apiUrl = process.env.REACT_APP_API_URL;
    const {user} = useContext(AuthContext);
    const navigate = useNavigate();

    const fetchProfile = async () => {
        try {
            const res = await axios.get(`${apiUrl}/api/profile/me/`, {
                headers: {Authorization: `Token ${user?.token}`},
            });
            setProfile(res.data);
        } catch (err) {
            console.error('Failed to load profile', err);
            message.error('Failed to load profile');
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleSubmitContact = async (contact: any) => {
        try {
            if (editingContact?.id) {
                await axios.put(`${apiUrl}/api/contacts/${editingContact.id}/`, contact, {
                    headers: {Authorization: `Token ${user?.token}`},
                });
            } else {
                await axios.post(`${apiUrl}/api/contacts/`, contact, {
                    headers: {Authorization: `Token ${user?.token}`},
                });
            }
            message.success('Contact saved successfully');
            setShowForm(false);
            setEditingContact(null);
            fetchProfile();
        } catch (err) {
            console.error('Failed to save contact', err);
            message.error('Failed to save contact');
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await axios.delete(`${apiUrl}/api/contacts/${id}/`, {
                headers: {Authorization: `Token ${user?.token}`},
            });
            message.success('Contact deleted');
            fetchProfile();
        } catch (err) {
            console.error('Delete failed', err);
            message.error('Failed to delete contact');
        }
    };

    if (!profile) return <div>Loading...</div>;

    const contactColumns = [
        {
            title: 'Label',
            dataIndex: 'label',
            key: 'label',
        },
        {
            title: 'Type',
            dataIndex: 'type',
            key: 'type',
        },
        {
            title: 'Number/Contact',
            dataIndex: 'number',
            key: 'number',
        },
        {
            title: 'Primary',
            dataIndex: 'primary',
            key: 'primary',
            render: (val: boolean) => (val ? 'Yes' : 'No'),
        },
    ];

    return (
        <div style={{maxWidth: 960, margin: '0 auto', padding: 24}}>
            <Card>
                <Row justify="space-between" align="middle">
                    <Col>
                        <Row gutter={16} align="middle">
                            <Col>
                                <Avatar
                                    size={96}
                                    src={profile.profile_picture || '/doctor-default.png'}
                                />
                            </Col>
                            <Col>
                                <Title level={3} style={{marginBottom: 0}}>
                                    {profile.name}
                                </Title>
                                <Text type="secondary">{profile.email}</Text>
                            </Col>
                        </Row>
                    </Col>
                    <Col>
                        <Button type="primary" danger onClick={() => navigate('/profile/edit')}>
                            Edit Profile
                        </Button>
                    </Col>
                </Row>
            </Card>

            <Divider/>

            {/* Contacts */}
            <Card
                title="Contact Info"
                // extra={
                    // <Button
                    //     type="primary"
                    //     onClick={() => {
                    //         setEditingContact(null);
                    //         setShowForm(true);
                    //     }}
                    // >
                    //     + Add Contact
                    // </Button>
                //{
            >
                <Table
                    rowKey="id"
                    dataSource={profile.contacts}
                    columns={contactColumns}
                    pagination={false}
                />
            </Card>

            {/* Contact Modal */}
            <ContactFormModal
                open={showForm}
                onClose={() => {
                    setShowForm(false);
                    setEditingContact(null);
                }}
                onSubmit={handleSubmitContact}
                initialData={editingContact}
            />

            <Divider/>

            {/* Organizations */}
            <Card title="Organizations">
                <List
                    itemLayout="vertical"
                    dataSource={profile.organizations}
                    renderItem={(org: any) => (
                        <List.Item key={org.id}>
                            <List.Item.Meta
                                title={<Text strong>{org.organisation.name}</Text>}
                                description={
                                    <>
                                        <Text type="secondary">
                                            {org.job_title} ({org.role.name})
                                        </Text>
                                        <br/>
                                        <Text type="secondary" style={{fontSize: 12}}>
                                            {org.organisation.address?.address_1},{' '}
                                            {org.organisation.address?.city},{' '}
                                            {org.organisation.address?.state} -{' '}
                                            {org.organisation.address?.zip_code}
                                        </Text>
                                    </>
                                }
                            />
                        </List.Item>
                    )}
                />
            </Card>
        </div>
    );
};

export default Profile;
