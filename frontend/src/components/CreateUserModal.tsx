import React from 'react';

interface Org {
    organization_id: number;
    organization_name: string;
}

interface Role {
    id: number;
    name: string;
}

interface CreateUserModalProps {
    form: any;
    selectedOrgId: string;
    orgs: Org[];
    roles: Role[];
    show: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({
                                                             form,
                                                             selectedOrgId,
                                                             orgs,
                                                             roles,
                                                             show,
                                                             onClose,
                                                             onSubmit,
                                                             onChange,
                                                         }) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg relative">
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-gray-500 hover:text-black"
                >
                    ✖
                </button>
                <h3 className="text-xl font-semibold mb-4">Create New User</h3>
                <form onSubmit={onSubmit} className="space-y-4">
                    <h2 className="font-semibold">User details</h2>
                    <input
                        name="username"
                        placeholder="Username"
                        value={form.username}
                        onChange={onChange}
                        className="border w-full p-2 rounded"
                        required
                    />
                    <input
                        name="email"
                        type="email"
                        placeholder="Email"
                        value={form.email}
                        onChange={onChange}
                        className="border w-full p-2 rounded"
                        required
                    />
                    <input
                        name="password"
                        type="password"
                        placeholder="Password"
                        value={form.password}
                        onChange={onChange}
                        className="border w-full p-2 rounded"
                        required
                    />
                    <input
                        name="name"
                        placeholder="Full Name"
                        value={form.name}
                        onChange={onChange}
                        className="border w-full p-2 rounded"
                    />
                    <input
                        name="profile_picture"
                        type="file"
                        onChange={onChange}
                        className="border w-full p-2 rounded"
                    />
                    <h2 className="font-semibold">Org details</h2>
                    <select
                        name="organisation"
                        value={selectedOrgId}
                        className="border w-full p-2 rounded bg-gray-100"
                        disabled
                    >
                        <option value="">Select Organization</option>
                        {orgs.map((op) => (
                            <option key={op.organization_id} value={op.organization_id}>
                                {op.organization_name}
                            </option>
                        ))}
                    </select>
                    <select
                        name="role"
                        value={form.org_profile.role}
                        onChange={onChange}
                        className="border w-full p-2 rounded"
                        required
                    >
                        <option value="">Select Role</option>
                        {roles.map((role) => (
                            <option key={role.id} value={role.id}>
                                {role.name}
                            </option>
                        ))}
                    </select>
                    <input
                        name="job_title"
                        placeholder="Job Title"
                        value={form.org_profile.job_title}
                        onChange={onChange}
                        className="border w-full p-2 rounded"
                    />
                    <button
                        type="submit"
                        className="bg-blue-600 text-white px-4 py-2 rounded w-full"
                    >
                        Submit
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CreateUserModal;
