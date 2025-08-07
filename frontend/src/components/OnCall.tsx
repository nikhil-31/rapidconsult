import axios, {AxiosResponse} from 'axios';
import React, {useContext, useEffect, useState} from 'react';
import {AuthContext} from '../contexts/AuthContext';
import {Layout, Menu, Typography, Select, } from 'antd';
import {Department} from "../models/Department";
import {Unit} from "../models/Unit";
import {Location} from "../models/Location";

const {Sider, Content} = Layout;
const {Title, Text} = Typography;
const {Option} = Select;

const OnCall: React.FC = () => {
    const {user} = useContext(AuthContext);
    const orgs = user?.organizations || [];
    const apiUrl = process.env.REACT_APP_API_URL as string;

    const [locations, setLocations] = useState<Location[]>([]);
    const [departments, setDepartments] = useState<Record<number, Department[]>>({});
    const [units, setUnits] = useState<Record<number, Unit[]>>({});
    const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
    const [selectedOrgId, setSelectedOrgId] = useState<string>('');
    const [shiftModalOpen, setShiftModalOpen] = useState<boolean>(false);

    const fetchLocations = async (): Promise<void> => {
        try {
            const res: AxiosResponse<Location[]> = await axios.get(`${apiUrl}/api/locations`, {
                params: {organization_id: selectedOrgId},
                headers: {Authorization: `Token ${user?.token}`},
            });
            setLocations(res.data);
        } catch (err) {
            console.error('Failed to fetch locations:', err);
        }
    };

    const fetchDepartments = async (locationId: number): Promise<void> => {
        try {
            const res: AxiosResponse<Department[]> = await axios.get(`${apiUrl}/api/departments`, {
                params: {location_id: locationId},
                headers: {Authorization: `Token ${user?.token}`},
            });
            setDepartments(prev => ({...prev, [locationId]: res.data}));

            res.data.forEach(dep => fetchUnits(dep.id));
        } catch (err) {
            console.error('Failed to fetch departments:', err);
        }
    };

    const fetchUnits = async (departmentId: number): Promise<void> => {
        try {
            const res: AxiosResponse<Unit[]> = await axios.get(`${apiUrl}/api/units`, {
                params: {department_id: departmentId},
                headers: {Authorization: `Token ${user?.token}`},
            });
            setUnits(prev => ({...prev, [departmentId]: res.data}));
        } catch (err) {
            console.error('Failed to fetch units:', err);
        }
    };

    const handleUnitClick = async (unitId: number): Promise<void> => {

    };

    useEffect(() => {
        if (locations.length > 0 && selectedLocationId === null) {
            setSelectedLocationId(locations[0].id);
        }
    }, [locations, selectedLocationId]);

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

    useEffect(() => {
        if (selectedOrgId) {
            fetchLocations();
        }
    }, [selectedOrgId]);

    useEffect(() => {
        if (selectedLocationId !== null) {
            fetchDepartments(selectedLocationId);
        }
    }, [selectedLocationId]);

    return (
        <Layout style={{minHeight: '100vh', background: '#f9f9f9'}}>
            <Sider width={350} style={{backgroundColor: '#ffffff', borderRight: '1px solid #f0f0f0'}}>
                <div style={{padding: 16}}>
                    <Title level={5} style={{marginBottom: 16}}>Select Location</Title>
                    <Select
                        placeholder="Choose a location"
                        style={{width: '100%'}}
                        value={selectedLocationId || undefined}
                        onChange={(val: number) => setSelectedLocationId(val)}
                        loading={locations.length === 0}
                    >
                        {locations.map(loc => (
                            <Option key={loc.id} value={loc.id}><Text>{loc.name}</Text></Option>
                        ))}
                    </Select>
                </div>
                <div style={{paddingLeft: 16, paddingRight: 16}}>
                    <Title level={5} style={{marginBottom: 10}}>Departments</Title>
                </div>
                <Menu
                    mode="inline"
                    style={{borderInlineEnd: 'none'}}>
                    {selectedLocationId && departments[selectedLocationId]?.map(department => (
                        <Menu.SubMenu
                            key={`dep-${department.id}`}
                            title={<span style={{fontWeight: 500}}>{department.name}</span>}
                        >
                            {units[department.id]?.map(unit => (
                                <Menu.Item key={`unit-${unit.id}`} onClick={() => handleUnitClick(unit.id)}>
                                    {unit.name}
                                </Menu.Item>
                            )) || <Menu.Item disabled>Loading units...</Menu.Item>}
                        </Menu.SubMenu>
                    ))}
                </Menu>
            </Sider>

            <Layout>
                <Content style={{padding: '32px 48px', background: '#fff'}}>
                    <div>
                        <h1>Group chat</h1>
                    </div>
                </Content>
            </Layout>

        </Layout>
    );
};

export default OnCall;
