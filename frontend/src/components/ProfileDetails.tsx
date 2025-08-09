import React from 'react';
import {Avatar, Button, Card, Col, Descriptions, Divider, List, Row, Table, Typography} from 'antd';
import {useNavigate} from 'react-router-dom';
import {Contact} from '../models/Contact';
import {Address} from '../models/Address';
import {ProfileData} from "../models/ProfileData";
import {useOrgLocation} from "../contexts/LocationContext";

const {Title, Text} = Typography;

interface AllowedLocation {
    name: string;
    organization_name: string;
    address: Address;
}

interface ProfileDetailsProps {
    name: string;
    email: string;
    profilePicture?: string;
    contacts: Contact[];
    locations: AllowedLocation[] | null;
    showEditProfile: boolean;
    profile: ProfileData;
}

const ProfileDetails: React.FC<ProfileDetailsProps> = ({
                                                           name,
                                                           email,
                                                           profilePicture,
                                                           contacts,
                                                           locations,
                                                           showEditProfile,
                                                           profile
                                                       }) => {
    const navigate = useNavigate();
    const {selectedLocation} = useOrgLocation();
    const contactColumns = [
        {title: 'Label', dataIndex: 'label', key: 'label'},
        {title: 'Type', dataIndex: 'type', key: 'type'},
        {title: 'Number/Contact', dataIndex: 'number', key: 'number'},
        {
            title: 'Primary',
            dataIndex: 'primary',
            key: 'primary',
            render: (val: boolean) => (val ? 'Yes' : 'No'),
        },
    ];


    const organization = profile.organizations?.find(org =>
        org.allowed_locations?.some(loc => loc.id === selectedLocation?.location?.id)
    );

    function getUserJobTitle(profile: ProfileData): string | null {
        const orgWithLocation = profile.organizations?.find(org =>
            org.allowed_locations?.some(loc => loc.id === selectedLocation?.location?.id)
        );

        if (orgWithLocation?.job_title && orgWithLocation?.role) {
            return (`${orgWithLocation.job_title} - ${orgWithLocation.role.name}`);
        }
        return null;
    }

    return (
        <div>
            {/* Profile Header */}
            <Card>
                <Row justify="space-between" align="middle">
                    <Col>
                        <Row gutter={16} align="middle">
                            <Col>
                                <Avatar
                                    size={96}
                                    src={profilePicture || '/doctor-default.png'}
                                />
                            </Col>
                            <Col>
                                <Title level={3} style={{marginBottom: 0}}>
                                    {name}
                                </Title>
                            </Col>
                        </Row>
                    </Col>
                    {showEditProfile &&
                        <Col>
                            <Button type="primary" danger onClick={() => navigate('/profile/edit')}>
                                Edit Profile
                            </Button>
                        </Col>
                    }
                </Row>
            </Card>

            <Divider/>

            {/* Bio Section */}
            <Card title="Bio" style={{marginBottom: 20}}>
                <Descriptions column={1} bordered size="small" labelStyle={{fontWeight: 'bold'}}>
                    <Descriptions.Item label="Email">
                        <Text>{email}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Role">
                        <Text>{organization?.role?.name || 'N/A'}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Job Title">
                        <Text>{organization?.job_title || 'N/A'}</Text>
                    </Descriptions.Item>
                </Descriptions>
            </Card>

            <Divider/>

            {/* Contacts */}
            <Card title="Contact Info">
                <Table
                    rowKey="id"
                    dataSource={contacts}
                    columns={contactColumns}
                    pagination={false}
                />
            </Card>

            <Divider/>

            {/* Locations */}
            {locations && locations.length > 0 && (
                <Card title="Locations" style={{marginTop: 20}}>
                    <List
                        itemLayout="vertical"
                        dataSource={locations}
                        renderItem={item => (
                            <List.Item
                                style={{
                                    borderRadius: 8,
                                    padding: 5,
                                    marginBottom: 12,
                                }}
                            >
                                <List.Item.Meta
                                    title={
                                        <>
                                            <List.Item.Meta
                                                title={<Typography.Text strong>{item.name}</Typography.Text>}
                                            />
                                            <Text type="secondary" style={{fontSize: 14}}>
                                                {item.organization_name}
                                            </Text>
                                        </>
                                    }
                                    description={
                                        <div style={{marginTop: 8}}>
                                            <Text>
                                                {item.address.address_1}
                                                {item.address.address_2 && `, ${item.address.address_2}`}
                                            </Text>
                                            <br/>
                                            <Text type="secondary">
                                                {item.address.city}, {item.address.state} {item.address.zip_code}
                                            </Text>
                                            <br/>
                                            <Text type="secondary">Label: {item.address.label}</Text>
                                        </div>
                                    }
                                />
                            </List.Item>
                        )}
                    />
                </Card>
            )}
        </div>
    );
};

export default ProfileDetails;
