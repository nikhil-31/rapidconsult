import React, {useState, useEffect, ChangeEvent, FormEvent, useContext} from 'react';
import axios from 'axios';
import {OrganizationProfile} from "../models/OrganizationProfile";
import {AuthContext} from "../contexts/AuthContext";
import {Location} from "../models/Location";

interface CreateLocationModalProps {
    selectedOrgId: string;
    orgs: OrganizationProfile[];
    onSuccess: () => void;
    onClose: () => void;
    editingLocation?: Location | null;
}

export default function CreateLocationModal({
                                                selectedOrgId,
                                                orgs,
                                                onSuccess,
                                                onClose,
                                                editingLocation = null,
                                            }: CreateLocationModalProps) {
    const {user} = useContext(AuthContext);
    const [form, setForm] = useState({
        name: '',
        address_1: '',
        address_2: '',
        city: '',
        state: '',
        zip_code: '',
        lat: '',
        lon: '',
        label: '',
    });
    const [displayPicture, setDisplayPicture] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    const apiUrl = process.env.REACT_APP_API_URL;
    const isEditMode = Boolean(editingLocation);

    useEffect(() => {
        if (editingLocation) {
            setForm({
                name: editingLocation.name || '',
                address_1: editingLocation.address?.address_1 || '',
                address_2: editingLocation.address?.address_2 || '',
                city: editingLocation.address?.city || '',
                state: editingLocation.address?.state || '',
                zip_code: editingLocation.address?.zip_code || '',
                lat: editingLocation.address?.lat.toString() || '',
                lon: editingLocation.address?.lon.toString() || '',
                label: editingLocation.address?.label || '',
            });
        }
    }, [editingLocation]);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const {name, value} = e.target;
        setForm(prev => ({...prev, [name]: value}));
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setDisplayPicture(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData();
        formData.append('name', form.name);
        formData.append('organization', selectedOrgId);
        if (displayPicture) {
            formData.append('display_picture', displayPicture);
        }
        formData.append('address.address_1', form.address_1);
        formData.append('address.address_2', form.address_2);
        formData.append('address.city', form.city);
        formData.append('address.state', form.state);
        formData.append('address.zip_code', form.zip_code);
        formData.append('address.lat', form.lat);
        formData.append('address.lon', form.lon);
        formData.append('address.label', form.label);

        try {
            if (isEditMode && editingLocation) {
                await axios.patch(`${apiUrl}/api/locations/${editingLocation.id}/`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Token ${user?.token}`,
                    },
                });
            } else {
                await axios.post(`${apiUrl}/api/locations/`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Token ${user?.token}`,
                    },
                });
            }
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error saving location', error);
            alert('Failed to save location');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-lg relative max-h-[90vh] overflow-hidden">
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-gray-500 hover:text-black z-10"
                >
                    ✖
                </button>
                <div className="overflow-y-auto p-6 space-y-4 max-h-[calc(90vh-3rem)]">
                    <h3 className="text-xl font-semibold">{isEditMode ? 'Edit Location' : 'Create New Location'}</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <h3 className="font-semibold">Organization</h3>
                        <select
                            name="organisation"
                            value={selectedOrgId}
                            className="border w-full p-2 rounded bg-gray-100"
                            disabled
                        >
                            {orgs.map((op) => (
                                <option key={op.organization_id} value={op.organization_id}>
                                    {op.organization_name}
                                </option>
                            ))}
                        </select>

                        <h3 className="font-semibold">Location</h3>
                        <input
                            name="name"
                            placeholder="Location Name"
                            value={form.name}
                            onChange={handleChange}
                            required
                            className="border w-full p-2 rounded"
                        />
                        <p className="font-medium mb-1">Display Picture</p>
                        <input
                            type="file"
                            onChange={handleFileChange}
                            className="border w-full p-2 rounded"
                        />

                        <h3 className="font-semibold">Address</h3>
                        <input name="address_1" placeholder="Address Line 1" value={form.address_1}
                               onChange={handleChange} className="border w-full p-2 rounded"/>
                        <input name="address_2" placeholder="Address Line 2" value={form.address_2}
                               onChange={handleChange} className="border w-full p-2 rounded"/>
                        <input name="city" placeholder="City" value={form.city} onChange={handleChange}
                               className="border w-full p-2 rounded"/>
                        <input name="state" placeholder="State" value={form.state} onChange={handleChange}
                               className="border w-full p-2 rounded"/>
                        <input name="zip_code" placeholder="Zip Code" value={form.zip_code} onChange={handleChange}
                               className="border w-full p-2 rounded"/>
                        <input name="lat" placeholder="Latitude" value={form.lat} onChange={handleChange}
                               className="border w-full p-2 rounded"/>
                        <input name="lon" placeholder="Longitude" value={form.lon} onChange={handleChange}
                               className="border w-full p-2 rounded"/>
                        <input name="label" placeholder="Label (e.g. HQ)" value={form.label} onChange={handleChange}
                               className="border w-full p-2 rounded"/>

                        <button
                            type="submit"
                            className="bg-blue-600 text-white px-4 py-2 rounded w-full"
                            disabled={loading}
                        >
                            {loading ? (isEditMode ? 'Saving...' : 'Creating...') : isEditMode ? 'Save Changes' : 'Create Location'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
