import axios from "axios";
import React, { useContext, useEffect, useState } from 'react';
import { Role } from "../models/Role";
import { OrganizationProfile } from "../models/OrganizationProfile";
import { AuthContext } from "../contexts/AuthContext";
import { UserModel } from "../models/UserModel";

interface CreateUserModalProps {
    selectedOrgId: string;
    orgs: OrganizationProfile[];
    onClose: () => void;
    onSuccess: () => void;
    editingUser?: UserModel | null;
}

export default function CreateUserModal({
    selectedOrgId,
    orgs,
    onClose,
    onSuccess,
    editingUser = null
}: CreateUserModalProps) {
    const { user } = useContext(AuthContext);
    const [roles, setRoles] = useState<Role[]>([]);
    const [profilePicture, setProfilePicture] = useState<File | null>(null);
    const [form, setForm] = useState({
        username: '',
        email: '',
        password: '',
        name: '',
        org_profile: {
            organisation: '',
            role: '',
            job_title: '',
        },
    });

    const apiUrl = process.env.REACT_APP_API_URL;
    const isEditMode = Boolean(editingUser);

    useEffect(() => {
        if (editingUser) {
            const userOrg: OrganizationProfile | undefined = editingUser?.organizations.find(
                (org) => org.organization_id.toString() === selectedOrgId
            );
            setForm({
                username: editingUser.username || '',
                email: editingUser.email || '',
                password: '',
                name: editingUser.name || '',
                org_profile: {
                    organisation: selectedOrgId,
                    role: userOrg?.role.id.toString() || '',
                    job_title: userOrg?.job_title || '',
                },
            });
        }
    }, [editingUser]);

    const fetchRoles = async () => {
        try {
            const res = await axios.get(`${apiUrl}/api/roles/`, {
                headers: { Authorization: `Token ${user?.token}` },
            });
            setRoles(res.data);
        } catch (error) {
            console.error('Error fetching roles', error);
        }
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;

        if (
            name === 'profile_picture' &&
            e.target instanceof HTMLInputElement &&
            e.target.files
        ) {
            setProfilePicture(e.target.files[0]);
        } else if (['role', 'job_title'].includes(name)) {
            setForm(prev => ({
                ...prev,
                org_profile: { ...prev.org_profile, [name]: value },
            }));
        } else {
            setForm(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('username', form.username);
        if (!isEditMode || form.password) {
            formData.append('password', form.password);
        }
        formData.append('email', form.email);
        formData.append('name', form.name);
        formData.append('org_profile.organisation', selectedOrgId.toString());
        formData.append('org_profile.role', form.org_profile.role);
        formData.append('org_profile.job_title', form.org_profile.job_title);
        if (profilePicture) {
            formData.append('profile_picture', profilePicture);
        }

        try {
            if (isEditMode) {
                await axios.patch(`${apiUrl}/api/users/${editingUser?.username}/`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Token ${user?.token}`,
                    },
                });
            } else {
                await axios.post(`${apiUrl}/api/users/register/`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Token ${user?.token}`,
                    },
                });
            }
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error saving user', error);
            alert('User save failed');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg max-h-screen overflow-y-auto relative">
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-gray-500 hover:text-black"
                >
                    ✖
                </button>
                <h3 className="text-xl font-semibold mb-4">
                    {isEditMode ? 'Edit User' : 'Create New User'}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <h2 className="font-semibold">User details</h2>

                    <input
                        name="username"
                        placeholder="Username"
                        value={form.username}
                        onChange={handleChange}
                        className={`border w-full p-2 rounded ${isEditMode ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                        required
                        disabled={isEditMode}
                    />
                    <input
                        name="password"
                        type="password"
                        placeholder={isEditMode ? 'Change Password (optional)' : 'Password'}
                        value={form.password}
                        onChange={handleChange}
                        className={`border w-full p-2 rounded ${isEditMode ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                        disabled={isEditMode}
                    />
                    <input
                        name="name"
                        placeholder="Full Name"
                        value={form.name}
                        onChange={handleChange}
                        className="border w-full p-2 rounded"
                    />
                    <input
                        name="email"
                        type="email"
                        placeholder="Email"
                        value={form.email}
                        onChange={handleChange}
                        className="border w-full p-2 rounded"
                        required
                    />
                    <input
                        name="profile_picture"
                        type="file"
                        onChange={handleChange}
                        className="border w-full p-2 rounded"
                    />
                    <h2 className="font-semibold">Org details</h2>
                    <select
                        name="organisation"
                        value={selectedOrgId}
                        className="border w-full p-2 rounded bg-gray-100"
                        disabled
                    >
                        {orgs.map((op) => (
                            <option key={op.organization_id} value={op.organization_id}>
                                {op.organization_name}
                            </option>
                        ))}
                    </select>
                    <select
                        name="role"
                        value={form.org_profile.role}
                        onChange={handleChange}
                        className="border w-full p-2 rounded"
                        required
                    >
                        <option value="">Select Role</option>
                        {roles.map((role) => (
                            <option key={role.id} value={role.id}>
                                {role.name}
                            </option>
                        ))}
                    </select>
                    <input
                        name="job_title"
                        placeholder="Job Title"
                        value={form.org_profile.job_title}
                        onChange={handleChange}
                        className="border w-full p-2 rounded"
                    />
                    <button
                        type="submit"
                        className="bg-blue-600 text-white px-4 py-2 rounded w-full"
                    >
                        {isEditMode ? 'Save Changes' : 'Create User'}
                    </button>
                </form>
            </div>
        </div>
    );
}
