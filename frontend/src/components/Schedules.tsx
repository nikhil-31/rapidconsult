import React, {useContext, useEffect, useState} from 'react';
import {Calendar, dateFnsLocalizer, View, Views} from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import axios from 'axios';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import {AuthContext} from '../contexts/AuthContext';
import {Link, useLocation} from 'react-router-dom';
import {Plus} from 'lucide-react';

const locales = {
    'en-US': require('date-fns/locale/en-US'),
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

type Shift = {
    id: number;
    user: {
        username: string;
    };
    role: {
        name: string;
    };
    start_time: string;
    end_time: string;
    team: number;
    user_id: number;
    role_id: number;
};

type EventData = {
    id: number;
    title: string;
    start: Date;
    end: Date;
    user: number;
    team: number;
    role: number;
};

export const CalendarView = () => {
    const [events, setEvents] = useState<EventData[]>([]);
    const [view, setView] = useState<View>(Views.MONTH);
    const [date, setDate] = useState<Date>(new Date());
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedShiftId, setSelectedShiftId] = useState<number | null>(null);
    const [selectedSlotTime, setSelectedSlotTime] = useState<{ start: Date; end: Date } | undefined>();
    const {user} = useContext(AuthContext);
    const apiUrl = process.env.REACT_APP_API_URL;
    const location = useLocation();

    const fetchEvents = async () => {
        try {
            const res = await axios.get(`${apiUrl}/api/shifts/`, {
                headers: {
                    Authorization: `Token ${user?.token}`,
                },
            });
            const formatted = res.data.map((shift: Shift) => ({
                id: shift.id,
                title: `${shift.user.username} (${shift.role.name})`,
                start: new Date(shift.start_time),
                end: new Date(shift.end_time),
                user: shift.user_id,
                team: shift.team,
                role: shift.role_id,
            }));
            setEvents(formatted);
        } catch (err) {
            console.error('Error loading shifts:', err);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const handleSelectEvent = (event: EventData) => {
        setSelectedShiftId(event.id);
        setDialogOpen(true);
    };

    const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
        setSelectedShiftId(null);
        setSelectedSlotTime({start: slotInfo.start, end: slotInfo.end});
        setDialogOpen(true);
    };

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="flex flex-col h-full">

            <div className="flex flex-1 overflow-hidden">
                <aside className="w-64 bg-gray-100 border-r border-gray-200 p-4">
                    <nav className="space-y-2">
                        <Link
                            to="/schedules/department"
                            className={`block px-4 py-2 rounded ${
                                isActive('/schedules/department')
                                    ? 'bg-blue-100 text-blue-700 font-semibold'
                                    : 'text-gray-800 hover:bg-gray-200'
                            }`}
                        >
                            Department Schedules
                        </Link>
                        <Link
                            to="/schedules/unit"
                            className={`block px-4 py-2 rounded ${
                                isActive('/schedules/unit')
                                    ? 'bg-blue-100 text-blue-700 font-semibold'
                                    : 'text-gray-800 hover:bg-gray-200'
                            }`}
                        >
                            Unit Schedules
                        </Link>
                        <Link
                            to="/schedules/my"
                            className={`block px-4 py-2 rounded ${
                                isActive('/schedules/my')
                                    ? 'bg-blue-100 text-blue-700 font-semibold'
                                    : 'text-gray-800 hover:bg-gray-200'
                            }`}
                        >
                            My Schedules
                        </Link>
                    </nav>
                </aside>

                {/* Calendar Content */}
                <main className="flex-1 overflow-auto p-6 bg-white flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">On-Call Shift Calendar</h2>
                        <div className="space-x-2">
                            <button
                                className="px-3 py-2 bg-red-600 text-white font-semibold rounded hover:bg-red-700 flex items-center gap-2">
                                Add Shift
                                <Plus size={18}/>
                            </button>
                            {/*    <button className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400">Export*/}
                            {/*    </button>*/}
                            {/*    <button className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">Clear</button>*/}
                        </div>
                    </div>

                    <div className="flex-1">
                        <Calendar
                            localizer={localizer}
                            events={events}
                            startAccessor="start"
                            endAccessor="end"
                            views={[Views.DAY, Views.WEEK, Views.MONTH]}
                            view={view}
                            onView={setView}
                            date={date}
                            onNavigate={(newDate) => setDate(newDate)}
                            onSelectEvent={handleSelectEvent}
                            selectable
                            onSelectSlot={handleSelectSlot}
                            style={{height: 600}}
                        />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default CalendarView;
