import axios, {AxiosResponse} from 'axios';
import React, {useContext, useEffect, useState} from 'react';
import {AuthContext} from '../contexts/AuthContext';
import {Layout, Menu, Typography, Card} from 'antd';
import {Department} from "../models/Department";
import {Unit} from "../models/Unit";
import {useOrgLocation} from "../contexts/LocationContext";

const {Sider, Content} = Layout;
const {Title, Text} = Typography;

const OnCall: React.FC = () => {
    const {user} = useContext(AuthContext);
    const apiUrl = process.env.REACT_APP_API_URL as string;

    const [departments, setDepartments] = useState<Record<number, Department[]>>({});
    const [units, setUnits] = useState<Record<number, Unit[]>>({});
    const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
    const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null); // ✅ track selected unit
    const {selectedLocation} = useOrgLocation();

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

    const handleUnitClick = (unitId: number): void => {
        setSelectedUnitId(unitId); // ✅ update selected
        // could load more details or open chat
        console.log(`unit id ${unitId}`)
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
        <Layout style={{minHeight: '100vh', background: '#f9f9f9'}}>
            <Sider width={350} style={{backgroundColor: '#ffffff', borderRight: '1px solid #f0f0f0'}}>
                <div style={{padding: 16}}>
                    <Title level={5} style={{marginBottom: 10}}>Departments</Title>
                </div>

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
                                                onClick={() => handleUnitClick(unit.id)}
                                                style={{
                                                    borderRadius: 6,
                                                    margin: "6px 15px",
                                                    boxShadow: isSelected ? "0 0 2px rgba(255, 77, 79, 0.5)" : "none", // 🔴 red glow
                                                    width: "auto",
                                                    minHeight: 140,
                                                    border: isSelected ? "1px solid #ff4d4f" : "1px solid #d9d9d9", // 🔴 red outline
                                                    borderLeft: isSelected ? "2px solid #ff4d4f" : "2px solid #d9d9d9",
                                                    background: isSelected ? "#fff1f0" : "#fff", // 🔴 pale red background
                                                    transition: "all 0.2s ease-in-out",
                                                    cursor: "pointer",
                                                }}
                                                bodyStyle={{padding: 14}}
                                            >
                                                {/* Unit name */}
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

                                                {/* Shifts */}
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
