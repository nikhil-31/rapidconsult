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
    const [locations, setLocations] = useState<Location[]>([]);
    const apiUrl = process.env.REACT_APP_API_URL;
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [showUserModal, setShowUserModal] = useState(false);

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

            {/* User Section */}
            <UserTableSection
                users={users}
                selectedOrgId={selectedOrgId}
                onCreateUser={() => setShowUserModal(true)}
            />

            {showUserModal && (
                <CreateUserModal
                    selectedOrgId={selectedOrgId}
                    orgs={orgs}
                    onSuccess={() => fetchUsers()}
                    onClose={() => setShowUserModal(false)}
                />
            )}

            {/* Location Section */}
            <LocationTable
                locations={locations}
                selectedOrgId={selectedOrgId}
                onCreateLocation={() => setShowLocationModal(true)}
            />

            {showLocationModal && (
                <CreateLocationModal
                    orgs={orgs}
                    selectedOrgId={selectedOrgId}
                    onSuccess={() => fetchLocations()}
                    onClose={() => setShowLocationModal(false)}
                />
            )}
        </div>
    );
}
