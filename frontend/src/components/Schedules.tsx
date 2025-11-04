import {Layout, Menu, Button, Typography, Space, Skeleton, Select} from 'antd';
import dayjs from 'dayjs';
import isBetween from "dayjs/plugin/isBetween";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
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
import {UserModel} from "../models/UserModel";
import {Department} from "../models/Department";
import {Unit} from "../models/Unit";
import {
    getDepartmentsByLocation,
    getUnitsByDepartment,
    getMyShifts,
    getShiftsByUnit,
    deleteShift
} from "../api/services";

const locales: Record<string, Locale> = {'en-US': require('date-fns/locale/en-US'),};
const {Sider, Content} = Layout;
const {Title} = Typography;
const {Option} = Select;

const localizer = dateFnsLocalizer({format, parse, startOfWeek, getDay, locales,});

dayjs.extend(isBetween);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const CalendarView: React.FC = () => {
    const {user} = useContext(AuthContext);

    const [events, setEvents] = useState<EventData[]>([]);
    const [view, setView] = useState<View>(Views.MONTH);
    const [date, setDate] = useState<Date>(new Date());

    const {selectedLocation} = useOrgLocation();
    const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);

    const [departments, setDepartments] = useState<Record<number, Department[]>>({});
    const [units, setUnits] = useState<Record<number, Unit[]>>({});
    const [shiftModalOpen, setShiftModalOpen] = useState<boolean>(false);

    const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
    const [detailModalOpen, setDetailModalOpen] = useState<boolean>(false);

    const [selectedKey, setSelectedKey] = useState('my-shifts');
    const [menuSelectedKeys, setMenuSelectedKeys] = useState<string[]>([]);

    const [fetchedRange, setFetchedRange] = useState<{ start: dayjs.Dayjs; end: dayjs.Dayjs } | null>(null);

    // Loading
    const [loadingDepartments, setLoadingDepartments] = useState(false);
    const [loadingUnits, setLoadingUnits] = useState<Record<number, boolean>>({});
    const [loadingEvents, setLoadingEvents] = useState(false);
    const [shiftType, setShiftType] = useState<"oncall" | "outpatient">("oncall");

    const stringToColor = (str: string): string => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hue = Math.abs(hash) % 360;
        return `hsl(${hue}, 70%, 80%)`;
    };

    const fetchDepartments = async (locationId: number): Promise<void> => {
        setLoadingDepartments(true);
        try {
            const deps = await getDepartmentsByLocation(locationId);
            setDepartments(prev => ({...prev, [locationId]: deps}));
            deps.forEach((dep: Department) => {
                fetchUnits(dep.id);
            });
        } catch (err) {
            console.error("Failed to fetch departments:", err);
        } finally {
            setLoadingDepartments(false);
        }
    };

    const fetchUnits = async (departmentId: number): Promise<void> => {
        setLoadingUnits(prev => ({...prev, [departmentId]: true}));
        try {
            const units = await getUnitsByDepartment(departmentId);
            setUnits(prev => ({...prev, [departmentId]: units}));
        } catch (err) {
            console.error("Failed to fetch units:", err);
        } finally {
            setLoadingUnits(prev => ({...prev, [departmentId]: false}));
        }
    };

    const EventItem: React.FC<{ event: EventData }> = ({event}) => (
        <div>
            <strong>{event.username} - ({event.job_title})</strong>
            <div style={{fontSize: '0.8em', color: '#555'}}>
                {dayjs(event.start).format('h:mm A')} - {dayjs(event.end).format('h:mm A')}
            </div>
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
        if (selectedLocationId !== null && user !== null) {
            handleMyShiftsClick();
        } else if (selectedKey.startsWith("unit-")) {
            const unitId = parseInt(selectedKey.replace("unit-", ""), 10);
            handleUnitClick(unitId);
        }
    }, [selectedLocationId, user, shiftType]);

    const handleEventClick = (event: EventData) => {
        setSelectedEvent(event);
        setDetailModalOpen(true);
    };

    const handleDeleteShift = async (id: number) => {
        try {
            const data = await deleteShift(id)
            setEvents(prev => prev.filter(event => event.id !== id));
            setDetailModalOpen(false);
            setSelectedEvent(null);
        } catch (err) {
            console.error('Failed to delete shift:', err);
        }
    };

    const handleShiftUpdate = () => {
        if (selectedKey === 'my-shifts') {
            handleMyShiftsClick();
        } else if (selectedKey.startsWith('unit-')) {
            const unitId = parseInt(selectedKey.replace('unit-', ''), 10);
            handleUnitClick(unitId);
        }
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

    const formatShiftsToEvents = (shifts: Shift[]): EventData[] => {
        return shifts.map((shift) => ({
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
            unit_id: shift.unit_details.id,
            unit_name: shift.unit_details.name,
            dept_name: shift.unit_details.department.name,
        }));
    };

    const getDateRange = (date: Date, view: "month" | "week" | "day") => {
        let start: dayjs.Dayjs;
        let end: dayjs.Dayjs;

        switch (view) {
            case "week":
                start = dayjs(date).startOf("week").subtract(7, "day");
                end = dayjs(date).endOf("week").add(7, "day");
                break;
            case "day":
                start = dayjs(date).startOf("day").subtract(7, "day");
                end = dayjs(date).endOf("day").add(7, "day");
                break;
            case "month":
            default:
                start = dayjs(date).startOf("month").subtract(7, "day");
                end = dayjs(date).endOf("month").add(7, "day");
                break;
        }

        return {
            start_date: start.format("YYYY-MM-DD"),
            end_date: end.format("YYYY-MM-DD"),
            startObj: start,
            endObj: end,
        };
    };

    const getMonthRange = (date: Date) => {
        const start = dayjs(date).startOf("month").subtract(7, "day");
        const end = dayjs(date).endOf("month").add(7, "day");
        return {
            start_date: start.format("YYYY-MM-DD"),
            end_date: end.format("YYYY-MM-DD"),
            startObj: start,
            endObj: end,
        };
    };

    const [fetchedRanges, setFetchedRanges] = useState<{ start: dayjs.Dayjs; end: dayjs.Dayjs }[]>([]);

    const isRangeCovered = (start: dayjs.Dayjs, end: dayjs.Dayjs) => {
        if (fetchedRanges.length === 0) return false;

        // Step 1: Merge overlapping or adjacent ranges
        const sorted = [...fetchedRanges].sort((a, b) => a.start.diff(b.start));
        const merged: { start: dayjs.Dayjs; end: dayjs.Dayjs }[] = [];

        for (const range of sorted) {
            const last = merged[merged.length - 1];
            // merge if overlapping OR touching (1 day apart)
            if (!last || range.start.isAfter(last.end.add(1, "day"))) {
                merged.push({...range});
            } else if (range.end.isAfter(last.end)) {
                last.end = range.end;
            }
        }

        // Step 2: Check if entire requested range is covered by any merged range
        return merged.some((r) =>
            start.isSameOrAfter(r.start, "day") && end.isSameOrBefore(r.end, "day")
        );
    };


    const handleUnitClick = async (
        unitId: number,
        dateParam?: Date,
    ): Promise<void> => {
        setLoadingEvents(true);
        try {
            const {start_date, end_date, startObj, endObj} = getMonthRange(dateParam || date);

            // Check if previously fetched events all belong to the same unit
            const hasDifferentUnit = events.some((e) => e.unit_id !== unitId);

            if (hasDifferentUnit) {
                // Clear previous unit's cache and events
                setEvents([]);
                setFetchedRanges([]);
            }

            // If not month view, and we already have data covering this range, skip fetch
            // Skip fetch if month already loaded
            if (isRangeCovered(startObj, endObj) && !hasDifferentUnit) {
                setLoadingEvents(false);
                return;
            }

            const data = await getShiftsByUnit(unitId, shiftType, start_date, end_date);
            const formatted = formatShiftsToEvents(data);

            setSelectedKey(`unit-${unitId}`);
            setMenuSelectedKeys([`unit-${unitId}`]);

            setEvents((prev) => {
                const existingIds = new Set(prev.map((e) => e.id));
                const newEvents = formatted.filter((e) => !existingIds.has(e.id));
                return [...prev, ...newEvents];
            });

            // Merge overlapping ranges
            setFetchedRanges((prev) => {
                const merged = [...prev, {start: startObj, end: endObj}];
                merged.sort((a, b) => a.start.diff(b.start));

                const result: { start: dayjs.Dayjs; end: dayjs.Dayjs }[] = [];
                for (const range of merged) {
                    const last = result[result.length - 1];
                    if (!last || range.start.isAfter(last.end)) {
                        result.push(range);
                    } else if (range.end.isAfter(last.end)) {
                        last.end = range.end;
                    }
                }
                return result;
            });
        } catch (err) {
            console.error("Failed to fetch shifts for unit:", err);
        } finally {
            setLoadingEvents(false);
        }
    };

    const handleMyShiftsClick = async () => {
        setLoadingEvents(true);
        try {
            const data = await getMyShifts(getOrgProfileId(user), selectedLocationId, shiftType)
            const formatted = formatShiftsToEvents(data);

            setSelectedKey("my-shifts");
            setMenuSelectedKeys([]);
            setEvents(formatted);
        } catch (err) {
            console.error("Failed to fetch my shifts:", err);
        } finally {
            setLoadingEvents(false);
        }
    };

    return (
        <Layout style={{minHeight: "100vh", background: "#f9f9f9"}}>
            <Sider
                width={350}
                style={{backgroundColor: "#ffffff", borderRight: "1px solid #f0f0f0"}}
            >
                <div style={{padding: "16px"}}>
                    <Title level={5} style={{marginBottom: 8}}>
                        Shift Type
                    </Title>
                    <Select
                        value={shiftType}
                        onChange={(value) => setShiftType(value as "oncall" | "outpatient")}
                        style={{width: "100%"}}
                    >
                        <Option value="oncall">On-Call</Option>
                        <Option value="outpatient">Outpatient</Option>
                    </Select>
                </div>

                <div
                    key="my-shifts"
                    onClick={handleMyShiftsClick}
                    style={{
                        padding: "8px 16px",
                        marginTop: "16px",
                        cursor: "pointer",
                        borderRadius: 6,
                        transition: "all 0.2s",
                        fontWeight: 500,
                        backgroundColor:
                            selectedKey === "my-shifts" ? "#e6f7ff" : "transparent",
                        color: selectedKey === "my-shifts" ? "#1890ff" : "inherit",
                    }}
                >
                    📅 My Shifts
                </div>

                {/* Departments Title */}
                <div style={{paddingLeft: 16, paddingRight: 16, paddingTop: 16}}>
                    <Title level={5} style={{marginBottom: 10}}>
                        Departments
                    </Title>
                </div>

                {/* Departments Menu OR Skeleton */}
                {loadingDepartments ? (
                    <div style={{padding: "0 16px"}}>
                        <Skeleton active paragraph={{rows: 6}}/>
                    </div>
                ) : (
                    <Menu
                        mode="inline"
                        style={{borderInlineEnd: "none"}}
                        selectedKeys={menuSelectedKeys}
                        defaultOpenKeys={
                            selectedLocationId && departments[selectedLocationId]
                                ? departments[selectedLocationId].map((dep) => `dep-${dep.id}`)
                                : []
                        }
                    >
                        {selectedLocationId &&
                            departments[selectedLocationId]?.map((department) => (
                                <Menu.SubMenu
                                    key={`dep-${department.id}`}
                                    title={<span style={{fontWeight: 500}}>{department.name}</span>}
                                >
                                    {units[department.id] ? (
                                        units[department.id].map((unit) => (
                                            <Menu.Item
                                                key={`unit-${unit.id}`}
                                                onClick={() => handleUnitClick(unit.id)}
                                            >
                                                {unit.name}
                                            </Menu.Item>
                                        ))
                                    ) : (
                                        <Menu.Item disabled>
                                            <Skeleton.Input active size="small" style={{width: 120}}/>
                                        </Menu.Item>
                                    )}
                                </Menu.SubMenu>
                            ))}
                    </Menu>
                )}
            </Sider>

            <Layout>
                <Content style={{padding: "32px 48px", background: "#fff"}}>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 24,
                        }}
                    >
                        <Title level={3} style={{margin: 0}}>
                            On-Call Shift Calendar
                        </Title>
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
                                        setShiftModalOpen(false)
                                        handleShiftUpdate()
                                    }}
                                />
                            )}
                        </Space>
                    </div>

                    {/* Calendar OR Skeleton */}
                    {loadingEvents ? (
                        <Skeleton active paragraph={{rows: 1}}/>
                    ) : (
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
                            onNavigate={(newDate, view) => {
                                setDate(newDate);

                                // Always fetch the entire month for the navigated date
                                if (selectedKey.startsWith("unit-")) {
                                    const unitId = parseInt(selectedKey.replace("unit-", ""), 10);
                                    handleUnitClick(unitId, newDate);
                                }
                            }}
                            onSelectEvent={handleEventClick}
                            selectable
                            style={{
                                height: 600,
                                backgroundColor: "#fff",
                            }}
                            eventPropGetter={(event: EventData) => {
                                const backgroundColor = stringToColor(event.username);
                                return {
                                    style: {
                                        backgroundColor,
                                        borderRadius: "4px",
                                        color: "#000",
                                        border: "1px solid #ccc",
                                        padding: "4px",
                                    },
                                };
                            }}
                            components={{
                                event: EventItem,
                            }}
                        />
                    )}

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

