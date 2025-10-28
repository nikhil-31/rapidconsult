import React, {useEffect, useState} from "react";
import {Layout, Button, Table, Tag, Spin, Space, Tooltip} from "antd";
import Sider from "antd/es/layout/Sider";
import Title from "antd/es/typography/Title";
import ConsultationModal from "./ConsultationModal";
import CloseConsultModal from "./CloseConsultModal";
import {
    UserOutlined,
    PlusOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    CloseCircleOutlined,
    EditOutlined,
    StopOutlined,
} from "@ant-design/icons";
import {getConsultationsByStatus} from "../api/services";
import {Consultation} from "../models/Consultation";

const {Content} = Layout;

const Consults: React.FC = () => {
    const [modalVisible, setModalVisible] = useState(false);
    const [closeModalVisible, setCloseModalVisible] = useState(false);
    const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);

    const [selectedMenuKey, setSelectedMenuKey] = useState<
        "pending" | "in_progress" | "completed" | "closed" | "calendar"
    >("pending");

    const [consultations, setConsultations] = useState<Consultation[]>([]);
    const [loading, setLoading] = useState(false);

    // Fetch consultations when menu key changes
    useEffect(() => {
        if (selectedMenuKey !== "calendar") {
            loadConsultations(selectedMenuKey);
        }
    }, [selectedMenuKey]);

    const loadConsultations = async (
        status: "pending" | "in_progress" | "completed" | "closed"
    ) => {
        try {
            setLoading(true);
            const data = await getConsultationsByStatus(status);
            setConsultations(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (consultation: Consultation) => {
        setSelectedConsultation(consultation);
        setModalVisible(true);
    };

    const handleClose = (consultation: Consultation) => {
        setSelectedConsultation(consultation);
        setCloseModalVisible(true);
    };

    const handleConsultUpdated = () => {
        if (selectedMenuKey !== "calendar") {
            loadConsultations(selectedMenuKey);
        }
    };

    const columns = [
        {
            title: "Patient",
            dataIndex: "patient_name",
            key: "patient_name",
            render: (text: string) => <strong>{text}</strong>,
        },
        {
            title: "Age",
            dataIndex: "patient_age",
            key: "patient_age",
            width: 80,
        },
        {
            title: "Sex",
            dataIndex: "patient_sex",
            key: "patient_sex",
            width: 100,
            render: (sex: string) =>
                sex ? sex.charAt(0).toUpperCase() + sex.slice(1) : "-",
        },
        {
            title: "Department",
            dataIndex: ["department", "name"],
            key: "department",
        },
        {
            title: "Unit",
            dataIndex: ["unit", "name"],
            key: "unit",
        },
        {
            title: "Referred By",
            dataIndex: ["referred_by_doctor", "user", "name"],
            key: "referredByDoctorName",
        },
        {
            title: "Referred To",
            dataIndex: ["referred_to_doctor", "user", "name"],
            key: "referredToDoctorId",
        },
        {
            title: "Urgency",
            dataIndex: "urgency",
            key: "urgency",
            render: (urgency: string) => {
                const color =
                    urgency === "urgent"
                        ? "red"
                        : urgency === "emergency"
                            ? "volcano"
                            : "blue";
                return <Tag color={color}>{urgency.toUpperCase()}</Tag>;
            },
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: (status: string) => {
                const colorMap: Record<string, string> = {
                    pending: "orange",
                    in_progress: "blue",
                    completed: "green",
                    closed: "default",
                };
                return <Tag color={colorMap[status]}>{status.toUpperCase()}</Tag>;
            },
        },
        {
            title: "Created",
            dataIndex: "created_at",
            key: "created_at",
            render: (date: string) =>
                date
                    ? new Date(date).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                    })
                    : "—",
        },
        {
            title: "Actions",
            key: "actions",
            align: "right" as const,
            render: (_: any, record: Consultation) => (
                <Space>
                    <Tooltip title="Edit">
                        <Button
                            type="text"
                            icon={<EditOutlined/>}
                            onClick={() => handleEdit(record)}
                        />
                    </Tooltip>

                    {record.status !== "closed" && (
                        <Tooltip title="Close Consultation">
                            <Button
                                type="text"
                                danger
                                icon={<StopOutlined/>}
                                onClick={() => handleClose(record)}
                            />
                        </Tooltip>
                    )}
                </Space>
            ),
        },
    ];

    const menuItems = [
        {key: "pending", label: "Pending", icon: <ClockCircleOutlined/>},
        {key: "in_progress", label: "In Progress", icon: <UserOutlined/>},
        {key: "completed", label: "Completed", icon: <CheckCircleOutlined/>},
        {key: "closed", label: "Closed", icon: <CloseCircleOutlined/>},
    ];

    return (
        <Layout style={{minHeight: "100vh", background: "#f9f9f9"}}>
            <Sider
                width={280}
                style={{
                    backgroundColor: "#ffffff",
                    borderRight: "1px solid #f0f0f0",
                    paddingTop: 16,
                }}
            >
                {menuItems.map((item) => (
                    <div
                        key={item.key}
                        onClick={() => setSelectedMenuKey(item.key as any)}
                        style={{
                            padding: "10px 16px",
                            cursor: "pointer",
                            borderRadius: 6,
                            transition: "all 0.2s",
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            marginBottom: 6,
                            backgroundColor:
                                selectedMenuKey === item.key ? "#e6f7ff" : "transparent",
                            color: selectedMenuKey === item.key ? "#1890ff" : "inherit",
                            fontWeight: selectedMenuKey === item.key ? 600 : 500,
                        }}
                    >
                        {item.icon}
                        {item.label}
                    </div>
                ))}
            </Sider>

            <Layout>
                <Content style={{padding: "24px"}}>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 24,
                        }}
                    >
                        <Title level={3} style={{margin: 0}}>
                            {selectedMenuKey === "calendar"
                                ? "Calendar View"
                                : `${
                                    menuItems.find((i) => i.key === selectedMenuKey)?.label
                                } Consultations`}
                        </Title>

                        <Button
                            type="primary"
                            icon={<PlusOutlined/>}
                            style={{
                                backgroundColor: "#ff4d4f",
                                borderColor: "#ff4d4f",
                            }}
                            onClick={() => setModalVisible(true)}
                        >
                            New Consultation
                        </Button>
                    </div>

                    {selectedMenuKey === "calendar" ? (
                        <div>Show calendar component here</div>
                    ) : loading ? (
                        <Spin tip="Loading consultations..."/>
                    ) : (
                        <Table
                            dataSource={consultations}
                            columns={columns}
                            rowKey="id"
                            pagination={{pageSize: 8}}
                            bordered
                            style={{
                                backgroundColor: "#fff",
                                borderRadius: 8,
                            }}
                        />
                    )}
                </Content>
            </Layout>

            <ConsultationModal
                visible={modalVisible}
                onClose={() => {
                    setModalVisible(false);
                    setSelectedConsultation(null);
                }}
                onCreated={handleConsultUpdated}
                consultation={selectedConsultation}
                isEdit={!!selectedConsultation}
            />

            {/* Close Consultation Modal */}
            <CloseConsultModal
                visible={closeModalVisible}
                consultationId={selectedConsultation?.id ?? null}
                onClose={() => setCloseModalVisible(false)}
                onSuccess={handleConsultUpdated}
            />
        </Layout>
    );
};

export default Consults;
