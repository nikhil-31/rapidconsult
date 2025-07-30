import React, {useContext, useEffect, useState} from 'react';
import axios from 'axios';
import {AuthContext} from '../contexts/AuthContext';
import {Department} from '../models/Department';
import {Location} from '../models/Location';

interface DepartmentModalProps {
    onClose: () => void;
    onSuccess: () => void;
    editingDepartment?: Department | null;
    locations: Location[];
    selectedOrgId: string;
}

export default function DepartmentModal({
                                            onClose,
                                            onSuccess,
                                            editingDepartment = null,
                                            locations,
                                            selectedOrgId,
                                        }: DepartmentModalProps) {
    const {user} = useContext(AuthContext);
    const isEditMode = Boolean(editingDepartment);
    const [form, setForm] = useState({
        name: '',
        location: '',
    });
    const [displayPicture, setDisplayPicture] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    const apiUrl = process.env.REACT_APP_API_URL;

    useEffect(() => {
        if (editingDepartment) {
            setForm({
                name: editingDepartment.name || '',
                location: editingDepartment.location_details?.id.toString() || '',
            });
        }
    }, [editingDepartment]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const {name, value} = e.target;
        setForm((prev) => ({...prev, [name]: value}));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setDisplayPicture(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData();
        formData.append('name', form.name);
        formData.append('location', form.location);
        if (displayPicture) {
            formData.append('display_picture', displayPicture);
        }

        try {
            if (isEditMode && editingDepartment) {
                await axios.patch(
                    `${apiUrl}/api/departments/${editingDepartment.id}/`,
                    formData,
                    {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                            Authorization: `Token ${user?.token}`,
                        },
                    }
                );
            } else {
                await axios.post(`${apiUrl}/api/departments/`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Token ${user?.token}`,
                    },
                });
            }
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error saving department:', error);
            alert('Failed to save department');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg relative max-h-[90vh] overflow-hidden">
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-gray-500 hover:text-black"
                >
                    ✖
                </button>
                <div className="overflow-y-auto p-4 max-h-[calc(90vh-3rem)]">
                    <h2 className="text-xl font-semibold mb-4">
                        {isEditMode ? 'Edit Department' : 'Create Department'}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input
                            name="name"
                            placeholder="Department Name"
                            value={form.name}
                            onChange={handleChange}
                            required
                            className="border w-full p-2 rounded"
                        />
                        <select
                            name="location"
                            value={form.location}
                            onChange={handleChange}
                            required
                            className="border w-full p-2 rounded"
                            disabled={isEditMode} // prevent changing org through location
                        >
                            <option value="">Select Location</option>
                            {locations
                                .map((loc) => (
                                    <option key={loc.id} value={loc.id}>
                                        {loc.name}
                                    </option>
                                ))}
                        </select>

                        <input
                            type="file"
                            name="display_picture"
                            onChange={handleFileChange}
                            className="border w-full p-2 rounded"
                        />

                        <button
                            type="submit"
                            className="bg-blue-600 text-white px-4 py-2 rounded w-full"
                            disabled={loading}
                        >
                            {loading
                                ? isEditMode
                                    ? 'Saving...'
                                    : 'Creating...'
                                : isEditMode
                                    ? 'Save Changes'
                                    : 'Create Department'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
