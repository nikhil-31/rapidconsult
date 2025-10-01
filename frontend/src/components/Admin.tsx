import {useContext, useEffect, useState} from 'react';
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

    const [selectedOrgId, setSelectedOrgId] = useState<string>('');

    const [showUserModal, setShowUserModal] = useState(false);
    const [editingUser, setEditingUser] = useState<UserModel | null>(null);
    const [refreshUserKey, setRefreshUserKey] = useState(0);

    const [showLocationModal, setShowLocationModal] = useState(false);
    const [editingLocation, setEditingLocation] = useState<Location | null>(null);
    const [refreshLocationKey, setRefreshLocationKey] = useState(0);

    const [showDepartmentModal, setShowDepartmentModal] = useState(false);
    const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
    const [refreshDepartmentKey, setRefreshDepartmentKey] = useState(0);

    const [showUnitModal, setShowUnitModal] = useState(false);
    const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
    const [refreshUnitKey, setRefreshUnitKey] = useState(0);

    useEffect(() => {
        if (orgs.length > 0) {
            setSelectedOrgId(orgs[0].organization.id.toString())
        }
    }, [orgs]);

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
                        {orgs.map(org => (
                            <Option key={org.organization.id} value={String(org.organization.id)}>
                                {org.organization.name}
                            </Option>
                        ))}
                    </Select>
                </Col>
            </Row>

            <Divider/>

            {/* User Section */}
            <UserTableSection
                selectedOrgId={selectedOrgId}
                onCreateUser={() => setShowUserModal(true)}
                onEditUser={(user) => {
                    setEditingUser(user);
                    setShowUserModal(true);
                }}
                onDeleteUser={() => {
                    message.warning('Deleting users is not supported.');
                }}
                refresh={refreshUserKey}
            />
            {showUserModal && (
                <UserModal
                    selectedOrgId={selectedOrgId}
                    orgs={orgs}
                    onClose={() => {
                        setEditingUser(null);
                        setShowUserModal(false);
                    }}
                    onSuccess={() => {
                        setRefreshUserKey(prev => prev + 1)
                    }}
                    editingUser={editingUser}
                />
            )}

            <Divider/>

            {/* Location Section */}
            <LocationTable
                selectedOrgId={selectedOrgId}
                onCreateLocation={() => setShowLocationModal(true)}
                onEditLocation={(location) => {
                    setEditingLocation(location);
                    setShowLocationModal(true);
                }}
                onDeleteLocation={() => {
                    message.warning('Deleting locations is not supported.');
                }}
                refreshKey={refreshLocationKey}
            />
            {showLocationModal && (
                <LocationModal
                    orgs={orgs}
                    selectedOrgId={selectedOrgId}
                    onClose={() => {
                        setEditingLocation(null);
                        setShowLocationModal(false);
                    }}
                    onSuccess={() => {
                        setRefreshLocationKey(prev => prev + 1);
                    }}
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
                onCreate={() => setShowDepartmentModal(true)}
                refresh={refreshDepartmentKey}
            />
            {showDepartmentModal && (
                <DepartmentModal
                    selectedOrgId={selectedOrgId}
                    onClose={() => {
                        setEditingDepartment(null);
                        setShowDepartmentModal(false);
                    }}
                    onSuccess={() => {
                        setEditingDepartment(null);
                        setShowDepartmentModal(false);
                        setRefreshDepartmentKey(prev => prev + 1)
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
                refresh={refreshUnitKey}
            />
            {showUnitModal && (
                <UnitModal
                    selectedOrgId={selectedOrgId}
                    onClose={() => {
                        setEditingUnit(null);
                        setShowUnitModal(false);
                    }}
                    onSuccess={() => {
                        setEditingUnit(null);
                        setShowUnitModal(false);
                        setRefreshUnitKey(prev => prev + 1)
                    }}
                    unitToEdit={editingUnit}
                />
            )}
        </Content>
    );
}
