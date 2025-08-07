import {useContext, useEffect, useState} from 'react';
import axios from 'axios';
import {AuthContext} from '../contexts/AuthContext';
import UserModal from './UserModal';
import UserTableSection from './UserTable';
import {UserModel} from '../models/UserModel';
import LocationModal from './LocationModal';
import LocationTable from './LocationTable';
import {Location} from '../models/Location';
import DepartmentTable from './DepartmentTable';
import DepartmentModal from './DepartmentModal';
import {Department} from '../models/Department';
import UnitTable from './UnitTable';
import UnitModal from './UnitModal';
import {Unit} from '../models/Unit';

import {Select, Typography, Divider, Layout, message, Row, Col} from 'antd';

const {Option} = Select;
const {Title, Text} = Typography;
const {Content} = Layout;

export default function Admin() {
    const {user} = useContext(AuthContext);
    const orgs = user?.organizations || [];
    const apiUrl = process.env.REACT_APP_API_URL;

    const [users, setUsers] = useState<UserModel[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [selectedOrgId, setSelectedOrgId] = useState<string>('');

    const [showUserModal, setShowUserModal] = useState(false);
    const [editingUser, setEditingUser] = useState<UserModel | null>(null);

    const [showLocationModal, setShowLocationModal] = useState(false);
    const [editingLocation, setEditingLocation] = useState<Location | null>(null);

    const [showDepartmentModal, setShowDepartmentModal] = useState(false);
    const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);

    const [showUnitModal, setShowUnitModal] = useState(false);
    const [editingUnit, setEditingUnit] = useState<Unit | null>(null);

    const fetchUsers = async () => {
        try {
            const res = await axios.get<UserModel[]>(`${apiUrl}/api/users/all`, {
                headers: {Authorization: `Token ${user?.token}`},
                params: {organization: selectedOrgId},
            });
            setUsers(res.data);
        } catch (error) {
            console.error('Error fetching users', error);
        }
    };

    const fetchLocations = async () => {
        try {
            const res = await axios.get(`${apiUrl}/api/locations/`, {
                headers: {Authorization: `Token ${user?.token}`},
                params: {organization_id: selectedOrgId},
            });
            setLocations(res.data);
        } catch (error) {
            console.error('Error fetching locations', error);
        }
    };

    const fetchDepartments = async () => {
        try {
            const res = await axios.get(`${apiUrl}/api/departments/org`, {
                headers: {Authorization: `Token ${user?.token}`},
                params: {organization_id: selectedOrgId},
            });
            setDepartments(res.data);
        } catch (error) {
            console.error('Error fetching departments', error);
        }
    };

    useEffect(() => {
        if (orgs.length > 0) {

            // const storedOrg = localStorage.getItem('org_select');
            // const matchedOrg = storedOrg
            //     ? orgs.find(org => org.organization_id === JSON.parse(storedOrg).organization_id)
            //     : null;
            //
            // const defaultOrgId = matchedOrg
            //     ? matchedOrg.organization_id.toString()
            //     : orgs[0].organization_id.toString();
            //
            // setSelectedOrgId(defaultOrgId);
        }
    }, [orgs]);

    useEffect(() => {
        if (selectedOrgId) {
            fetchUsers();
            fetchLocations();
            fetchDepartments();
        }
    }, [selectedOrgId]);

    return (
        <Content style={{padding: '2rem', maxWidth: '1000px', margin: '0 auto'}}>
            <Title level={2} style={{marginBottom: 32}}>Admin Page</Title>

            <Row align="middle" gutter={16} style={{marginBottom: 24}}>
                <Col>
                    <Text strong style={{fontSize: 16}}>Select Organization:</Text>
                </Col>
                <Col flex="auto">
                    <Select
                        style={{
                            minWidth: 320,
                            height: 44,
                            fontSize: 16,
                        }}
                        value={selectedOrgId}
                        size="large"
                        onChange={(val) => setSelectedOrgId(val)}
                    >
                        {/*{orgs.map(org => (*/}
                        {/*    <Option key={org.organization_id} value={String(org.organization_id)}>*/}
                        {/*        {org.organization_name}*/}
                        {/*    </Option>*/}
                        {/*))}*/}
                    </Select>
                </Col>
            </Row>

            <Divider/>

            {/* User Section */}
            <UserTableSection
                users={users}
                selectedOrgId={selectedOrgId}
                onCreateUser={() => setShowUserModal(true)}
                onEditUser={(user) => {
                    setEditingUser(user);
                    setShowUserModal(true);
                }}
                onDeleteUser={() => {
                    message.warning('Deleting users is not supported.');
                }}
            />
            {showUserModal && (
                <UserModal
                    selectedOrgId={selectedOrgId}
                    orgs={orgs}
                    onClose={() => {
                        setEditingUser(null);
                        setShowUserModal(false);
                    }}
                    onSuccess={() => fetchUsers()}
                    editingUser={editingUser}
                />
            )}

            <Divider/>

            {/* Location Section */}
            <LocationTable
                locations={locations}
                selectedOrgId={selectedOrgId}
                onCreateLocation={() => setShowLocationModal(true)}
                onEditLocation={(location) => {
                    setEditingLocation(location);
                    setShowLocationModal(true);
                }}
                onDeleteLocation={() => {
                    message.warning('Deleting locations is not supported.');
                }}
            />
            {showLocationModal && (
                <LocationModal
                    orgs={orgs}
                    selectedOrgId={selectedOrgId}
                    onClose={() => {
                        setEditingLocation(null);
                        setShowLocationModal(false);
                    }}
                    onSuccess={() => fetchLocations()}
                    editingLocation={editingLocation}
                />
            )}

            <Divider/>

            {/* Department Section */}
            <DepartmentTable
                selectedOrgId={selectedOrgId}
                onEdit={(dept) => {
                    setEditingDepartment(dept);
                    setShowDepartmentModal(true);
                }}
                onReload={() => fetchDepartments()}
                onCreate={() => setShowDepartmentModal(true)}
            />
            {showDepartmentModal && (
                <DepartmentModal
                    selectedOrgId={selectedOrgId}
                    locations={locations}
                    onClose={() => {
                        setEditingDepartment(null);
                        setShowDepartmentModal(false);
                    }}
                    onSuccess={() => {
                        setEditingDepartment(null);
                        setShowDepartmentModal(false);
                        fetchDepartments();
                    }}
                    editingDepartment={editingDepartment}
                />
            )}

            <Divider/>

            {/* Unit Section */}
            <UnitTable
                selectedOrgId={selectedOrgId}
                onCreate={() => setShowUnitModal(true)}
                onEdit={(unit) => {
                    setEditingUnit(unit);
                    setShowUnitModal(true);
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
                        setEditingUnit(null);
                        setShowUnitModal(false);
                    }}
                    onSuccess={() => {
                        setEditingUnit(null);
                        setShowUnitModal(false);
                    }}
                    unitToEdit={editingUnit}
                />
            )}
        </Content>
    );
}
