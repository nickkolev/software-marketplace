import { useState } from 'react';

export function useForm(initialValues, submitCallback) {
    const [values, setValues] = useState(initialValues);
    
    //TODO: implement this for checkbox and radio buttons
    function changeHandler(event) {
        setValues(state => ({
            ...state,
            [event.target.name]: event.target.value
        }))
    }
    
    function submitHandler(event) {
        event.preventDefault();
        submitCallback(values);
    }
    
    return {
        values,
        changeHandler,
        submitHandler,
    };
}