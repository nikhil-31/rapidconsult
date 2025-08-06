// src/pages/Dashboard.tsx
import {
    Layout,
    Menu,
    Typography,
} from 'antd';
import {
    UserOutlined,
    HomeOutlined,
    SettingOutlined,
} from '@ant-design/icons';

const {Header, Sider, Content} = Layout;
const {Title} = Typography;

const Dashboard = () => {
    return (
        <Layout style={{minHeight: '100vh'}}>
            {/* Fixed Sidebar */}
            <Sider width={350} style={{background: '#fff', borderRight: '1px solid #f0f0f0'}}>
                <Menu mode="inline" defaultSelectedKeys={['1']}>
                    <Menu.Item key="1" icon={<HomeOutlined/>}>
                        Home
                    </Menu.Item>
                    <Menu.Item key="2" icon={<UserOutlined/>}>
                        Profile
                    </Menu.Item>
                    <Menu.Item key="3" icon={<SettingOutlined/>}>
                        Settings
                    </Menu.Item>
                </Menu>
            </Sider>

            {/* Main Layout */}
            <Layout>
                <Header style={{background: '#fff', padding: '0 24px', borderBottom: '1px solid #f0f0f0'}}>
                    <Title level={4} style={{margin: 0}}>Dashboard</Title>
                </Header>

                <Content style={{padding: '24px 48px'}}>
                    <Title level={3}>Welcome to RapidConsult</Title>
                    <p>This is your dashboard content.</p>
                </Content>
            </Layout>
        </Layout>
    );
};

export default Dashboard;
