import axios, {AxiosResponse} from 'axios';
import React, {useContext, useEffect, useState} from 'react';
import {AuthContext} from '../contexts/AuthContext';
import {Layout, Menu, Typography, Card, Skeleton} from 'antd';
import {Department} from "../models/Department";
import {Unit} from "../models/Unit";
import {useOrgLocation} from "../contexts/LocationContext";
import ChatView from "./ChatView";
import {Conversation} from "../models/ActiveConversation";
import {PaginatedResponse} from "../models/PaginatedResponse";

const {Sider, Content} = Layout;
const {Title, Text} = Typography;

const OnCall: React.FC = () => {
    const {user} = useContext(AuthContext);
    const apiUrl = process.env.REACT_APP_API_URL as string;

    const [departments, setDepartments] = useState<Record<number, Department[]>>({});
    const [units, setUnits] = useState<Record<number, Unit[]>>({});
    const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
    const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
    const {selectedLocation} = useOrgLocation();
    const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);

    // Loading shimmer
    const [loadingDepartments, setLoadingDepartments] = useState(false);
    const [loadingUnits, setLoadingUnits] = useState<Record<number, boolean>>({});


    const fetchDepartments = async (locationId: number): Promise<void> => {
        setLoadingDepartments(true);
        try {
            const res: AxiosResponse<PaginatedResponse<Department>> = await axios.get(
                `${apiUrl}/api/departments/`,
                {
                    params: {location_id: locationId},
                    headers: {Authorization: `Token ${user?.token}`},
                }
            );

            const departments = res.data.results;
            setDepartments(prev => ({...prev, [locationId]: departments}));
            departments.forEach(dep => fetchUnits(dep.id));
        } catch (err) {
            console.error("Failed to fetch departments:", err);
        } finally {
            setLoadingDepartments(false);
        }
    };

    const fetchUnits = async (departmentId: number): Promise<void> => {
        setLoadingUnits(prev => ({...prev, [departmentId]: true}));
        try {
            const res: AxiosResponse<PaginatedResponse<Unit>> = await axios.get(
                `${apiUrl}/api/units/`,
                {
                    params: {department_id: departmentId},
                    headers: {Authorization: `Token ${user?.token}`},
                }
            );

            const units = res.data.results;
            setUnits(prev => ({...prev, [departmentId]: units}));
        } catch (err) {
            console.error("Failed to fetch units:", err);
        } finally {
            setLoadingUnits(prev => ({...prev, [departmentId]: false}));
        }
    };

    const handleUnitClick = (unit: Unit): void => {
        setSelectedUnitId(unit.id);

        if (unit.conversation) {
            setActiveConversation(unit.conversation);
        } else {
            setActiveConversation(null)
        }
    };

    useEffect(() => {
        setSelectedLocationId(selectedLocation?.location?.id ?? null);
    }, [selectedLocation]);

    useEffect(() => {
        if (selectedLocationId !== null) {
            fetchDepartments(selectedLocationId);
        }
    }, [selectedLocationId]);

    return (
        <Layout style={{height: 'calc(100vh - 64px)', background: '#f9f9f9'}}>
            <Sider
                width={350}
                style={{
                    backgroundColor: '#ffffff',
                    borderRight: '1px solid #f0f0f0',
                    overflow: 'hidden',
                }}
            >
                <div style={{padding: 16}}>
                    <Title level={5} style={{marginBottom: 10}}>Departments</Title>
                </div>

                {/* Scrollable container */}
                <div style={{height: 'calc(100vh - 64px - 48px)', overflowY: 'auto'}}>
                    {/* Departments Menu OR Skeleton */}
                    {loadingDepartments ? (
                        <div style={{padding: "0 16px"}}>
                            <Skeleton active paragraph={{rows: 2}}/>
                        </div>
                    ) : (
                        <Menu mode="inline" style={{borderInlineEnd: "none"}}>
                            {selectedLocationId &&
                                departments[selectedLocationId]?.map((department) => (
                                    <Menu.SubMenu
                                        key={`dep-${department.id}`}
                                        title={
                                            <span
                                                style={{
                                                    fontWeight: 700,
                                                    fontSize: 15,
                                                    color: "#262626",
                                                }}
                                            >
                                {department.name}
                            </span>
                                        }
                                        popupClassName="custom-submenu"
                                    >
                                        <div style={{padding: 0, margin: 0}}>
                                            {units[department.id]?.map((unit) => {
                                                const isSelected = selectedUnitId === unit.id;
                                                return (
                                                    <Card
                                                        key={`unit-${unit.id}`}
                                                        hoverable
                                                        onClick={() => handleUnitClick(unit)}
                                                        style={{
                                                            borderRadius: 6,
                                                            margin: "6px 15px",
                                                            boxShadow: isSelected ? "0 0 2px rgba(255, 77, 79, 0.5)" : "none",
                                                            width: "auto",
                                                            minHeight: 140,
                                                            border: isSelected ? "1px solid #ff4d4f" : "1px solid #d9d9d9",
                                                            borderLeft: isSelected ? "2px solid #ff4d4f" : "2px solid #d9d9d9",
                                                            background: isSelected ? "#fff1f0" : "#fff",
                                                            transition: "all 0.2s ease-in-out",
                                                            cursor: "pointer",
                                                        }}
                                                        bodyStyle={{padding: 14}}
                                                    >
                                                        <Title
                                                            level={5}
                                                            style={{
                                                                marginBottom: 5,
                                                                fontSize: 14,
                                                                fontWeight: 600,
                                                            }}
                                                        >
                                                            {unit.name}
                                                        </Title>

                                                        {unit.oncall && unit.oncall.length > 0 ? (
                                                            unit.oncall.map((shift, idx) => (
                                                                <div
                                                                    key={shift.id}
                                                                    style={{
                                                                        padding: "8px 10px",
                                                                        marginTop: 6,
                                                                        borderTop: idx > 0 ? "1px solid #f0f0f0" : "none",
                                                                        display: "flex",
                                                                        flexDirection: "column",
                                                                        gap: 2,
                                                                        background: "#fafafa",
                                                                        borderRadius: 4,
                                                                    }}
                                                                >
                                                                    <Text strong style={{fontSize: 13}}>
                                                                        👤 {shift.name}
                                                                    </Text>
                                                                    <Text type="secondary" style={{fontSize: 11}}>
                                                                        {shift.job_title}
                                                                    </Text>
                                                                    <Text style={{fontSize: 11}}>
                                                                        🕒{" "}
                                                                        {new Date(shift.shift_start).toLocaleTimeString([], {
                                                                            hour: "2-digit",
                                                                            minute: "2-digit",
                                                                        })}{" "}
                                                                        –{" "}
                                                                        {new Date(shift.shift_end).toLocaleTimeString([], {
                                                                            hour: "2-digit",
                                                                            minute: "2-digit",
                                                                        })}
                                                                    </Text>
                                                                    {shift.primary_contact && (
                                                                        <a style={{marginTop: 2}}>
                                                                            <Text strong style={{fontSize: 11}}>
                                                                                📞 {shift.primary_contact.number}
                                                                            </Text>
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <Text
                                                                type="secondary"
                                                                style={{fontSize: 11, fontStyle: "italic"}}
                                                            >
                                                                No one on-call
                                                            </Text>
                                                        )}
                                                    </Card>
                                                );
                                            }) || <Text type="secondary">Loading units...</Text>}
                                        </div>
                                    </Menu.SubMenu>
                                ))}
                        </Menu>
                    )}


                </div>
            </Sider>


            <Layout>
                <Content style={{background: '#fff'}}>
                    {activeConversation ? (
                        <ChatView
                            key={activeConversation.conversationId}
                            conversation={activeConversation}
                            onNewMessage={(convId, message) => {

                            }}
                        />
                    ) : (
                        <div style={{padding: 20}}>Select a unit to see its chat</div>
                    )}
                </Content>
            </Layout>
        </Layout>
    );
};

export default OnCall;
