import React, {useState, useEffect, useContext} from 'react';
import {Modal, Form, Input, Upload, Button, Typography, message} from 'antd';
import {UploadOutlined} from '@ant-design/icons';
import axios from 'axios';
import {AuthContext} from '../contexts/AuthContext';
import {Location} from '../models/Location';
import {OrgProfile} from "../models/OrgProfile";

const {Title} = Typography;

interface CreateLocationModalProps {
    selectedOrgId: string;
    orgs: OrgProfile[];
    onSuccess: () => void;
    onClose: () => void;
    editingLocation?: Location | null;
}

export default function LocationModal({
                                          selectedOrgId,
                                          orgs,
                                          onSuccess,
                                          onClose,
                                          editingLocation = null,
                                      }: CreateLocationModalProps) {
    const {user} = useContext(AuthContext);
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [fileList, setFileList] = useState<any[]>([]);

    const isEditMode = !!editingLocation;
    const apiUrl = process.env.REACT_APP_API_URL;

    useEffect(() => {
        if (editingLocation) {
            form.setFieldsValue({
                name: editingLocation.name || '',
                address_1: editingLocation.address?.address_1 || '',
                address_2: editingLocation.address?.address_2 || '',
                city: editingLocation.address?.city || '',
                state: editingLocation.address?.state || '',
                zip_code: editingLocation.address?.zip_code || '',
                lat: editingLocation.address?.lat?.toString() || '',
                lon: editingLocation.address?.lon?.toString() || '',
                label: editingLocation.address?.label || '',
            });
            if (editingLocation.display_picture) {
                setFileList([
                    {
                        uid: '-1',
                        name: 'Existing Image',
                        status: 'done',
                        url: editingLocation.display_picture,
                    },
                ]);
            }
        } else {
            form.resetFields();
        }
    }, [editingLocation, form]);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);

            const formData = new FormData();
            formData.append('name', values.name);
            formData.append('organization', selectedOrgId);
            formData.append('address.address_1', values.address_1);
            formData.append('address.address_2', values.address_2);
            formData.append('address.city', values.city);
            formData.append('address.state', values.state);
            formData.append('address.zip_code', values.zip_code);
            formData.append('address.lat', values.lat);
            formData.append('address.lon', values.lon);
            formData.append('address.label', values.label);

            const file = fileList?.[0]?.originFileObj;
            if (file) {
                formData.append('display_picture', file);
            }

            const request = isEditMode
                ? axios.patch(`${apiUrl}/api/locations/${editingLocation?.id}/`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Token ${user?.token}`,
                    },
                })
                : axios.post(`${apiUrl}/api/locations/`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Token ${user?.token}`,
                    },
                });

            await request;
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error saving location', error);
            message.error('Failed to save location');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            open={true}
            title={isEditMode ? 'Edit Location' : 'Create New Location'}
            onCancel={onClose}
            onOk={handleSubmit}
            okText={isEditMode ? 'Save Changes' : 'Create Location'}
            confirmLoading={loading}
            destroyOnClose
            width={600}
        >
            <Form
                form={form}
                layout="vertical"
                initialValues={{organization: selectedOrgId}}
            >
                <Form.Item label="Organization">
                    <Input
                        value={
                            orgs.find((org) => org.organization.id.toString() === selectedOrgId)?.organization.name || ''
                        }
                        disabled
                    />
                </Form.Item>

                <Form.Item
                    name="name"
                    label="Location Name"
                    rules={[{required: true, message: 'Please enter a location name'}]}
                >
                    <Input placeholder="Location name"/>
                </Form.Item>

                <Form.Item name="display_picture" label="Display Picture">
                    <Upload
                        fileList={fileList}
                        onChange={({fileList: newFileList}) => setFileList(newFileList)}
                        beforeUpload={() => false}
                        listType="picture"
                        maxCount={1}
                        accept="image/*"
                    >
                        <Button icon={<UploadOutlined/>}>Upload</Button>
                    </Upload>
                </Form.Item>

                <Title level={5}>Address</Title>

                <Form.Item name="address_1" label="Address Line 1">
                    <Input placeholder="Address Line 1"/>
                </Form.Item>

                <Form.Item name="address_2" label="Address Line 2">
                    <Input placeholder="Address Line 2"/>
                </Form.Item>

                <Form.Item name="city" label="City">
                    <Input placeholder="City"/>
                </Form.Item>

                <Form.Item name="state" label="State">
                    <Input placeholder="State"/>
                </Form.Item>

                <Form.Item name="zip_code" label="Zip Code">
                    <Input placeholder="Zip Code"/>
                </Form.Item>

                <Form.Item name="lat" label="Latitude">
                    <Input placeholder="Latitude"/>
                </Form.Item>

                <Form.Item name="lon" label="Longitude">
                    <Input placeholder="Longitude"/>
                </Form.Item>

                <Form.Item name="label" label="Label (e.g. HQ)">
                    <Input placeholder="Label (e.g. HQ)"/>
                </Form.Item>
            </Form>
        </Modal>
    );
}
