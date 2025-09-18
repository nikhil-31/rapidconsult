import {Form, Input, Button, Typography, Alert, Card, Row, Col} from 'antd';
import {useFormik} from 'formik';
import {useContext, useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {AuthContext} from '../contexts/AuthContext';

const {Title} = Typography;

export function Login() {
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);
    const {user, login} = useContext(AuthContext);

    const formik = useFormik({
        initialValues: {
            username: '',
            password: '',
        },
        onSubmit: async (values, {setSubmitting}) => {
            setError(null); // reset previous error
            setSubmitting(true);
            try {
                const {username, password} = values;
                const res = await login(username, password);

                if (res?.error || res?.data?.detail) {
                    setError(res.data?.detail || 'Invalid username or password');
                } else {
                    navigate('/');
                }
            } catch (err) {
                console.error('Login error:', err);
                setError('Something went wrong. Please try again later.');
            } finally {
                setSubmitting(false);
            }
        },
    });

    useEffect(() => {
        if (user) {
            navigate('/');
        }
    }, [user, navigate]);

    return (
        <Row justify="center" align="middle" style={{minHeight: '60vh'}}>
            <Col xs={22} sm={16} md={10} lg={8}>
                <Card bordered className="shadow-md">
                    <Title level={2} className="text-center">
                        Rapidconsult
                    </Title>

                    {error && (
                        <Alert
                            message="Login Failed"
                            description={error}
                            type="error"
                            showIcon
                            style={{marginBottom: 16}}
                        />
                    )}

                    <Form layout="vertical" onFinish={formik.handleSubmit}>
                        <Form.Item
                            label="Username"
                            required
                            validateStatus={error ? 'error' : ''}
                        >
                            <Input
                                name="username"
                                value={formik.values.username}
                                onChange={formik.handleChange}
                                placeholder="Enter your username"
                                disabled={formik.isSubmitting}
                            />
                        </Form.Item>

                        <Form.Item
                            label="Password"
                            required
                            validateStatus={error ? 'error' : ''}
                        >
                            <Input.Password
                                name="password"
                                value={formik.values.password}
                                onChange={formik.handleChange}
                                placeholder="Enter your password"
                                disabled={formik.isSubmitting}
                            />
                        </Form.Item>

                        <Form.Item>
                            <Button
                                type="primary"
                                htmlType="submit"
                                block
                                loading={formik.isSubmitting}
                            >
                                {formik.isSubmitting ? 'Signing in...' : 'Sign in'}
                            </Button>
                        </Form.Item>
                    </Form>
                </Card>
            </Col>
        </Row>
    );
}
