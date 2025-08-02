import {useContext, useEffect, useState} from 'react';
import axios from 'axios';
import {AuthContext} from '../contexts/AuthContext';
import CreateUserModal from '../components/CreateUserModal';
import UserTableSection from './UserTable';
import {UserModel} from '../models/UserModel';
import CreateLocationModal from '../components/CreateLocationModal';
import LocationTable from './LocationTable';
import {Location} from '../models/Location';
import DepartmentTable from "./DepartmentTable";
import DepartmentModal from "./DepartmentModal";
import {Department} from "../models/Department"
import UnitTable from "./UnitTable";
import UnitModal from "./UnitModal";
import {Unit} from "../models/Unit";


export default function Admin() {
    const {user} = useContext(AuthContext);
    const orgs = user?.organizations || [];
    const apiUrl = process.env.REACT_APP_API_URL;
    const [users, setUsers] = useState<UserModel[]>([]);
    const [selectedOrgId, setSelectedOrgId] = useState<string>('');
    const [locations, setLocations] = useState<Location[]>([]);
    const [showUserModal, setShowUserModal] = useState(false);
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [showDepartmentModal, setShowDepartmentModal] = useState(false);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [showUnitModal, setShowUnitModal] = useState(false);
    const [editingUser, setEditingUser] = useState<UserModel | null>(null);
    const [editingLocation, setEditingLocation] = useState<Location | null>(null);
    const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
    const [editingUnit, setEditingUnit] = useState<Unit | null>(null);


    const fetchUsers = async () => {
        try {
            const res =
                await axios.get<UserModel[]>(`${apiUrl}/api/users/all`, {
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

    const deleteUser = async (user: UserModel) => {
        // Not supported
    }

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

    const deleteLocation = async (user: Location) => {
        // Not supported
    }

    const fetchDepartments = async () => {
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
            fetchDepartments();
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
                onEditUser={(user) => {
                    setEditingUser(user);
                    setShowUserModal(true);
                }}
                onDeleteUser={(user) => {
                    deleteUser(user)
                }}
            />

            {showUserModal && (
                <CreateUserModal
                    selectedOrgId={selectedOrgId}
                    orgs={orgs}
                    onSuccess={() => fetchUsers()}
                    onClose={() => {
                        setEditingUser(null)
                        setShowUserModal(false)
                    }}
                    editingUser={editingUser}
                />
            )}

            {/* Location Section */}
            <LocationTable
                locations={locations}
                selectedOrgId={selectedOrgId}
                onCreateLocation={() => setShowLocationModal(true)}
                onEditLocation={(location) => {
                    setEditingLocation(location)
                    setShowLocationModal(true)
                }}
                onDeleteLocation={(location) => {
                    deleteLocation(location)
                }}
            />

            {showLocationModal && (
                <CreateLocationModal
                    orgs={orgs}
                    selectedOrgId={selectedOrgId}
                    onSuccess={() => fetchLocations()}
                    onClose={() => setShowLocationModal(false)}
                    editingLocation={editingLocation}
                />
            )}

            {/* Department Section */}
            <DepartmentTable
                selectedOrgId={selectedOrgId}
                onEdit={(dept) => {
                    setEditingDepartment(dept);
                    setShowDepartmentModal(true);
                }}
                onReload={() => {

                }}
                onCreate={() => {
                    setShowDepartmentModal(true)
                }}
            />

            {showDepartmentModal && (
                <DepartmentModal
                    selectedOrgId={selectedOrgId}
                    locations={locations}
                    onClose={() => {
                        setShowDepartmentModal(false)
                        setEditingDepartment(null)
                    }}
                    onSuccess={() => {
                        setShowDepartmentModal(false)
                        setEditingDepartment(null)
                    }}
                    editingDepartment={editingDepartment}
                />
            )}

            {/*  Unit and UnitMembership  */}
            <UnitTable
                selectedOrgId={selectedOrgId}
                onCreate={() => {
                    setShowUnitModal(true)
                }}
                onEdit={(unit) => {
                    setEditingUnit(unit)
                    setShowUnitModal(true)
                }}
                onReload={() => {

                }}
            />

            {showUnitModal && (
                <UnitModal
                    selectedOrgId={selectedOrgId}
                    departments={departments}
                    users={users}
                    onClose={() => {
                        setShowUnitModal(false)
                        setEditingUnit(null)
                    }}
                    onSuccess={() => {
                        setShowUnitModal(false)
                        setEditingUnit(null)
                    }}
                    unitToEdit={editingUnit}
                />
            )}

        </div>
    );
}
