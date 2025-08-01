import React, {useState, useEffect, ChangeEvent, FormEvent, useContext} from 'react';
import axios from 'axios';
import {AuthContext} from '../contexts/AuthContext';
import {Department} from '../models/Department';
import {Unit} from '../models/Unit';

interface UnitModalProps {
    selectedOrgId: string;
    departments: Department[];
    unitToEdit?: Unit | null;
    onClose: () => void;
    onSuccess: () => void;
}

export default function UnitModal({
                                      selectedOrgId,
                                      departments,
                                      unitToEdit,
                                      onClose,
                                      onSuccess,
                                  }: UnitModalProps) {
    const {user} = useContext(AuthContext);
    const apiUrl = process.env.REACT_APP_API_URL;

    const [form, setForm] = useState({
        name: '',
        department: '',
    });
    const [displayPicture, setDisplayPicture] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (unitToEdit) {
            setForm({
                name: unitToEdit.name || '',
                department: String(unitToEdit.department?.id || ''),
            });
        }
    }, [unitToEdit]);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const {name, value} = e.target;
        setForm(prev => ({...prev, [name]: value}));
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setDisplayPicture(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData();
        formData.append('name', form.name);
        formData.append('department', form.department);
        if (displayPicture) {
            formData.append('display_picture', displayPicture);
        }

        const request = unitToEdit
            ? axios.patch(`${apiUrl}/api/units/${unitToEdit.id}/`, formData, {
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

        request.then((response) => {
            console.log('Unit submitted successfully:', response.data);
            onSuccess();
            onClose();
        }).catch((error) => {
            console.error('Failed to submit unit:', error);
            alert('Failed to submit unit');
        }).finally(() => {
            setLoading(false);
        });

    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-lg relative max-h-[90vh] overflow-hidden">
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-gray-500 hover:text-black z-10"
                >
                    ✖
                </button>
                <div className="overflow-y-auto p-6 space-y-4 max-h-[calc(90vh-3rem)]">
                    <h3 className="text-xl font-semibold">
                        {unitToEdit ? 'Edit Unit' : 'Create New Unit'}
                    </h3>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input
                            type="text"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="Unit Name"
                            required
                            className="border w-full p-2 rounded"
                        />

                        <select
                            name="department"
                            value={form.department}
                            onChange={handleChange}
                            required
                            className="border w-full p-2 rounded"
                        >
                            <option value="">Select Department</option>
                            {departments
                                .filter(dep => String(dep.location_details?.organization) === selectedOrgId)
                                .map(dep => (
                                    <option key={dep.id} value={dep.id}>
                                        {dep.name} - {dep.location_details.name}
                                    </option>
                                ))}
                        </select>

                        <div>
                            <label className="block mb-1 font-medium">Display Picture</label>
                            <input type="file" onChange={handleFileChange}/>
                        </div>

                        <button
                            type="submit"
                            className="bg-blue-600 text-white px-4 py-2 rounded w-full"
                            disabled={loading}
                        >
                            {loading
                                ? unitToEdit
                                    ? 'Updating...'
                                    : 'Creating...'
                                : unitToEdit
                                    ? 'Update Unit'
                                    : 'Create Unit'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
