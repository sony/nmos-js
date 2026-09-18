import React, { createContext, useContext, useEffect, useState } from 'react';

// Editing context for pausing the auto-refresh while fields are being edited
// in place on a show page, like navigating to an edit page does
const EditingContext = createContext();

export const EditingContextProvider = props => {
    const [editingCount, setEditingCount] = useState(0);
    return (
        <EditingContext.Provider
            value={[editingCount, setEditingCount]}
            {...props}
        />
    );
};

export const useEditingContext = () => useContext(EditingContext);

export const useEditingField = editing => {
    const [, setEditingCount] = useEditingContext();
    useEffect(() => {
        if (!editing) return;
        setEditingCount(count => count + 1);
        return () => setEditingCount(count => count - 1);
    }, [editing, setEditingCount]);
};
