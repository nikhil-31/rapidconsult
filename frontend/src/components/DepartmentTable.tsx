import React, {useEffect, useState, useContext} from 'react';
import axios from 'axios';
import {AuthContext} from '../contexts/AuthContext';
import {Pencil, Trash, Plus} from 'lucide-react';
import {Department} from '../models/Department';

interface DepartmentTableProps {
    selectedOrgId: string;
    onEdit: (department: Department) => void;
    onReload: () => void;
    onCreate: () => void;
}

export default function DepartmentTable({
                                            selectedOrgId,
                                            onEdit,
                                            onReload,
                                            onCreate,
                                        }: DepartmentTableProps) {
    const {user} = useContext(AuthContext);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);

    const apiUrl = process.env.REACT_APP_API_URL;

    useEffect(() => {
        const fetchDepartments = async () => {
            if (!selectedOrgId) return;

            try {
                const response = await axios.get(
                    `${apiUrl}/api/departments/org?organization_id=${selectedOrgId}`,
                    {
                        headers: {
                            Authorization: `Token ${user?.token}`,
                        },
                    }
                );
                setDepartments(response.data);
            } catch (error) {
                console.error('Failed to fetch departments:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDepartments();
    }, [selectedOrgId, onReload]);

    const handleDelete = async (deptId: number) => {
        // if (!window.confirm('Are you sure you want to delete this department?')) return;
        //
        // try {
        //     await axios.delete(`${apiUrl}/api/departments/${deptId}/`, {
        //         headers: {
        //             Authorization: `Token ${user?.token}`,
        //         },
        //     });
        //     onReload();
        // } catch (error) {
        // console.error('Error deleting department:', error);
        alert('This is not supported!!!');
        // }
    };

    if (!selectedOrgId) {
        return <p className="text-gray-500">Please select an organization.</p>;
    }

    if (loading) {
        return <p className="text-gray-500">Loading departments...</p>;
    }

    return (
        <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Departments</h2>
                <button
                    onClick={onCreate}
                    className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                    <Plus size={18}/>
                    Create Department
                </button>
            </div>

            <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                    <tr>
                        <th className="px-4 py-2 text-left">Name</th>
                        <th className="px-4 py-2 text-left">Location</th>
                        <th className="px-4 py-2 text-left">Picture</th>
                        <th className="px-4 py-2 text-left">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {departments.map((dept) => (
                        <tr key={dept.id}>
                            <td className="px-4 py-2">{dept.name || '—'}</td>
                            <td className="px-4 py-2">{dept.location_details?.name || '—'}</td>
                            <td className="px-4 py-2">
                                {dept.display_picture ? (
                                    <img
                                        src={dept.display_picture}
                                        alt="Department"
                                        className="w-10 h-10 rounded-full object-cover"
                                    />
                                ) : (
                                    '—'
                                )}
                            </td>
                            <td className="px-4 py-2 flex gap-3">
                                <button
                                    onClick={() => onEdit(dept)}
                                    className="text-blue-600 hover:text-blue-800"
                                >
                                    <Pencil size={18}/>
                                </button>
                                <button
                                    onClick={() => handleDelete(dept.id)}
                                    className="text-red-600 hover:text-red-800"
                                >
                                    <Trash size={18}/>
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
