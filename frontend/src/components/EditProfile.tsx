// pages/EditProfile.tsx
import React, {useContext, useEffect, useState} from 'react';
import axios from 'axios';
import {AuthContext} from "../contexts/AuthContext";
import {useNavigate} from 'react-router-dom';
import {ProfileData} from "../models/ProfileData";
import {Contact} from "../models/Contact";

interface FormErrors {
    name?: string;
    username?: string;
    email?: string;
    profile_picture?: string;
    general?: string;

    [key: string]: string | undefined;
}

const EditProfile = () => {
    const [profile, setProfile] = useState<ProfileData>({
        name: '',
        username: '',
        email: '',
        contacts: [],
        organizations: []
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [errors, setErrors] = useState<FormErrors>({});

    // Contact modal states
    const [showContactModal, setShowContactModal] = useState(false);
    const [editingContact, setEditingContact] = useState<Contact | null>(null);
    const [contactForm, setContactForm] = useState({
        label: '',
        type: 'mobile',
        // country_code: '+91',
        number: '',
        primary: false
    });

    const apiUrl = process.env.REACT_APP_API_URL;
    const {user} = useContext(AuthContext);
    const navigate = useNavigate();

    const fetchProfile = async () => {
        try {
            const res = await axios.get(`${apiUrl}/api/profile/me/`, {
                headers: {Authorization: `Token ${user?.token}`}
            });
            const profileData = res.data; // Get first profile from array
            setProfile({
                id: profileData.id,
                name: profileData.name || '',
                username: profileData.username || '',
                email: profileData.email || '',
                contacts: profileData.contacts || [],
                organizations: profileData.organizations || []
            });
            if (profileData.profile_picture) {
                setPreviewUrl(profileData.profile_picture);
            }
            setLoading(false);
        } catch (err) {
            console.error('Failed to load profile', err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const {name, value} = e.target;
        setProfile((prev: ProfileData) => ({
            ...prev,
            [name]: value
        }));
        // Clear error for this field when user starts typing
        if (errors[name]) {
            setErrors((prev: FormErrors) => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                setErrors((prev: FormErrors) => ({
                    ...prev,
                    profile_picture: 'Please select a valid image file'
                }));
                return;
            }

            // Validate file size (5MB limit)
            if (file.size > 5 * 1024 * 1024) {
                setErrors((prev: FormErrors) => ({
                    ...prev,
                    profile_picture: 'File size must be less than 5MB'
                }));
                return;
            }

            setSelectedFile(file);
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);

            // Clear any previous errors
            setErrors((prev: FormErrors) => ({
                ...prev,
                profile_picture: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors: FormErrors = {};

        if (!profile.name.trim()) {
            newErrors.name = 'Name is required';
        }

        if (!profile.username.trim()) {
            newErrors.username = 'Username is required';
        }

        if (!profile.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(profile.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setSaving(true);

        try {
            // Create FormData for file upload
            const formData = new FormData();
            formData.append('name', profile.name);
            // formData.append('username', profile.username);
            formData.append('email', profile.email);

            if (selectedFile) {
                formData.append('profile_picture', selectedFile);
            }

            await axios.patch(
                `${apiUrl}/api/profile/me/`, formData,
                {
                    headers: {
                        Authorization: `Token ${user?.token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                })
                .then(res => console.log('Profile updated successfully', res.data))
                .catch(error => console.log(error));

            navigate('/profile');
        } catch (err: any) {
            console.error('Failed to update profile', err);
            if (err.response?.data) {
                setErrors(err.response.data);
            } else {
                setErrors({general: 'Failed to update profile. Please try again.'});
            }
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        navigate('/profile');
    };

    // Contact management functions
    const openContactModal = (contact?: Contact) => {
        if (contact) {
            setEditingContact(contact);
            setContactForm({
                label: contact.label,
                type: contact.type,
                // country_code: contact.country_code || '+91',
                number: contact.number,
                primary: contact.primary
            });
        } else {
            setEditingContact(null);
            setContactForm({
                label: '',
                type: 'mobile',
                // country_code: '+91',
                number: '',
                primary: false
            });
        }
        setShowContactModal(true);
    };

    const closeContactModal = () => {
        setShowContactModal(false);
        setEditingContact(null);
        setContactForm({
            label: '',
            type: 'mobile',
            // country_code: '+91',
            number: '',
            primary: false
        });
    };

    const handleContactFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const {name, value, type, checked} = e.target as HTMLInputElement;
        setContactForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleContactSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const contactData = {
                label: contactForm.label,
                type: contactForm.type,
                // country_code: contactForm.country_code,
                number: contactForm.number,
                primary: contactForm.primary
            };

            if (editingContact) {
                // Update existing contact
                await axios.put(`${apiUrl}/api/contacts/${editingContact.id}/`, contactData, {
                    headers: {Authorization: `Token ${user?.token}`}
                });
            } else {
                // Create new contact
                await axios.post(`${apiUrl}/api/contacts/`, contactData, {
                    headers: {Authorization: `Token ${user?.token}`}
                });
            }

            // Refresh profile data to get updated contacts
            await fetchProfile();
            closeContactModal();
        } catch (err) {
            console.error('Failed to save contact', err);
        }
    };

    const handleDeleteContact = async (contactId: number) => {
        if (!window.confirm('Are you sure you want to delete this contact?')) {
            return;
        }

        try {
            await axios.delete(`${apiUrl}/api/contacts/${contactId}/`, {
                headers: {Authorization: `Token ${user?.token}`}
            });

            // Refresh profile data to get updated contacts
            await fetchProfile();
        } catch (err) {
            console.error('Failed to delete contact', err);
        }
    };

    // Get primary contact for display
    const primaryContact = profile.contacts.find(contact => contact.primary);
    const primaryPhone = primaryContact ? `${primaryContact.number}` : '';

    if (loading) {
        return (
            <div className="max-w-2xl mx-auto p-6">
                <div className="flex justify-center items-center h-64">
                    <div className="text-lg">Loading profile...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold mb-2">Edit Profile</h1>
                <p className="text-gray-600">Update your profile information</p>
            </div>

            {errors.general && (
                <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                    {errors.general}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Profile Picture */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Profile Picture
                    </label>
                    <div className="flex items-center space-x-4">
                        <img
                            src={previewUrl || "/doctor-default.png"}
                            alt="Profile preview"
                            className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                        />
                        <div>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                PNG, JPG, GIF up to 5MB
                            </p>
                        </div>
                    </div>
                    {errors.profile_picture && (
                        <p className="text-red-600 text-sm mt-1">{errors.profile_picture}</p>
                    )}
                </div>

                {/* Name */}
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name *
                    </label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={profile.name}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
                            errors.name ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter your full name"
                    />
                    {errors.name && (
                        <p className="text-red-600 text-sm mt-1">{errors.name}</p>
                    )}
                </div>

                {/* Username */}
                {/*<div>*/}
                {/*    <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">*/}
                {/*        Username **/}
                {/*    </label>*/}
                {/*    <input*/}
                {/*        type="text"*/}
                {/*        id="username"*/}
                {/*        name="username"*/}
                {/*        value={profile.username}*/}
                {/*        onChange={handleInputChange}*/}
                {/*        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${*/}
                {/*            errors.username ? 'border-red-500' : 'border-gray-300'*/}
                {/*        }`}*/}
                {/*        placeholder="Enter your username"*/}
                {/*    />*/}
                {/*    {errors.username && (*/}
                {/*        <p className="text-red-600 text-sm mt-1">{errors.username}</p>*/}
                {/*    )}*/}
                {/*</div>*/}

                {/* Email */}
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address *
                    </label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={profile.email}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
                            errors.email ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter your email address"
                    />
                    {errors.email && (
                        <p className="text-red-600 text-sm mt-1">{errors.email}</p>
                    )}
                </div>


                {/* Contact Information Management */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-medium text-gray-700">Contact Information</h3>
                        <button
                            type="button"
                            onClick={() => openContactModal()}
                            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                        >
                            + Add Contact
                        </button>
                    </div>

                    {profile.contacts.length > 0 ? (
                        <div className="bg-gray-50 p-4 rounded-md">
                            <div className="space-y-3">
                                {profile.contacts.map((contact) => (
                                    <div key={contact.id}
                                         className="flex items-center justify-between bg-white p-3 rounded border">
                                        <div>
                                            <div className="font-medium text-sm">
                                                {contact.label || contact.type}
                                                {contact.primary && (
                                                    <span
                                                        className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                                                        Primary
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                {contact.number}
                                            </div>
                                            <div className="text-xs text-gray-500 capitalize">{contact.type}</div>
                                        </div>
                                        <div className="flex space-x-2">
                                            <button
                                                type="button"
                                                onClick={() => openContactModal(contact)}
                                                className="text-blue-600 hover:text-blue-800 text-sm"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteContact(contact.id)}
                                                className="text-red-600 hover:text-red-800 text-sm"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-gray-50 p-4 rounded-md text-center">
                            <p className="text-gray-500 text-sm">No contacts added yet.</p>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4 pt-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className={`px-6 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 ${
                            saving ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="px-6 py-2 bg-gray-300 text-gray-700 font-semibold rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                        Cancel
                    </button>
                </div>
            </form>

            {/* Contact Modal */}
            {showContactModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                        <h3 className="text-lg font-semibold mb-4">
                            {editingContact ? 'Edit Contact' : 'Add New Contact'}
                        </h3>

                        <form onSubmit={handleContactSubmit} className="space-y-4">
                            {/* Label */}
                            <div>
                                <label htmlFor="contact-label" className="block text-sm font-medium text-gray-700 mb-1">
                                    Label
                                </label>
                                <input
                                    type="text"
                                    id="contact-label"
                                    name="label"
                                    value={contactForm.label}
                                    onChange={handleContactFormChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                                    placeholder="e.g., Mobile, Work, Home"
                                    required
                                />
                            </div>

                            {/* Type */}
                            <div>
                                <label htmlFor="contact-type" className="block text-sm font-medium text-gray-700 mb-1">
                                    Type
                                </label>
                                <select
                                    id="contact-type"
                                    name="type"
                                    value={contactForm.type}
                                    onChange={handleContactFormChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                                >
                                    <option value="mobile">Mobile</option>
                                    <option value="home">Home</option>
                                    <option value="work">Work</option>
                                    <option value="other">Other</option>
                                    <option value="email">Email</option>
                                </select>
                            </div>

                            {/* Country Code and Number */}
                            {/*<div className="grid grid-cols-3 gap-2">*/}
                            {/*<div>*/}
                            {/*    <label htmlFor="country-code"*/}
                            {/*           className="block text-sm font-medium text-gray-700 mb-1">*/}
                            {/*        Country Code*/}
                            {/*    </label>*/}
                            {/*    <select*/}
                            {/*        id="country-code"*/}
                            {/*        name="country_code"*/}
                            {/*        value={contactForm.country_code}*/}
                            {/*        onChange={handleContactFormChange}*/}
                            {/*        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"*/}
                            {/*    >*/}
                            {/*        <option value="+91">+91 (India)</option>*/}
                            {/*        <option value="+1">+1 (US)</option>*/}
                            {/*        <option value="+44">+44 (UK)</option>*/}
                            {/*        <option value="+61">+61 (Australia)</option>*/}
                            {/*        <option value="">None</option>*/}
                            {/*    </select>*/}
                            {/*</div>*/}
                            <div className="col-span-2">
                                <label htmlFor="contact-number"
                                       className="block text-sm font-medium text-gray-700 mb-1">
                                    Number/contact
                                </label>
                                <input
                                    type="tel"
                                    id="contact-number"
                                    name="number"
                                    value={contactForm.number}
                                    onChange={handleContactFormChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                                    placeholder="Enter phone/contact"
                                    required
                                />
                            </div>
                            {/*</div>*/}

                            {/* Primary */}
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="contact-primary"
                                    name="primary"
                                    checked={contactForm.primary}
                                    onChange={handleContactFormChange}
                                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                />
                                <label htmlFor="contact-primary" className="ml-2 block text-sm text-gray-700">
                                    Set as primary contact
                                </label>
                            </div>

                            {/* Modal Actions */}
                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={closeContactModal}
                                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                                >
                                    {editingContact ? 'Update Contact' : 'Add Contact'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EditProfile;
