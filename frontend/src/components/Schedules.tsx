import axios, {AxiosResponse} from 'axios';
import dayjs from 'dayjs';
import {Layout, Menu, Button, Typography, Space,} from 'antd';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import {Calendar, dateFnsLocalizer, View, Views,} from 'react-big-calendar';
import {Locale} from 'date-fns';
import React, {useContext, useEffect, useState} from 'react';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import {AuthContext} from '../contexts/AuthContext';
import {PlusOutlined} from '@ant-design/icons';
import CreateShiftModal from './ShiftModal';
import {useOrgLocation} from "../contexts/LocationContext";
import ShiftDetailModal from "./EventDetailModal";
import {Shift} from "../models/Shift";
import {EventData} from "../models/EventData";
import {ProfileData} from "../models/ProfileData";
import {UserModel} from "../models/UserModel";
import {CalendarOutlined} from '@ant-design/icons';

const locales: Record<string, Locale> = {
    'en-US': require('date-fns/locale/en-US'),
};
const {Sider, Content} = Layout;
const {Title} = Typography;

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

type Department = { id: number; name: string };
type Unit = { id: number; name: string };

const CalendarView: React.FC = () => {
    const {user} = useContext(AuthContext);
    const apiUrl = process.env.REACT_APP_API_URL as string;

    const [events, setEvents] = useState<EventData[]>([]);
    const [view, setView] = useState<View>(Views.MONTH);
    const [date, setDate] = useState<Date>(new Date());

    const {selectedLocation, setSelectedLocation} = useOrgLocation();
    const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);

    const [departments, setDepartments] = useState<Record<number, Department[]>>({});
    const [units, setUnits] = useState<Record<number, Unit[]>>({});
    const [shiftModalOpen, setShiftModalOpen] = useState<boolean>(false);

    const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
    const [detailModalOpen, setDetailModalOpen] = useState<boolean>(false);

    const [myShifts, setMyShifts] = useState<EventData[]>([]);
    const [selectedKey, setSelectedKey] = useState('my-shifts');

    const stringToColor = (str: string): string => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hue = Math.abs(hash) % 360;
        return `hsl(${hue}, 70%, 80%)`;
    };

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
                title: `${shift.user_details.user.username} (${shift.user_details.role.name})`,
                start: new Date(shift.start_time),
                end: new Date(shift.end_time),
                user: shift.user_details.id,
                job_title: shift.user_details.job_title,
                role: shift.user_details.role.id,
                username: shift.user_details.user.username,
                role_name: shift.user_details.role.name,
                profile_picture: shift.user_details.user.profile_picture,
                unit_id: shift.unit_details.id
            }));

            setEvents(formatted);
        } catch (err) {
            console.error('Failed to fetch shifts for unit:', err);
        }
    };

    const EventItem: React.FC<{ event: EventData }> = ({event}) => (
        <div>
            <strong>{event.username} - ({event.job_title})</strong>
            {/*<div style={{fontSize: '0.8em', color: '#555'}}>*/}
            {/*    {dayjs(event.start).format('h:mm A')} - {dayjs(event.end).format('h:mm A')}*/}
            {/*</div>*/}
        </div>
    );

    useEffect(() => {
        setSelectedLocationId(selectedLocation?.location?.id ?? null);
    }, [selectedLocation]);

    useEffect(() => {
        if (selectedLocationId !== null) {
            fetchDepartments(selectedLocationId);
        }
    }, [selectedLocationId]);

    useEffect(() => {
        // Trigger click behavior when page loads
        handleMyShiftsClick();
    }, []);

    const handleEventClick = (event: EventData) => {
        setSelectedEvent(event);
        setDetailModalOpen(true);
    };

    const handleDeleteShift = async (id: number) => {
        try {
            await axios.delete(`${apiUrl}/api/shifts/${id}/`, {
                headers: {Authorization: `Token ${user?.token}`},
            });

            setEvents(prev => prev.filter(event => event.id !== id));
            setDetailModalOpen(false);
            setSelectedEvent(null);
        } catch (err) {
            console.error('Failed to delete shift:', err);
        }
    };

    const handleShiftUpdate = () => {

    };

    function getOrgProfileId(userModel: UserModel | null): string | null {
        const orgWithLocation = userModel?.organizations?.find(org =>
            org.allowed_locations?.some(loc => loc.id === selectedLocation?.location?.id)
        );

        if (orgWithLocation?.id) {
            return (`${orgWithLocation.id}`)
        }
        return null;
    }

    const handleMyShiftsClick = async () => {
        try {
            const res: AxiosResponse<Shift[]> = await axios.get(`${apiUrl}/api/shifts`, {
                params: {
                    user: getOrgProfileId(user),
                    location: selectedLocationId
                },
                headers: {Authorization: `Token ${user?.token}`},
            });

            const formatted: EventData[] = res.data.map((shift: Shift) => ({
                id: shift.id,
                title: `${shift.user_details.user.username} (${shift.user_details.role.name})`,
                start: new Date(shift.start_time),
                end: new Date(shift.end_time),
                user: shift.user_details.id,
                job_title: shift.user_details.job_title,
                role: shift.user_details.role.id,
                username: shift.user_details.user.username,
                role_name: shift.user_details.role.name,
                profile_picture: shift.user_details.user.profile_picture,
                unit_id: shift.unit_details.id
            }));

            setEvents(formatted);
        } catch (err) {
            console.error('Failed to fetch my shifts:', err);
        }
    };

    return (
        <Layout style={{minHeight: '100vh', background: '#f9f9f9'}}>

            <Sider width={350} style={{backgroundColor: '#ffffff', borderRight: '1px solid #f0f0f0'}}>

                <div
                    key="my-shifts"
                    onClick={() => {
                        setSelectedKey('my-shifts');
                        handleMyShiftsClick();
                    }}
                    style={{
                        padding: '8px 16px',
                        cursor: 'pointer',
                        borderRadius: 6,
                        transition: 'all 0.2s',
                        fontWeight: 500,
                        backgroundColor: selectedKey === 'my-shifts' ? '#e6f7ff' : 'transparent',
                        color: selectedKey === 'my-shifts' ? '#1890ff' : 'inherit',
                    }}
                    onMouseEnter={(e) => {
                        if (selectedKey !== 'my-shifts') {
                            e.currentTarget.style.backgroundColor = '#f5f5f5';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (selectedKey !== 'my-shifts') {
                            e.currentTarget.style.backgroundColor = 'transparent';
                        }
                    }}
                >
                    📅 My Shifts
                </div>

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
                        key={events.length}
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        views={[Views.DAY, Views.WEEK, Views.MONTH]}
                        view={view}
                        onView={setView}
                        date={date}
                        onNavigate={setDate}
                        onSelectEvent={handleEventClick}
                        selectable
                        style={{
                            height: 600,
                            backgroundColor: '#fff',
                            padding: 16,
                            border: '1px solid #f0f0f0',
                            borderRadius: 8,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                        }}
                        eventPropGetter={(event: EventData) => {
                            const backgroundColor = stringToColor(event.username);
                            return {
                                style: {
                                    backgroundColor,
                                    borderRadius: '4px',
                                    color: '#000',
                                    border: '1px solid #ccc',
                                    padding: '4px'
                                }
                            };
                        }}
                        components={{
                            event: EventItem
                        }}
                    />

                    <ShiftDetailModal
                        visible={detailModalOpen}
                        event={selectedEvent}
                        onClose={() => {
                            setDetailModalOpen(false);
                            setSelectedEvent(null);
                        }}
                        onUpdated={handleShiftUpdate}
                        onDelete={handleDeleteShift}
                    />
                </Content>
            </Layout>
        </Layout>
    );
};

export default CalendarView;

