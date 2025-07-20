import React, {useContext, useEffect, useState} from 'react';
import {Calendar, dateFnsLocalizer, View, Views} from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import axios from 'axios';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import {AuthContext} from "../contexts/AuthContext";

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
};

const CalendarView = () => {
    const [events, setEvents] = useState([]);
    const [view, setView] = useState<View>(Views.DAY); // <-- Track the current view
    const apiUrl = process.env.REACT_APP_API_URL;
    const {user} = useContext(AuthContext);

    useEffect(() => {
        axios.get(`${apiUrl}/api/shifts/`, {
            headers: {
                Authorization: `Token ${user?.token}`,
                Accept: "application/json",
                "Content-Type": "application/json",
            },
        }).then((res) => {
            const formatted = res.data.map((shift: Shift) => ({
                title: `${shift.user.username} (${shift.role.name})`,
                start: new Date(shift.start_time),
                end: new Date(shift.end_time),
            }));
            setEvents(formatted);
        });
    }, []);

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4">On-Call Shift Calendar</h2>
            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                views={[Views.DAY, Views.WEEK, Views.MONTH]}
                view={view}
                onView={setView}
                defaultView={Views.MONTH}
                style={{height: 600}}
            />
        </div>
    );
};

export default CalendarView;
