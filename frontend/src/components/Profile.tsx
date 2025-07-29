// pages/Profile.tsx
import React, {useContext, useEffect, useState} from 'react';
import axios from 'axios';
import {AuthContext} from "../contexts/AuthContext";
import ContactFormModal from "../components/ContactModal";
import {useNavigate} from 'react-router-dom';

const Profile = () => {
    const [profile, setProfile] = useState<any>(null);
    const [showForm, setShowForm] = useState(false);
    const [editingContact, setEditingContact] = useState<any | null>(null);
    const apiUrl = process.env.REACT_APP_API_URL;
    const {user} = useContext(AuthContext);
    const navigate = useNavigate();

    const fetchProfile = async () => {
        try {
            const res = await axios.get(
                `${apiUrl}/api/profile/me/`, {
                    headers: {Authorization: `Token ${user?.token}`}
                })
                .then(res => setProfile(res.data))
                .catch(err => console.error(err));
        } catch (err) {
            console.error('Failed to load profile', err);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleSubmitContact = async (contact: any) => {
        try {
            if (editingContact?.id) {
                await axios.put(`${apiUrl}/api/contacts/${editingContact.id}/`, contact, {
                    headers: {Authorization: `Token ${user?.token}`}
                });
            } else {
                await axios.post(`${apiUrl}/api/contacts/`, contact, {
                    headers: {Authorization: `Token ${user?.token}`}
                });
            }
            setShowForm(false);
            setEditingContact(null);
            fetchProfile();
        } catch (err) {
            console.error('Failed to save contact', err);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Delete this contact?')) return;
        try {
            await axios.delete(`${apiUrl}/api/contacts/${id}/`, {
                headers: {Authorization: `Token ${user?.token}`}
            });
            fetchProfile();
        } catch (err) {
            console.error('Delete failed', err);
        }
    };

    if (!profile) return <div>Loading...</div>;

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-6">
                    {profile.profile_picture && (
                        <img
                            src={profile.profile_picture}
                            alt="Profile"
                            className="w-24 h-24 rounded-full object-cover"
                        />
                    )}
                    <div>
                        <h1 className="text-2xl font-bold">{profile.name}</h1>
                        <p className="text-gray-600">{profile.email}</p>
                        {/*<h1 className="text-gray-600">username-{profile.username}</h1>*/}
                    </div>
                </div>

                <button
                    onClick={() => navigate('/profile/edit')}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                    Edit Profile
                </button>
            </div>

            {/* Contact Table */}
            <div className="mb-6">
                <div className="mb-4 flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Contact Info</h2>
                    {/*<button*/}
                    {/*    onClick={() => {*/}
                    {/*        setEditingContact(null);*/}
                    {/*        setShowForm(true);*/}
                    {/*    }}*/}
                    {/*    className="bg-red-600 text-white font-semibold hover:bg-red-700 px-3 py-1 rounded"*/}
                    {/*>*/}
                    {/*    + Add Contact*/}
                    {/*</button>*/}
                </div>
                <div className="overflow-x-auto mb-4">
                    <table className="min-w-full bg-white border border-gray-200 text-sm">
                        <thead>
                        <tr className="bg-gray-100 text-left">
                            <th className="py-2 px-4 border-b">Label</th>
                            <th className="py-2 px-4 border-b">Type</th>
                            {/*<th className="py-2 px-4 border-b">Country Code</th>*/}
                            <th className="py-2 px-4 border-b">Number/Contact</th>
                            <th className="py-2 px-4 border-b">Primary</th>
                            <th className="py-2 px-4 border-b">Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {profile.contacts.map((c: any) => (
                            <tr key={c.id} className="hover:bg-gray-50">
                                <td className="py-2 px-4 border-b">{c.label || '-'}</td>
                                <td className="py-2 px-4 border-b">{c.type}</td>
                                {/*<td className="py-2 px-4 border-b">{c.country_code}</td>*/}
                                <td className="py-2 px-4 border-b">{c.number}</td>
                                <td className="py-2 px-4 border-b">{c.primary ? 'Yes' : 'No'}</td>
                                <td className="py-2 px-4 border-b flex gap-2">
                                    <button
                                        onClick={() => {
                                            setEditingContact(c);
                                            setShowForm(true);
                                        }}
                                        className="text-blue-600"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(c.id)}
                                        className="text-red-600"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

            </div>

            {/* Contact Modal */}
            <ContactFormModal
                open={showForm}
                onClose={() => {
                    setShowForm(false);
                    setEditingContact(null);
                }}
                onSubmit={handleSubmitContact}
                initialData={editingContact}
            />

            {/* Organizations List */}
            <div>
                <h2 className="text-xl font-semibold mb-2">Organizations</h2>
                <ul className="space-y-4">
                    {profile.organizations.map((org: any) => (
                        <li key={org.id} className="border p-4 rounded-lg bg-gray-50">
                            <div className="text-lg font-semibold">{org.organisation.name}</div>
                            <div className="text-gray-700">
                                {org.job_title} ({org.role.name})
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                                {org.organisation.address.address_1}, {org.organisation.address.city},{' '}
                                {org.organisation.address.state} - {org.organisation.address.zip_code}
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default Profile;
