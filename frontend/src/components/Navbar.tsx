import {Link, Outlet, useLocation} from "react-router-dom";
import {useContext} from "react";
import {AuthContext} from "../contexts/AuthContext";
import {NotificationContext} from "../contexts/NotificationContext";
import {useOrgLocation} from "../contexts/LocationContext";
import {OrgLocation} from "../models/OrgLocation";
import {
    Layout,
    Menu,
    Select,
    Dropdown,
    Avatar,
    Badge,
    Typography,
    Space,
    ConfigProvider,
} from "antd";
import {
    UserOutlined,
    LogoutOutlined,
    ProfileOutlined,
    SettingOutlined,
} from "@ant-design/icons";
import type {MenuProps} from "antd";

const {Header, Content} = Layout;
const {Option} = Select;

export function Navbar() {
    const {user, logout} = useContext(AuthContext);
    const {unreadMessageCount} = useContext(NotificationContext);
    const {selectedLocation, setSelectedLocation} = useOrgLocation();
    const location = useLocation();

    const orgs = user?.organizations || [];

    const handleLocationChange = (locationId: number) => {
        for (const org of orgs) {
            const found = org.allowed_locations.find((loc) => loc.id === locationId);
            if (found) {
                const orgLocation: OrgLocation = {
                    organization: org.organization,
                    location: found,
                };
                setSelectedLocation(orgLocation);
                break;
            }
        }
    };

    const profileMenuItems: MenuProps["items"] = [
        {
            key: "username",
            label: (
                <Typography.Text strong>
                    Logged in: {user?.username}
                </Typography.Text>
            ),
            disabled: true,
        },
        {type: "divider"},
        {
            key: "profile",
            icon: <ProfileOutlined/>,
            label: <Link to="/profile">Profile</Link>,
        },
        {
            key: "admin",
            icon: <SettingOutlined/>,
            label: <Link to="/admin">Admin</Link>,
        },
        {type: "divider"},
        {
            key: "logout",
            icon: <LogoutOutlined/>,
            danger: true,
            label: <span onClick={logout}>Logout</span>,
        },
    ];

    return (
        <ConfigProvider
            theme={{
                components: {
                    Menu: {
                        itemSelectedColor: "red",              // selected text color
                        horizontalItemSelectedColor: "red",    // for horizontal menus
                        itemSelectedBg: "transparent",         // no background highlight
                        itemHoverColor: "red",                 // hover turns red
                    },
                },
            }}
        >
            <Layout style={{minHeight: "100vh"}}>
                <Header
                    style={{
                        background: "#fff",
                        padding: "0 24px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        boxShadow: "0 1px 4px rgba(0,21,41,.08)",
                        borderBottom: "1px solid #f0f0f0",
                    }}
                >
                    <Space size="large" align="center">
                        <Link
                            to="/"
                            style={{fontSize: 18, fontWeight: 600, color: "#000"}}
                        >
                            RapidConsult
                        </Link>

                        {user && orgs.length > 0 && (
                            <Select
                                style={{width: 260}}
                                placeholder="Select Location"
                                value={selectedLocation?.location?.id || undefined}
                                onChange={handleLocationChange}
                                optionLabelProp="label"
                            >
                                {orgs.map((org) =>
                                    org.allowed_locations.map((loc) => (
                                        <Option
                                            key={loc.id}
                                            value={loc.id}
                                            label={loc.name}
                                        >
                                            <div>
                                                <div style={{fontWeight: 500}}>
                                                    {loc.name}
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: 12,
                                                        color: "#999",
                                                    }}
                                                >
                                                    {org.organization.name}
                                                </div>
                                            </div>
                                        </Option>
                                    ))
                                )}
                            </Select>
                        )}
                    </Space>

                    <Menu
                        mode="horizontal"
                        selectedKeys={[location.pathname]}
                        style={{
                            flex: 1,
                            justifyContent: "center",
                            borderBottom: "none",
                        }}
                    >
                        {user && (
                            <>
                                <Menu.Item key="/consults">
                                    <Link to="/consults">Consults</Link>
                                </Menu.Item>
                                <Menu.Item key="/schedules">
                                    <Link to="/schedules">Schedules</Link>
                                </Menu.Item>
                                <Menu.Item key="/oncall">
                                    <Link to="/oncall">On-Call</Link>
                                </Menu.Item>
                                <Menu.Item key="/">
                                    <Link to="/">
                                        Messages{" "}
                                        {unreadMessageCount > 0 && (
                                            <Badge
                                                count={unreadMessageCount}
                                                overflowCount={99}
                                                style={{marginLeft: 6}}
                                            />
                                        )}
                                    </Link>
                                </Menu.Item>
                                <Menu.Item key="/contacts">
                                    <Link to="/contacts">Contacts</Link>
                                </Menu.Item>
                            </>
                        )}
                        {!user && (
                            <Menu.Item key="/login">
                                <Link to="/login">Login</Link>
                            </Menu.Item>
                        )}
                    </Menu>

                    {user && (
                        <Dropdown
                            menu={{items: profileMenuItems}}
                            placement="bottomRight"
                            arrow
                        >
                            <Avatar
                                src={user.profile_picture || "/doctor-default.png"}
                                icon={!user.profile_picture && <UserOutlined/>}
                                style={{cursor: "pointer"}}
                            />
                        </Dropdown>
                    )}
                </Header>

                <Content style={{background: "#fff"}}>
                    <Outlet/>
                </Content>
            </Layout>
        </ConfigProvider>
    );
}
