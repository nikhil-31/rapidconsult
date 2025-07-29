import {useContext, useEffect, useState} from 'react';
import axios from 'axios';
import {AuthContext} from '../contexts/AuthContext';
import {UserModel} from '../models/UserModel';
import {Location} from '../models/Location';


export default function Admin() {
    const {user} = useContext(AuthContext);
    const orgs = user?.organizations || [];
    const [users, setUsers] = useState<UserModel[]>([]);
    const [selectedOrgId, setSelectedOrgId] = useState<string>('');
    const [showModal, setShowModal] = useState(false);
    const [roles, setRoles] = useState<{ id: number; name: string }[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
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
    const [profilePicture, setProfilePicture] = useState<File | null>(null);
    const apiUrl = process.env.REACT_APP_API_URL;

    const fetchUsers = async () => {
        try {
            const res = await axios.get<UserModel[]>(`${apiUrl}/api/users/all`, {
                headers: {Authorization: `Token ${user?.token}`},
                params: {
                    organization: selectedOrgId,
                },
            });
            setUsers(res.data);
        } catch (error) {
            console.error('Error fetching users', error);
        }
    };

    const fetchRoles = async () => {
        try {
            const res = await axios.get(`${apiUrl}/api/roles/`, {
                headers: {Authorization: `Token ${user?.token}`},
            });
            setRoles(res.data);
        } catch (error) {
            console.error('Error fetching roles', error);
        }
    };

    const fetchLocations = async () => {
        if (!selectedOrgId) return;
        try {
            const res = await axios.get(`${apiUrl}/api/locations/`, {
                headers: {Authorization: `Token ${user?.token}`},
                params: {
                    organization_id: selectedOrgId,
                },
            });
            setLocations(res.data);
        } catch (error) {
            console.error('Error fetching locations', error);
        }
    };

    // Set default selected organization
    useEffect(() => {
        if (orgs.length > 0) {
            const storedOrg = localStorage.getItem('org_select');
            const matchedOrg = storedOrg
                ? orgs.find(org => org.organization_id === JSON.parse(storedOrg).organization_id)
                : null;

            const defaultOrgId = matchedOrg
                ? matchedOrg.organization_id.toString()
                : orgs[0].organization_id.toString();

            setSelectedOrgId(defaultOrgId);
        }
    }, [orgs]);

    // Fetch users only after selectedOrgId is initialized
    useEffect(() => {
        if (selectedOrgId) {
            fetchLocations();
            fetchUsers();
        }
    }, [selectedOrgId]);

    // Fetch roles on mount
    useEffect(() => {
        fetchRoles();
    }, []);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const {name, value} = e.target;

        if (
            name === 'profile_picture' &&
            e.target instanceof HTMLInputElement &&
            e.target.files
        ) {
            setProfilePicture(e.target.files[0]);
        } else if (['role', 'job_title'].includes(name)) {
            setForm(prev => ({
                ...prev,
                org_profile: {...prev.org_profile, [name]: value},
            }));
        } else {
            setForm(prev => ({...prev, [name]: value}));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('username', form.username);
        formData.append('email', form.email);
        formData.append('password', form.password);
        formData.append('name', form.name);
        formData.append('org_profile.organisation', selectedOrgId.toString());
        formData.append('org_profile.role', form.org_profile.role);
        formData.append('org_profile.job_title', form.org_profile.job_title);
        if (profilePicture) {
            formData.append('profile_picture', profilePicture);
        }

        try {
            await axios.post(`${apiUrl}/api/users/register/`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Token ${user?.token}`,
                },
            });
            setShowModal(false);
            setForm({
                username: '',
                email: '',
                password: '',
                name: '',
                org_profile: {organisation: '', role: '', job_title: ''},
            });
            setProfilePicture(null);
            fetchUsers();
        } catch (error: any) {
            console.error('Error creating user', error);
            alert('User creation failed');
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-10">Admin Page</h1>

            <div className="mb-4">
                <label className="mr-2 font-medium">Select Organization:</label>
                <select
                    value={selectedOrgId}
                    onChange={(e) => setSelectedOrgId(e.target.value)}
                    className="border p-4 rounded min-w-60"
                    required
                >
                    {orgs.map((org) => (
                        <option key={org.organization_id} value={org.organization_id}>
                            {org.organization_name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="flex justify-between items-center mb-4">
                <div>
                    <label className="mr-2 font-medium">Create User:</label>
                </div>
                <button
                    className="bg-red-600 text-white px-4 py-2 rounded"
                    onClick={() => {
                        if (!selectedOrgId) {
                            alert('Please select an organization first.');
                            return;
                        }
                        setShowModal(true);
                    }}
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
                                        src={`${user.profile_picture}`}
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

            {locations.length > 0 && (
                <div className="mt-6">
                    <h2 className="text-lg font-semibold mb-3">Locations: </h2>
                    <div className="overflow-x-auto border rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-100">
                            <tr>
                                <th className="px-4 py-2 text-left">Name</th>
                                <th className="px-4 py-2 text-left">Address</th>
                                <th className="px-4 py-2 text-left">Picture</th>
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                            {locations.map((loc) => (
                                <tr key={loc.id}>
                                    <td className="px-4 py-2">{loc.name}</td>
                                    <td className="px-4 py-2">
                                        {loc.address ? (
                                            <>
                                                {loc.address.label && `${loc.address.label}, `}
                                                {loc.address.address_1 && `${loc.address.address_1}, `}
                                                {loc.address.address_2 && `${loc.address.address_2}, `}
                                                {loc.address.city && `${loc.address.city}, `}
                                                {loc.address.state && `${loc.address.state}`}
                                                {loc.address.zip_code && ` - ${loc.address.zip_code}`}
                                            </>
                                        ) : (
                                            '—'
                                        )}
                                    </td>
                                    <td className="px-4 py-2">
                                        {loc.display_picture ? (
                                            <img
                                                src={loc.display_picture}
                                                alt="Location"
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
            )}


            {
                showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg relative">
                            <button
                                onClick={() => setShowModal(false)}
                                className="absolute top-2 right-2 text-gray-500 hover:text-black"
                            >
                                ✖
                            </button>
                            <h3 className="text-xl font-semibold mb-4">Create New User</h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <h2 className="font-semibold">User details</h2>
                                <input
                                    name="username"
                                    placeholder="Username"
                                    value={form.username}
                                    onChange={handleChange}
                                    className="border w-full p-2 rounded"
                                    required
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
                                    name="password"
                                    type="password"
                                    placeholder="Password"
                                    value={form.password}
                                    onChange={handleChange}
                                    className="border w-full p-2 rounded"
                                    required
                                />
                                <input
                                    name="name"
                                    placeholder="Full Name"
                                    value={form.name}
                                    onChange={handleChange}
                                    className="border w-full p-2 rounded"
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
                                    onChange={() => {
                                    }}
                                    className="border w-full p-2 rounded bg-gray-100"
                                    disabled
                                >
                                    <option value="">Select Organization</option>
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
                                    Submit
                                </button>
                            </form>
                        </div>
                    </div>
                )
            }
        </div>
    )
        ;
}
