import React from 'react';
import {UserModel} from '../models/UserModel';

interface UserTableSectionProps {
    users: UserModel[];
    selectedOrgId: string;
    onCreateUser: () => void;
}

export default function UserTableSection({
                                             users,
                                             selectedOrgId,
                                             onCreateUser,
                                         }: UserTableSectionProps) {
    const handleCreateClick = () => {
        if (!selectedOrgId) {
            alert('Please select an organization first.');
            return;
        }
        onCreateUser();
    };

    return (
        <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <label className="mr-2 font-medium">Create User:</label>
                </div>
                <button
                    className="bg-red-600 text-white px-4 py-2 rounded"
                    onClick={handleCreateClick}
                >
                    Create User
                </button>
            </div>

            <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                    <tr>
                        <th className="px-4 py-2 text-left">Username</th>
                        <th className="px-4 py-2 text-left">Email</th>
                        <th className="px-4 py-2 text-left">Name</th>
                        <th className="px-4 py-2 text-left">Picture</th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                        <tr key={user.id}>
                            <td className="px-4 py-2">{user.username}</td>
                            <td className="px-4 py-2">{user.email}</td>
                            <td className="px-4 py-2">{user.name}</td>
                            <td className="px-4 py-2">
                                {user.profile_picture ? (
                                    <img
                                        src={user.profile_picture}
                                        alt="Profile"
                                        className="w-10 h-10 rounded-full"
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
