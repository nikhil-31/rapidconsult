import React, {useState, useEffect, ChangeEvent, FormEvent, useContext} from 'react';
import axios from 'axios';
import {AuthContext} from '../contexts/AuthContext';
import {Department} from '../models/Department';
import {Unit} from '../models/Unit';
import {UserModel} from '../models/UserModel';

interface UnitModalProps {
    selectedOrgId: string;
    departments: Department[];
    users: UserModel[];
    unitToEdit?: Unit | null;
    onClose: () => void;
    onSuccess: () => void;
}

export default function UnitModal({
                                      selectedOrgId,
                                      departments,
                                      users,
                                      unitToEdit,
                                      onClose,
                                      onSuccess,
                                  }: UnitModalProps) {
    const {user} = useContext(AuthContext);
    const apiUrl = process.env.REACT_APP_API_URL;

    const [form, setForm] = useState({name: '', department: ''});
    const [displayPicture, setDisplayPicture] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [selectedOrgUserId, setSelectedOrgUserId] = useState<string>('');
    const [members, setMembers] = useState<{ id: number; user: number; is_admin: boolean }[]>([]);

    useEffect(() => {
        if (unitToEdit) {
            setForm({
                name: unitToEdit.name || '',
                department: String(unitToEdit.department?.id || ''),
            });
            setMembers(
                unitToEdit.members?.map((member) => ({
                    id: member.id,
                    user: member.user,
                    is_admin: member.is_admin,
                })) || []
            );
        }
    }, [unitToEdit]);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const {name, value} = e.target;
        setForm((prev) => ({...prev, [name]: value}));
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.length) {
            setDisplayPicture(e.target.files[0]);
        }
    };

    const handleAddMember = async () => {
        const orgUserId = parseInt(selectedOrgUserId);
        if (!orgUserId || members.find((m) => m.user === orgUserId)) return;

        try {
            const response = await axios.post(
                `${apiUrl}/api/unit-memberships/`,
                {
                    unit: unitToEdit?.id,
                    user: orgUserId,
                    is_admin: false,
                },
                {
                    headers: {
                        Authorization: `Token ${user?.token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            setMembers((prev) => [...prev, response.data]);
            setSelectedOrgUserId('');
        } catch (error) {
            console.error('Failed to add member:', error);
            alert('Failed to add member');
        }
    };

    const handleRemoveMember = async (orgUserId: number, id: number) => {
        try {
            await axios.delete(`${apiUrl}/api/unit-memberships/${id}`, {
                headers: {
                    Authorization: `Token ${user?.token}`,
                },
            });
            setMembers((prev) => prev.filter((m) => m.user !== orgUserId));
        } catch (error) {
            console.error('Failed to remove member:', error);
            alert('Failed to remove member');
        }
    };

    const toggleAdmin = async (orgUserId: number, id: number, is_admin: boolean) => {
        try {
            const response = await axios.patch(
                `${apiUrl}/api/unit-memberships/${id}/`,
                {is_admin: !is_admin},
                {
                    headers: {
                        Authorization: `Token ${user?.token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            setMembers((prev) =>
                prev.map((m) => (m.user === orgUserId ? response.data : m))
            );
        } catch (error) {
            console.error('Failed to toggle admin:', error);
            alert('Failed to update admin status');
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
        // formData.append('members', JSON.stringify(members));

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

        request
            .then(() => {
                onSuccess();
                onClose();
            })
            .catch((error) => {
                console.error('Failed to submit unit:', error);
                alert('Failed to submit unit');
            })
            .finally(() => setLoading(false));
    };

    const getEligibleUsersForOrg = () =>
        users.flatMap((user) => {
            const orgProfile = user.organizations.find(
                (org) => String(org.organization_id) === selectedOrgId
            );
            return orgProfile
                ? [{...user, org_user_id: orgProfile.org_user_id, job_title: orgProfile.job_title}]
                : [];
        });

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

                        <div>
                            <label className="block mb-1 font-medium">Add Member</label>
                            <div className="flex gap-2">
                                <select
                                    value={selectedOrgUserId}
                                    onChange={(e) => setSelectedOrgUserId(e.target.value)}
                                    className="border p-2 w-full rounded"
                                >
                                    <option value="">Select Member</option>
                                    {getEligibleUsersForOrg().map((u) => (
                                        <option key={u.org_user_id} value={u.org_user_id}>
                                            {u.name} ({u.job_title})
                                        </option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={handleAddMember}
                                    className="bg-green-600 text-white px-4 rounded"
                                >
                                    Add
                                </button>
                            </div>

                            {members.length > 0 && (
                                <ul className="mt-2 space-y-2">
                                    {members.map((m) => {
                                        const userDetails = getEligibleUsersForOrg().find(u => u.org_user_id === m.user);
                                        return (
                                            <li key={m.user} className="flex justify-between items-center">
                                                <span>{userDetails?.name} - {userDetails?.job_title}</span>
                                                <div className="flex items-center gap-2">
                                                    <label className="flex items-center gap-1">
                                                        <input
                                                            type="checkbox"
                                                            checked={m.is_admin}
                                                            onChange={() => toggleAdmin(m.user, m.id, m.is_admin)}
                                                        />
                                                        Admin
                                                    </label>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveMember(m.user, m.id)}
                                                        className="text-red-500 hover:underline"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
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
