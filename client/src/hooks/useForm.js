import { useState } from 'react';

export function useForm(initialValues, submitCallback) {
    const [values, setValues] = useState(initialValues);
    
    function changeHandler(event) {
        setValues(state => ({
            ...state,
            [event.target.name]: event.target.value
        }))
    }
    
    function submitHandler(event) {
        event.preventDefault();

        submitCallback(values);
        
        setValues(initialValues);
    }
    
    return {
        values,
        changeHandler,
        submitHandler,
    };
}