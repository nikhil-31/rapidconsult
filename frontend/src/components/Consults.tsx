import React, { useState } from "react";
import { Layout, Button } from "antd";
import Sider from "antd/es/layout/Sider";
import Title from "antd/es/typography/Title";
import ConsultationModal from "./ConsultationModal";
import { UserOutlined, PlusOutlined, CalendarOutlined } from "@ant-design/icons";

const { Content } = Layout;

const Consults: React.FC = () => {
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedMenuKey, setSelectedMenuKey] = useState("my-consults");

    const handleConsultCreated = () => {
        console.log("Consultation created!");
    };

    const handleClick = (key: string) => {
        setSelectedMenuKey(key);
        console.log("Selected menu:", key);
    };

    return (
        <Layout style={{ minHeight: "100vh", background: "#f9f9f9" }}>
            <Sider
                width={350}
                style={{
                    backgroundColor: "#ffffff",
                    borderRight: "1px solid #f0f0f0",
                    paddingTop: 16,
                }}
            >
                {/* My Consults */}
                <div
                    key="my-consults"
                    onClick={() => handleClick("my-consults")}
                    style={{
                        padding: "8px 16px",
                        cursor: "pointer",
                        borderRadius: 6,
                        transition: "all 0.2s",
                        fontWeight: 500,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 8,
                        backgroundColor:
                            selectedMenuKey === "my-consults" ? "#e6f7ff" : "transparent",
                        color: selectedMenuKey === "my-consults" ? "#1890ff" : "inherit",
                    }}
                >
                    <UserOutlined />
                    My Consults
                </div>

                {/* Calendar View */}
                <div
                    key="calendar"
                    onClick={() => handleClick("calendar")}
                    style={{
                        padding: "8px 16px",
                        cursor: "pointer",
                        borderRadius: 6,
                        transition: "all 0.2s",
                        fontWeight: 500,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        backgroundColor:
                            selectedMenuKey === "calendar" ? "#e6f7ff" : "transparent",
                        color: selectedMenuKey === "calendar" ? "#1890ff" : "inherit",
                    }}
                >
                    <CalendarOutlined />
                    Calendar View
                </div>
            </Sider>

            <Layout>
                <Content style={{ padding: "24px", position: "relative" }}>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 24,
                        }}
                    >
                        <Title level={3} style={{ margin: 0 }}>
                            {selectedMenuKey === "calendar"
                                ? "Calendar View"
                                : "My Consultations"}
                        </Title>

                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            style={{ backgroundColor: "#ff4d4f", borderColor: "#ff4d4f" }}
                            onClick={() => setModalVisible(true)}
                        >
                            New Consultation
                        </Button>
                    </div>

                    {/* Conditional content */}
                    <div>
                        {selectedMenuKey === "calendar"
                            ? "Show calendar component here"
                            : "Show consultations list here"}
                    </div>
                </Content>
            </Layout>

            {/* Consultation modal */}
            <ConsultationModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onCreated={handleConsultCreated}
            />
        </Layout>
    );
};

export default Consults;
