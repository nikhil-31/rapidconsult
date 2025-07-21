import React, {useEffect, useState, useContext} from 'react';
import axios from 'axios';
import {AuthContext} from '../contexts/AuthContext';

type ShiftEditDialogProps = {
    isOpen: boolean;
    shiftId: number | null;
    onClose: () => void;
    onSaved: () => void;
    defaultTimeRange?: { start: Date; end: Date };
};

export const ShiftEditDialog: React.FC<ShiftEditDialogProps> = ({
                                                                    isOpen,
                                                                    shiftId,
                                                                    onClose,
                                                                    onSaved,
                                                                    defaultTimeRange,
                                                                }) => {
    const {user} = useContext(AuthContext);
    const apiUrl = process.env.REACT_APP_API_URL;

    const [formData, setFormData] = useState({
        user: '',
        role: '',
        team: '',
        start_time: '',
        end_time: '',
    });

    const isEditing = !!shiftId;

    useEffect(() => {
        if (isEditing && shiftId) {
            axios
                .get(`${apiUrl}/api/shifts/${shiftId}/`, {
                    headers: {
                        Authorization: `Token ${user?.token}`,
                    },
                })
                .then((res) => {
                    const shift = res.data;
                    setFormData({
                        user: shift.user,
                        role: shift.role,
                        team: shift.team,
                        start_time: shift.start_time.slice(0, 16),
                        end_time: shift.end_time.slice(0, 16),
                    });
                });
        } else if (defaultTimeRange) {
            setFormData({
                user: '',
                role: '',
                team: '',
                start_time: defaultTimeRange.start.toISOString().slice(0, 16),
                end_time: defaultTimeRange.end.toISOString().slice(0, 16),
            });
        } else {
            setFormData({
                user: '',
                role: '',
                team: '',
                start_time: '',
                end_time: '',
            });
        }
    }, [isEditing, shiftId, defaultTimeRange]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({...formData, [e.target.name]: e.target.value});
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const config = {
            headers: {
                Authorization: `Token ${user?.token}`,
                'Content-Type': 'application/json',
            },
        };

        try {
            if (isEditing) {
                await axios.put(`${apiUrl}/api/shifts/${shiftId}/`, formData, config);
            } else {
                await axios.post(`${apiUrl}/api/shifts/`, formData, config);
            }
            onSaved();
            onClose();
        } catch (err) {
            console.error('Failed to save shift', err);
        }
    };

    const handleDelete = async () => {
        if (!isEditing || !shiftId) return;

        try {
            await axios.delete(`${apiUrl}/api/shifts/${shiftId}/`, {
                headers: {
                    Authorization: `Token ${user?.token}`,
                },
            });
            onSaved();
            onClose();
        } catch (err) {
            console.error('Failed to delete shift', err);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
                <button
                    className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
                    onClick={onClose}
                >
                    ✕
                </button>
                <h2 className="text-xl font-semibold mb-4">
                    {isEditing ? 'Edit Shift' : 'Create Shift'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="text"
                        name="user"
                        placeholder="User ID"
                        value={formData.user}
                        onChange={handleChange}
                        className="w-full border rounded px-3 py-2"
                        required
                    />
                    <input
                        type="text"
                        name="role"
                        placeholder="Role ID"
                        value={formData.role}
                        onChange={handleChange}
                        className="w-full border rounded px-3 py-2"
                        required
                    />
                    <input
                        type="text"
                        name="team"
                        placeholder="Team ID"
                        value={formData.team}
                        onChange={handleChange}
                        className="w-full border rounded px-3 py-2"
                        required
                    />
                    <input
                        type="datetime-local"
                        name="start_time"
                        value={formData.start_time}
                        onChange={handleChange}
                        className="w-full border rounded px-3 py-2"
                        required
                    />
                    <input
                        type="datetime-local"
                        name="end_time"
                        value={formData.end_time}
                        onChange={handleChange}
                        className="w-full border rounded px-3 py-2"
                        required
                    />
                    <div className="flex justify-between mt-4">
                        <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                        >
                            {isEditing ? 'Update' : 'Create'}
                        </button>
                        {isEditing && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                            >
                                Delete
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};
