import {useContext, useEffect, useState} from 'react';
import axios from 'axios';
import {AuthContext} from '../contexts/AuthContext';
import {UserModel} from '../models/UserModel';
import {Location} from '../models/Location';
import CreateLocationModal from '../components/CreateLocationModal';
import CreateUserModal from '../components/CreateUserModal';
import LocationTable from './LocationTable';
import UserTableSection from './UserTable';

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
    const [showLocationModal, setShowLocationModal] = useState(false);


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

            <UserTableSection
                users={users}
                selectedOrgId={selectedOrgId}
                onCreateUser={() => setShowModal(true)}
            />

            <CreateUserModal
                show={showModal}
                onClose={() => setShowModal(false)}
                form={form}
                selectedOrgId={selectedOrgId}
                orgs={orgs}
                roles={roles}
                onSubmit={handleSubmit}
                onChange={handleChange}
            />

            <LocationTable
                locations={locations}
                selectedOrgId={selectedOrgId}
                onCreateLocation={() => setShowLocationModal(true)}
            />

            {/*Location modal */}
            {showLocationModal && (
                <CreateLocationModal
                    organizationId={selectedOrgId}
                    token={user?.token || ''}
                    onClose={() => setShowLocationModal(false)}
                    onSuccess={() => fetchLocations()}
                    organizationName={orgs.find(org => org.organization_id.toString() === selectedOrgId)?.organization_name}
                />
            )}


        </div>
    );
}
