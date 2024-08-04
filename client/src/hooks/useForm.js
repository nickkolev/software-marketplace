import { useEffect, useState } from 'react';

export function useForm(initialValues, submitCallback) {
    const [values, setValues] = useState(initialValues);

    useEffect(() => {
        setValues(initialValues);
    }, [initialValues]);
    
    const changeHandler = (event) => {
        setValues(state => ({
            ...state,
            [event.target.name]: event.target.value
        }))
    }
    
    const submitHandler = async (event) => {
        event.preventDefault();

        await submitCallback(values);
        
        setValues(initialValues);
    }
    
    return {
        values,
        changeHandler,
        submitHandler,
    };
}