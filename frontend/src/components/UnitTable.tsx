import React, {useEffect, useState, useContext} from 'react';
import axios from 'axios';
import {AuthContext} from '../contexts/AuthContext';
import {Unit} from '../models/Unit'; // Ensure Unit is typed with nested structure.

interface UnitTableProps {
    selectedOrgId: string;
}

export default function UnitTable({selectedOrgId}: UnitTableProps) {
    const {user} = useContext(AuthContext);
    const [units, setUnits] = useState<Unit[]>([]);
    const [loading, setLoading] = useState(true);
    const apiUrl = process.env.REACT_APP_API_URL;

    useEffect(() => {
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

        fetchUnits();
    }, [selectedOrgId]);

    if (!selectedOrgId) {
        return <p className="text-gray-500">Please select an organization.</p>;
    }

    if (loading) {
        return <p className="text-gray-500">Loading units...</p>;
    }

    return (
        <div className="mt-6">
            <h2 className="text-xl font-semibold mb-4">Units</h2>
            <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                    <tr>
                        <th className="px-4 py-2 text-left">Name</th>
                        <th className="px-4 py-2 text-left">Department</th>
                        <th className="px-4 py-2 text-left">Location</th>
                        <th className="px-4 py-2 text-left">Members</th>
                        <th className="px-4 py-2 text-left">Picture</th>
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
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
