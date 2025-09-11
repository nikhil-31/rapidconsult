// components/ContactForm.tsx
import React, {useState} from 'react';

interface Contact {
    id?: number;
    label: string;
    type: string;
    number: string;
    primary: boolean;
}

interface Props {
    initialData?: Contact;
    onSubmit: (contact: Contact) => void;
    onCancel: () => void;
}

const ContactForm = ({initialData, onSubmit, onCancel}: Props) => {
    const [formData, setFormData] = useState<Contact>(
        initialData || {
            label: '',
            type: 'mobile',
            number: '',
            // country_code: '+91',
            primary: false,
        }
    );
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const {name, value, type} = e.target;

        const checked = (e.target instanceof HTMLInputElement && type === "checkbox") ? e.target.checked : undefined;

        const fieldValue = type === "checkbox" ? checked : value;

        setFormData(prev => ({
            ...prev,
            [name]: fieldValue,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded bg-gray-50">
            <div className="flex flex-col">
                <label>Label</label>
                <input name="label" value={formData.label} onChange={handleChange} className="input"/>
            </div>
            <div className="flex flex-col">
                <label>Type</label>
                <select name="type" value={formData.type} onChange={handleChange} className="input">
                    <option value="mobile">Mobile</option>
                    <option value="home">Home</option>
                    <option value="work">Work</option>
                    <option value="fax">Fax</option>
                    <option value="other">Other</option>
                </select>
            </div>
            <div className="flex flex-col">
                <label>Number</label>
                <input name="number" value={formData.number} onChange={handleChange} className="input"/>
            </div>
            <div className="flex items-center gap-2">
                <input type="checkbox" name="primary" checked={formData.primary} onChange={handleChange}/>
                <label>Primary</label>
            </div>
            <div className="flex gap-4">
                <button type="submit" className="bg-blue-600 text-white px-4 py-1 rounded">Save</button>
                <button type="button" onClick={onCancel} className="text-gray-600">Cancel</button>
            </div>
        </form>
    );
};

export default ContactForm;
