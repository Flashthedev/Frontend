import React, { useEffect, useState } from 'react';
import styles from '../styles/Home.module.css';
import Head from 'next/head';
import API, { sendPasswordReset, APIError, register as registerUser } from '../api';
import { Button, Dropdown, Menu, Modal, Tabs, Form, Input, notification } from 'antd';
import { CheckOutlined, DownOutlined, LockOutlined, MailOutlined, UserOutlined } from '@ant-design/icons';
import { SiDiscord } from 'react-icons/si';
import { useRouter } from 'next/router';
import { useUser } from '../components/user';

const { useForm } = Form;
const { TabPane } = Tabs;

export default function Index({ code }) {
    const initialState = {
        showModal: false,
        resetPasswordModal: false,
        username: '',
        password: '',
        email: '',
        invite: '',
    };

    const [{
        showModal,
        resetPasswordModal,
        username,
        password,
        email,
        invite,
    }, setState] = useState(initialState);
    const router = useRouter();
    const [form] = useForm();
    const [passwordResetForm] = useForm();
    const { user, setUser } = useUser();

    useEffect(() => {
        if (user) {
            router.push('/dashboard');
        } else if (code) {
            setState((state) => ({ ...state, invite: code, showModal: true }));
        }
    }, []);

    const menu = (
        <Menu>
            <Menu.Item>
                <a target="blank" href="/">
                    Admin
                </a>
            </Menu.Item>
        </Menu>
    );

    const closeModal = () => {
        form.resetFields();
        passwordResetForm.resetFields();

        setState(() => ({
            ...initialState,
            showModal: false,
            resetPasswordModal: false,
        }));
    };

    const resetForms = () => {
        form.resetFields();

        setState(() => ({
            ...initialState,
            showModal: true,
        }));
    };

    const setInput = (property: string, val: string) => {
        setState((state) => ({
            ...state, [property]: val,
        }));
    };

    const filter = (value: any) => {
        return value.filter((v: any, i: any) => value.indexOf(v) === i);
    };

    const refreshToken = async () => {
        try {
            const api = new API();
            const data = await api.refreshToken();
            const { images, storageUsed } = await api.getImages();
            const { invites } = await api.getInvites();
            const { domains } = await api.getDomains();
            const { urls } = await api.getShortenedUrls();

            data.user['domains'] = domains;
            data.user['images'] = images;
            data.user['storageUsed'] = storageUsed;
            data.user['createdInvites'] = invites;
            data.user['shortenedUrls'] = urls;
            data.user['accessToken'] = data.accessToken;
            data.user['api'] = api;

            setUser(data.user);

            setTimeout(() => {
                refreshToken();
            }, 780000);
        } catch (err) {
        }
    };

    const login = async () => {
        try {
            await form.validateFields(
                [
                    'username',
                    'password',
                ]
            );

            const api = new API();
            const data = await api.login(username, password);
            const { images, storageUsed } = await api.getImages();
            const { invites } = await api.getInvites();
            const { domains } = await api.getDomains();
            const { urls } = await api.getShortenedUrls();

            if (data.success) {
                delete data.success;

                data.user['domains'] = domains;
                data.user['images'] = images;
                data.user['createdInvites'] = invites;
                data.user['storageUsed'] = storageUsed;
                data.user['shortenedUrls'] = urls;
                data.user['api'] = api;

                setUser(data.user);

                setTimeout(() => {
                    refreshToken();
                }, 780000);

                router.push('/dashboard');
            }
        } catch (err) {
            if (err instanceof APIError) return notification.error({
                message: 'Something went wrong',
                description: err.message,
            });

            notification.error({
                message: 'Provide the required fields',
                description: filter(err.errorFields.map((e: any) => e.errors.join())).join(', ') + '.',
            });
        }
    };

    const register = async () => {
        try {
            await form.validateFields();
            const data = await registerUser(username, password, email, invite);

            if (data.success) notification.success({
                message: 'Success',
                description: 'Registered successfully, check your email to verify.',
            });
        } catch (err) {
            if (err instanceof APIError) return notification.error({
                message: 'Something went wrong',
                description: err.message,
            });

            notification.error({
                message: 'Provide the required fields',
                description: filter(err.errorFields.map((e: any) => e.errors.join())).join(', ') + '.',
            });
        }
    };

    const resetPassword = async () => {
        try {
            await passwordResetForm.validateFields();
            const data = await sendPasswordReset(email);

            if (data.success) notification.success({
                message: 'Success',
                description: 'If a user exist with that email we\'ll send over the password reset instructions.',
            });
        } catch (err) {
            if (err instanceof APIError) return notification.error({
                message: 'Something went wrong',
                description: err.message,
            });

            notification.error({
                message: 'Provide the required fields',
                description: filter(err.errorFields.map((e: any) => e.errors.join())).join(', ') + '.',
            });
        }
    };

    if (user) return null;

    return (
        <div className={styles.container}>
            <Head>
                <title>Astral</title>
                <meta name="og:title" content="Astral, private file host."/>
                <meta name="og:description" content="Astral is a simple and powerful file hosting platform, with great support, competent developers, and a welcoming community."/>
                <meta name="theme-color" content="#e6394a" />
            </Head>

            <main className={styles.main}>
                <img src="/logo.png" height="95px" />

                <div style={{ marginTop: '8px' }}>
                    <Button
                        shape="round"
                        style={{ marginRight: '5px', borderRadius: '13px', height: '35px' }}
                        onClick={() => setState((state) => ({ ...state, showModal: true }))}
                    >
                        Login/Register
                    </Button>

                    <Dropdown overlay={menu}>
                        <Button
                            style={{ marginRight: '5px', borderRadius: '13px', height: '35px' }}
                            shape="round"
                        >
                            More Stuff <DownOutlined />
                        </Button>
                    </Dropdown>
                </div>

                <Modal
                    centered
                    className="authModal"
                    visible={showModal}
                    onCancel={closeModal}
                    footer={null}
                    title={
                        <Tabs
                            centered
                            defaultActiveKey={code ? '2' : '1'}
                            type="card"
                            onTabClick={resetForms}
                        >
                            <TabPane tab="Login" key="1">
                                <Form
                                    form={form}
                                    name="login"
                                    style={{ marginTop: '10px' }}
                                >
                                    <Form.Item
                                        name="username"
                                        rules={[
                                            {
                                                required: true,
                                                message: 'Provide a valid username',
                                                min: 3,
                                            },
                                        ]}
                                    >
                                        <Input
                                            size="large"
                                            onPressEnter={login}
                                            placeholder="Username"
                                            prefix={<UserOutlined />}
                                            onChange={(val) => setInput('username', val.target.value)}
                                        />
                                    </Form.Item>

                                    <Form.Item
                                        name="password"
                                        rules={[
                                            {
                                                required: true,
                                                message: 'Provide a valid password',
                                                min: 5,
                                            },
                                        ]}
                                    >
                                        <Input.Password
                                            size="large"
                                            onPressEnter={login}
                                            placeholder="Password"
                                            prefix={<LockOutlined />}
                                            onChange={(val) => setInput('password', val.target.value)}
                                        />
                                    </Form.Item>

                                    <Form.Item>
                                        <Button
                                            type="link"
                                            className={styles.forgotPassword}
                                            onClick={() => setState((state) => ({ ...state, showModal: false, resetPasswordModal: true }))}
                                        >
                                            Forgot your password? Reset
                                        </Button>

                                        <Button
                                            block
                                            size="large"
                                            onClick={login}
                                        >
                                            Login
                                        </Button>

                                        <Button
                                            href={`${process.env.BACKEND_URL}/auth/discord/login`}
                                            icon={<SiDiscord style={{ marginRight: '8px' }} />}
                                            type="primary"
                                            block
                                            size="large"
                                            style={{
                                                marginTop: '10px',
                                                marginBottom: '-35px',
                                                backgroundColor: '#7289DA',
                                                border: 'none',
                                            }}
                                        >
                                            Login with Discord
                                        </Button>
                                    </Form.Item>
                                </Form>
                            </TabPane>

                            <TabPane tab="Register" key="2">
                                <Form
                                    form={form}
                                    name="login"
                                    style={{ marginTop: '10px' }}
                                >
                                    <Form.Item
                                        name="username"
                                        rules={[
                                            {
                                                required: true,
                                                message: 'Provide a valid username',
                                                min: 3,
                                            },
                                        ]}
                                    >
                                        <Input
                                            size="large"
                                            placeholder="Username"
                                            onPressEnter={register}
                                            prefix={<UserOutlined />}
                                            onChange={(val) => setInput('username', val.target.value)}
                                        />
                                    </Form.Item>

                                    <Form.Item
                                        name="password"
                                        rules={[
                                            {
                                                required: true,
                                                message: 'Provide a valid password',
                                                min: 5,
                                            },
                                        ]}
                                    >
                                        <Input.Password
                                            size="large"
                                            placeholder="Password"
                                            onPressEnter={register}
                                            prefix={<LockOutlined />}
                                            onChange={(val) => setInput('password', val.target.value)}
                                        />
                                    </Form.Item>

                                    <Form.Item
                                        name="email"
                                        rules={[
                                            {
                                                required: true,
                                                message: 'Provide a valid email',
                                                type: 'email',
                                            },
                                        ]}
                                    >
                                        <Input
                                            size="large"
                                            placeholder="Email"
                                            onPressEnter={register}
                                            prefix={<MailOutlined />}
                                            onChange={(val) => setInput('email', val.target.value)}
                                        />
                                    </Form.Item>

                                    <Form.Item
                                        name="invite"
                                        rules={[
                                            { required: true, message: 'Provide a valid invite' },
                                        ]}
                                        initialValue={invite ? invite : ''}
                                    >
                                        <Input
                                            size="large"
                                            placeholder="Invite"
                                            onPressEnter={register}
                                            prefix={<CheckOutlined />}
                                            onChange={(val) => setInput('invite', val.target.value)}
                                        />
                                    </Form.Item>

                                    <Form.Item>
                                        <Button
                                            block
                                            size="large"
                                            onClick={register}
                                            style={{ marginBottom: '-30px' }}
                                        >
                                            Register
                                        </Button>
                                    </Form.Item>
                                </Form>
                            </TabPane>
                        </Tabs>
                    }
                />

                <Modal
                    centered
                    title="Reset your password"
                    visible={resetPasswordModal}
                    onCancel={closeModal}
                    footer={null}
                >
                    <Form
                        form={passwordResetForm}
                    >
                        <Form.Item
                            name="email"
                            rules={[
                                {
                                    required: true,
                                    message: 'Provide a valid email',
                                    type: 'email',
                                },
                            ]}
                        >
                            <Input
                                size="large"
                                placeholder="Email"
                                onPressEnter={resetPassword}
                                prefix={<MailOutlined />}
                                onChange={(val) => setInput('email', val.target.value)}
                            />
                        </Form.Item>

                        <Form.Item
                            style={{ marginBottom: '5px' }}>
                            <Button
                                block
                                size="large"
                                onClick={resetPassword}
                            >
                                Reset Password
                            </Button>
                        </Form.Item>
                    </Form>
                </Modal>
            </main>
        </div>
    );
}

export async function getServerSideProps({ query }) {
    const { code } = query;

    return {
        props: {
            code: code ? code : null,
        },
    };
}
