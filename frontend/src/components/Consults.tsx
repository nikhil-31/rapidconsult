import React from "react";
import {Layout} from "antd";
import Sider from "antd/es/layout/Sider";
import Title from "antd/es/typography/Title";


const Consults: React.FC = () => {


    return (
        <Layout style={{minHeight: "100vh", background: "#f9f9f9"}}>
            <Sider
                width={350}
                style={{backgroundColor: "#ffffff", borderRight: "1px solid #f0f0f0"}}
            >

            </Sider>

            <Layout>
                <Title>Add something</Title>

            </Layout>
        </Layout>
    )
}

export default Consults;
