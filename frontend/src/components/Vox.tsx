import axios, {AxiosResponse} from 'axios';
import React, {useContext, useEffect, useState} from 'react';
import {AuthContext} from '../contexts/AuthContext';
import {Layout, Menu, Typography, Select,} from 'antd';
import {Department} from "../models/Department";
import {Unit} from "../models/Unit";
import {Location} from "../models/Location";
import {useOrgLocation} from "../contexts/LocationContext";

const {Sider, Content} = Layout;
const {Title, Text} = Typography;
const {Option} = Select;

const Vox: React.FC = () => {
    const {user} = useContext(AuthContext);
    const orgs = user?.organizations || [];
    const apiUrl = process.env.REACT_APP_API_URL as string;

    const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
    const {selectedLocation, setSelectedLocation} = useOrgLocation();




    return (
        <Layout style={{minHeight: '100vh', background: '#f9f9f9'}}>
            <Sider width={350} style={{backgroundColor: '#ffffff', borderRight: '1px solid #f0f0f0'}}>

                <div style={{paddingLeft: 16, paddingRight: 16, paddingTop: 16}}>
                    <Title level={5} style={{marginBottom: 10}}>Conversations</Title>
                </div>



            </Sider>

            <Layout>
                <Content style={{padding: '32px 48px', background: '#fff'}}>
                    <div>
                        <h1>Group/direct chat</h1>
                    </div>
                </Content>
            </Layout>

        </Layout>
    );
};

export default Vox;
