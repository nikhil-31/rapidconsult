import React, {useContext, useEffect, useState} from 'react';
import {Modal, Form, Input, Select, Upload, Button} from 'antd';
import {UploadOutlined} from '@ant-design/icons';
import axios from 'axios';
import {AuthContext} from '../contexts/AuthContext';
import {Department} from '../models/Department';
import {Location} from '../models/Location';
import {createDepartment, getLocations, updateDepartment} from "../api/services";

interface DepartmentModalProps {
    onClose: () => void;
    onSuccess: () => void;
    editingDepartment?: Department | null;
    selectedOrgId: string;
}

export default function DepartmentModal({
                                            onClose,
                                            onSuccess,
                                            editingDepartment = null,
                                            selectedOrgId,
                                        }: DepartmentModalProps) {
    const {user} = useContext(AuthContext);
    const isEditMode = Boolean(editingDepartment);
    const apiUrl = process.env.REACT_APP_API_URL;

    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [fileList, setFileList] = useState<any[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);

    useEffect(() => {
        if (editingDepartment) {
            form.setFieldsValue({
                name: editingDepartment.name || '',
                location: editingDepartment.location_details?.id?.toString() || '',
            });

            if (editingDepartment.display_picture) {
                setFileList([
                    {
                        uid: '-1',
                        name: 'Existing Image',
                        status: 'done',
                        url: editingDepartment.display_picture,
                    },
                ]);
            }
        }
    }, [editingDepartment, form]);

    useEffect(() => {
        if (!selectedOrgId) return;

        const fetchLocations = async () => {
            try {
                const res = await getLocations(selectedOrgId, 1, 20);
                setLocations(res.results);
            } catch (error) {
                console.error("Error fetching locations:", error);
            }
        };

        fetchLocations();
    }, [selectedOrgId]);

    const handleSubmit = async (values: any) => {
        setLoading(true);

        const formData = new FormData();
        formData.append("name", values.name);
        formData.append("location", values.location);

        const file = fileList?.[0]?.originFileObj;
        if (file) formData.append("display_picture", file);

        try {
            if (isEditMode && editingDepartment) {
                const res = await updateDepartment(editingDepartment.id, formData);
            } else {
                const res = await createDepartment(formData);
            }

            onSuccess();
            onClose();
        } catch (error) {
            console.error("Error saving department:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            open={true}
            onCancel={onClose}
            title={isEditMode ? 'Edit Department' : 'Create Department'}
            footer={null}
            destroyOnClose
        >
            <Form
                layout="vertical"
                form={form}
                onFinish={handleSubmit}
                initialValues={{name: '', location: ''}}
            >
                <Form.Item
                    name="name"
                    label="Department Name"
                    rules={[{required: true, message: 'Please enter a name'}]}
                >
                    <Input placeholder="Enter department name"/>
                </Form.Item>

                <Form.Item
                    name="location"
                    label="Location"
                    rules={[{required: true, message: 'Please select a location'}]}
                >
                    <Select placeholder="Select location" disabled={isEditMode}>
                        {locations.map((loc) => (
                            <Select.Option key={loc.id} value={String(loc.id)}>
                                {loc.name}
                            </Select.Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item name="display_picture" label="Display Picture">
                    <Upload
                        fileList={fileList}
                        onChange={({fileList}) => setFileList(fileList)}
                        beforeUpload={() => false}
                        listType="picture"
                        maxCount={1}
                    >
                        <Button icon={<UploadOutlined/>}>Upload</Button>
                    </Upload>
                </Form.Item>

                <Form.Item>
                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={loading}
                        block
                    >
                        {loading
                            ? isEditMode
                                ? 'Saving...'
                                : 'Creating...'
                            : isEditMode
                                ? 'Save Changes'
                                : 'Create Department'}
                    </Button>
                </Form.Item>
            </Form>
        </Modal>
    );
}
