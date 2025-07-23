import React, {useContext, useEffect, useState} from 'react';
import {Calendar, dateFnsLocalizer, View, Views} from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import axios from 'axios';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import {AuthContext} from '../contexts/AuthContext';
import {ShiftEditDialog} from './EditShiftDialog';

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
    const [date, setDate] = useState<Date>(new Date()); // Track calendar's current date
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedShiftId, setSelectedShiftId] = useState<number | null>(null);
    const [selectedSlotTime, setSelectedSlotTime] = useState<{ start: Date; end: Date } | undefined>();
    const {user} = useContext(AuthContext);
    const apiUrl = process.env.REACT_APP_API_URL;

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
        setSelectedShiftId(null); // new shift
        setSelectedSlotTime({start: slotInfo.start, end: slotInfo.end});
        setDialogOpen(true);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Content wrapper that fills remaining space */}
            <div className="flex-1 flex items-center justify-center">
                <div className="p-4 w-full max-w-5xl h-full flex flex-col">
                    <h2 className="text-xl font-bold mb-4">On-Call Shift Calendar</h2>

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
                            style={{height: 600}} // fill container
                        />

                        {/*<ShiftEditDialog*/}
                        {/*    isOpen={dialogOpen}*/}
                        {/*    onClose={() => setDialogOpen(false)}*/}
                        {/*    shiftId={selectedShiftId}*/}
                        {/*    onSaved={fetchEvents}*/}
                        {/*    defaultTimeRange={selectedSlotTime}*/}
                        {/*/>*/}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CalendarView;
