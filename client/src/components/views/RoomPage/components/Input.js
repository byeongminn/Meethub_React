import React, { useState } from 'react'

function Input(props) {
    const [value, setValue] = useState("");

    const onChange = (event) => {
        const {
            target: { value }
        } = event;
        setValue(value);
    }

    const onSubmit = (event) => {
        event.preventDefault();
        props.getContent(value);
        setValue("");
    }

    return (
        <div>
            <form onSubmit={onSubmit}>
                <input type="text" value={value} onChange={onChange} />
            </form>
        </div>
    )
}

export default Input
