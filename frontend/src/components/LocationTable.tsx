import {Location} from '../models/Location';
import {Pencil, Trash2} from 'lucide-react';

interface LocationTableProps {
    locations: Location[];
    selectedOrgId: string;
    onCreateLocation: () => void;
    onEditLocation: (location: Location) => void;
    onDeleteLocation: (location: Location) => void;
}

export default function LocationTable({
                                          locations,
                                          selectedOrgId,
                                          onCreateLocation,
                                          onEditLocation,
                                          onDeleteLocation,
                                      }: LocationTableProps) {
    if (!locations.length) return null;

    return (
        <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
                <label className="mr-2 font-medium">Locations:</label>
                <button
                    className="bg-red-600 text-white px-4 py-2 rounded"
                    onClick={() => {
                        if (!selectedOrgId) {
                            alert('Please select an organization first.');
                            return;
                        }
                        onCreateLocation();
                    }}
                >
                    Create Location
                </button>
            </div>

            <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                    <tr>
                        <th className="px-4 py-2 text-left">Name</th>
                        <th className="px-4 py-2 text-left">Address</th>
                        <th className="px-4 py-2 text-left">Picture</th>
                        <th className="px-4 py-2 text-left">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {locations.map((loc) => (
                        <tr key={loc.id}>
                            <td className="px-4 py-2">{loc.name}</td>
                            <td className="px-4 py-2">
                                {loc.address ? (
                                    <>
                                        {loc.address.label && `${loc.address.label}, `}
                                        {loc.address.address_1 && `${loc.address.address_1}, `}
                                        {loc.address.address_2 && `${loc.address.address_2}, `}
                                        {loc.address.city && `${loc.address.city}, `}
                                        {loc.address.state && `${loc.address.state}`}
                                        {loc.address.zip_code && ` - ${loc.address.zip_code}`}
                                    </>
                                ) : (
                                    '—'
                                )}
                            </td>
                            <td className="px-4 py-2">
                                {loc.display_picture ? (
                                    <img
                                        src={loc.display_picture}
                                        alt="Location"
                                        className="w-10 h-10 rounded-full object-cover"
                                    />
                                ) : (
                                    '—'
                                )}
                            </td>
                            <td className="px-4 py-2 flex items-center gap-2">
                                <button
                                    onClick={() => onEditLocation(loc)}
                                    className="text-blue-600 hover:text-blue-800"
                                    title="Edit"
                                >
                                    <Pencil size={16}/>
                                </button>
                                <button
                                    onClick={() => {
                                        if (
                                            window.confirm(
                                                `Deletion not supported "${loc.name}"?`
                                            )
                                        ) {
                                            onDeleteLocation(loc);
                                        }
                                    }}
                                    className="text-red-600 hover:text-red-800"
                                    title="Delete"
                                >
                                    <Trash2 size={16}/>
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
