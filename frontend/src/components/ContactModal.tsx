// components/ContactFormModal.tsx
import * as Dialog from '@radix-ui/react-dialog';
import React from 'react';
import ContactForm from './ContactForm';
import {X} from 'lucide-react';

interface ContactFormModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    initialData?: any;
}

const ContactFormModal: React.FC<ContactFormModalProps> = ({open, onClose, onSubmit, initialData}) => {
    return (
        <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
            <Dialog.Portal>
                <Dialog.Overlay className="bg-black/30 fixed inset-0 z-40"/>
                <Dialog.Content
                    className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-lg w-full max-w-md"
                >
                    <div className="flex justify-between items-center mb-4">
                        <Dialog.Title className="text-lg font-semibold">
                            {initialData ? 'Edit Contact' : 'Add Contact'}
                        </Dialog.Title>
                        <Dialog.Close asChild>
                            <button className="text-gray-500 hover:text-gray-700">
                                <X/>
                            </button>
                        </Dialog.Close>
                    </div>
                    <ContactForm
                        initialData={initialData}
                        onSubmit={onSubmit}
                        onCancel={onClose}
                    />
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

export default ContactFormModal;
