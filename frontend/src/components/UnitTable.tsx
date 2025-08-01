import React, {useEffect, useState, useContext} from 'react';
import axios from 'axios';
import {AuthContext} from '../contexts/AuthContext';
import {Unit} from '../models/Unit';
import {Pencil, Trash2} from "lucide-react";

interface UnitTableProps {
    selectedOrgId: string;
    onCreate: () => void;
    onEdit: (unit: Unit) => void;
    onReload: () => void;
}

export default function UnitTable({
                                      selectedOrgId,
                                      onCreate,
                                      onEdit,
                                      onReload,
                                  }: UnitTableProps) {
    const {user} = useContext(AuthContext);
    const [units, setUnits] = useState<Unit[]>([]);
    const [loading, setLoading] = useState(true);
    const apiUrl = process.env.REACT_APP_API_URL;

    const fetchUnits = async () => {
        if (!selectedOrgId) return;
        try {
            const response = await axios.get(
                `${apiUrl}/api/units/?organization_id=${selectedOrgId}`,
                {
                    headers: {
                        Authorization: `Token ${user?.token}`,
                    },
                }
            );
            setUnits(response.data);
        } catch (error) {
            console.error('Failed to fetch units:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUnits();
    }, [selectedOrgId, onReload]);

    const handleDelete = async (unitId: number) => {
        // const confirmed = window.confirm('Are you sure you want to delete this unit?');
        // if (!confirmed) return;
        //
        // try {
        //     await axios.delete(`${apiUrl}/api/units/${unitId}/`, {
        //         headers: {
        //             Authorization: `Token ${user?.token}`,
        //         },
        //     });
        //     setUnits(prev => prev.filter(u => u.id !== unitId));
        // } catch (err) {
        //     console.error('Delete failed:', err);
        alert('Failed to delete unit.');
        // }
    };

    if (!selectedOrgId) {
        return <p className="text-gray-500">Please select an organization.</p>;
    }

    if (loading) {
        return <p className="text-gray-500">Loading units...</p>;
    }

    return (
        <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Units</h2>
                <button
                    onClick={onCreate}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded flex items-center gap-2"
                >
                    Create Unit
                </button>
            </div>

            <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                    <tr>
                        <th className="px-4 py-2 text-left">Name</th>
                        <th className="px-4 py-2 text-left">Department</th>
                        <th className="px-4 py-2 text-left">Location</th>
                        <th className="px-4 py-2 text-left">Members</th>
                        <th className="px-4 py-2 text-left">Picture</th>
                        <th className="px-4 py-2 text-left">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {units.map((unit) => (
                        <tr key={unit.id}>
                            <td className="px-4 py-2">{unit.name || '—'}</td>
                            <td className="px-4 py-2">{unit.department?.name || '—'}</td>
                            <td className="px-4 py-2">
                                {unit.department?.location_details?.name || '—'}
                            </td>
                            <td className="px-4 py-2">{unit.members?.length || 0}</td>
                            <td className="px-4 py-2">
                                {unit.display_picture ? (
                                    <img
                                        src={unit.display_picture}
                                        alt="Unit"
                                        className="w-10 h-10 rounded-full object-cover"
                                    />
                                ) : (
                                    '—'
                                )}
                            </td>
                            <td className="px-4 py-2 space-x-2">
                                <button
                                    onClick={() => onEdit(unit)}
                                    className="text-blue-600 hover:underline"
                                >
                                    <Pencil size={18}/>
                                </button>
                                <button
                                    onClick={() => handleDelete(unit.id)}
                                    className="text-red-600 hover:underline"
                                >
                                    <Trash2 size={18}/>
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
