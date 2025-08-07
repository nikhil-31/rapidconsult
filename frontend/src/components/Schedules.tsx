import axios, {AxiosResponse} from 'axios';
import React, {useContext, useEffect, useState} from 'react';
import {Calendar, dateFnsLocalizer, View, Views,} from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import {AuthContext} from '../contexts/AuthContext';
import {Layout, Menu, Button, Typography, Select, Space,} from 'antd';
import {PlusOutlined} from '@ant-design/icons';
import CreateShiftModal from './ShiftModal';
import {Locale} from 'date-fns';
import {useOrgLocation} from "../contexts/LocationContext";


const locales: Record<string, Locale> = {
    'en-US': require('date-fns/locale/en-US'),
};
const {Sider, Content} = Layout;
const {Title, Text} = Typography;
const {Option} = Select;

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

type Shift = {
    id: number;
    start_time: string;
    end_time: string;
    user_details: {
        id: number;
        job_title: string;
        role: { id: number; name: string };
        organisation: { id: number; name: string };
    };
    unit_details: {
        id: number;
        name: string;
    };
};

type EventData = {
    id: number;
    title: string;
    start: Date;
    end: Date;
    user: number;
    role: number;
};

type Location = { id: number; name: string };
type Department = { id: number; name: string };
type Unit = { id: number; name: string };

const CalendarView: React.FC = () => {
    const {user} = useContext(AuthContext);
    const orgs = user?.organizations || [];
    const apiUrl = process.env.REACT_APP_API_URL as string;

    const [events, setEvents] = useState<EventData[]>([]);
    const [view, setView] = useState<View>(Views.MONTH);
    const [date, setDate] = useState<Date>(new Date());

    const {selectedLocation, setSelectedLocation} = useOrgLocation();
    const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);

    const [departments, setDepartments] = useState<Record<number, Department[]>>({});
    const [units, setUnits] = useState<Record<number, Unit[]>>({});
    const [shiftModalOpen, setShiftModalOpen] = useState<boolean>(false);


    useEffect(() => {
        setSelectedLocationId(selectedLocation?.location?.id ?? null);
    }, [selectedLocation]);

    // const fetchLocations = async (): Promise<void> => {
    //     try {
    //         const res: AxiosResponse<Location[]> = await axios.get(`${apiUrl}/api/locations`, {
    //             params: {organization_id: selectedOrgId},
    //             headers: {Authorization: `Token ${user?.token}`},
    //         });
    //         setLocations(res.data);
    //     } catch (err) {
    //         console.error('Failed to fetch locations:', err);
    //     }
    // };

    const fetchDepartments = async (locationId: number): Promise<void> => {
        try {
            const res: AxiosResponse<Department[]> = await axios.get(`${apiUrl}/api/departments`, {
                params: {location_id: locationId},
                headers: {Authorization: `Token ${user?.token}`},
            });
            const deps = res.data;
            setDepartments(prev => ({...prev, [locationId]: deps}));

            deps.forEach((dep: Department) => {
                fetchUnits(dep.id);
            });
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
        try {
            const res: AxiosResponse<Shift[]> = await axios.get(`${apiUrl}/api/shifts`, {
                params: {unit: unitId},
                headers: {Authorization: `Token ${user?.token}`},
            });

            const formatted: EventData[] = res.data.map((shift: Shift) => ({
                id: shift.id,
                title: `${shift.user_details.job_title} (${shift.user_details.role.name})`,
                start: new Date(shift.start_time),
                end: new Date(shift.end_time),
                user: shift.user_details.id,
                role: shift.user_details.role.id,
            }));

            setEvents(formatted);
        } catch (err) {
            console.error('Failed to fetch shifts for unit:', err);
        }
    };

    // useEffect(() => {
    //     if (locations.length > 0 && selectedLocationId === null) {
    //         setSelectedLocationId(locations[0].id);
    //     }
    // }, [locations, selectedLocationId]);

    useEffect(() => {
        // if (orgs.length > 0) {
        //     const storedOrg = localStorage.getItem('org_select');
        //     const matchedOrg = storedOrg
        //         ? orgs.find(org => org.organization_id === JSON.parse(storedOrg).organization_id)
        //         : null;
        //
        //     const defaultOrgId = matchedOrg
        //         ? matchedOrg.organization_id.toString()
        //         : orgs[0].organization_id.toString();
        //
        //     setSelectedOrgId(defaultOrgId);
        // }
    }, [orgs]);

    // useEffect(() => {
    //     if (selectedOrgId) {
    //         fetchLocations();
    //     }
    // }, [selectedOrgId]);

    useEffect(() => {
        if (selectedLocationId !== null) {
            fetchDepartments(selectedLocationId);
        }
    }, [selectedLocationId]);

    return (
        <Layout style={{minHeight: '100vh', background: '#f9f9f9'}}>
            <Sider width={350} style={{backgroundColor: '#ffffff', borderRight: '1px solid #f0f0f0'}}>

                {/*<div style={{padding: 16}}>*/}
                {/*    <Title level={5} style={{marginBottom: 16}}>Select Location</Title>*/}
                {/*    <Select*/}
                {/*        placeholder="Choose a location"*/}
                {/*        style={{width: '100%'}}*/}
                {/*        value={selectedLocationId || undefined}*/}
                {/*        onChange={(val: number) => setSelectedLocationId(val)}*/}
                {/*        loading={locations.length === 0}*/}
                {/*    >*/}
                {/*        {locations.map(loc => (*/}
                {/*            <Option key={loc.id} value={loc.id}><Text>{loc.name}</Text></Option>*/}
                {/*        ))}*/}
                {/*    </Select>*/}
                {/*</div>*/}

                <div style={{paddingLeft: 16, paddingRight: 16, paddingTop: 16}}>
                    <Title level={5} style={{marginBottom: 10}}>Departments</Title>
                </div>

                <Menu
                    mode="inline"
                    style={{borderInlineEnd: 'none'}}
                    defaultOpenKeys={
                        selectedLocationId && departments[selectedLocationId]
                            ? departments[selectedLocationId].map(dep => `dep-${dep.id}`)
                            : []
                    }
                >
                    {selectedLocationId &&
                        departments[selectedLocationId]?.map(department => (
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
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 24
                    }}>
                        <Title level={3} style={{margin: 0}}>On-Call Shift Calendar</Title>
                        <Space>
                            <Button
                                type="primary"
                                danger
                                icon={<PlusOutlined/>}
                                onClick={() => setShiftModalOpen(true)}
                            >
                                Add Shift
                            </Button>
                            {shiftModalOpen && (
                                <CreateShiftModal
                                    visible={shiftModalOpen}
                                    onClose={() => setShiftModalOpen(false)}
                                    onShiftCreated={() => {
                                    }}
                                />
                            )}
                        </Space>
                    </div>
                    <Calendar
                        key={events.length} // helps force re-render
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        views={[Views.DAY, Views.WEEK, Views.MONTH]}
                        view={view}
                        onView={setView}
                        date={date}
                        onNavigate={setDate}
                        selectable
                        style={{
                            height: 600,
                            backgroundColor: '#fff',
                            padding: 16,
                            border: '1px solid #f0f0f0',
                            borderRadius: 8,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                        }}
                    />
                </Content>
            </Layout>
        </Layout>
    );
};

export default CalendarView;
