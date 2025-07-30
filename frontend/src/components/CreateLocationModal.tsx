import {useState, ChangeEvent, FormEvent} from 'react';
import axios from 'axios';

interface CreateLocationModalProps {
    organizationId: string;
    organizationName?: string; // optional
    token: string;
    onClose: () => void;
    onSuccess: () => void;
}

export default function CreateLocationModal({
                                                organizationId,
                                                organizationName,
                                                token,
                                                onClose,
                                                onSuccess,
                                            }: CreateLocationModalProps) {
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
        formData.append('organization', organizationId);
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
            await axios.post(`${apiUrl}/api/locations/`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Token ${token}`,
                },
            });
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error creating location', error);
            alert('Failed to create location');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg relative">
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-gray-500 hover:text-black"
                >
                    ✖
                </button>
                <h3 className="text-xl font-semibold mb-4">Create New Location</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <h3 className="font-semibold">Organization</h3>
                    <input
                        name="organization_display"
                        value={organizationName || `Org ID: ${organizationId}`}
                        disabled
                        className="border w-full p-2 rounded bg-gray-100 text-gray-700"
                    />
                    <h3 className="font-semibold">Location</h3>
                    <input name="name" placeholder="Location Name" onChange={handleChange} required
                           className="border w-full p-2 rounded"/>
                    <input name="address_1" placeholder="Address Line 1" onChange={handleChange}
                           className="border w-full p-2 rounded"/>
                    <input name="address_2" placeholder="Address Line 2" onChange={handleChange}
                           className="border w-full p-2 rounded"/>
                    <input name="city" placeholder="City" onChange={handleChange}
                           className="border w-full p-2 rounded"/>
                    <input name="state" placeholder="State" onChange={handleChange}
                           className="border w-full p-2 rounded"/>
                    <input name="zip_code" placeholder="Zip Code" onChange={handleChange}
                           className="border w-full p-2 rounded"/>
                    <input name="lat" placeholder="Latitude" onChange={handleChange}
                           className="border w-full p-2 rounded"/>
                    <input name="lon" placeholder="Longitude" onChange={handleChange}
                           className="border w-full p-2 rounded"/>
                    <input name="label" placeholder="Label (e.g. HQ)" onChange={handleChange}
                           className="border w-full p-2 rounded"/>
                    <input type="file" onChange={handleFileChange} className="border w-full p-2 rounded"/>

                    <button
                        type="submit"
                        className="bg-blue-600 text-white px-4 py-2 rounded w-full"
                        disabled={loading}
                    >
                        {loading ? 'Creating...' : 'Create Location'}
                    </button>
                </form>
            </div>
        </div>
    );
}
