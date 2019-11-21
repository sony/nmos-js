import React, { useEffect, useState } from 'react';
import {
    ClickAwayListener,
    Grow,
    IconButton,
    Input,
    InputAdornment,
    withStyles,
} from '@material-ui/core';
import ClearIcon from '@material-ui/icons/Clear';
import ContentFilter from '@material-ui/icons/FilterList';

const styles = theme => ({
    container: {
        display: 'inline',
    },
    button: {
        maxWidth: '30px',
        maxHeight: '30px',
        minWidth: '30px',
        minHeight: '30px',
    },
    icon: {
        maxWidth: '20px',
        maxHeight: '20px',
        minWidth: '20px',
        minHeight: '20px',
    },
    input: {
        display: 'inline-flex',
        maxHeight: '28px',
        marginLeft: theme.spacing.unit,
        marginRight: theme.spacing.unit,
    },
});

const FilterField = props => {
    const { classes } = props;
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState('');
    let textInputRef = null;

    useEffect(() => {
        if (open) textInputRef.focus();
    }, [open, textInputRef]);

    const handleChangeValue = event => {
        props.setFilter(event.target.value, props.name);
        setValue(event.target.value);
    };

    const handleClickAway = () => {
        if (value === '') setOpen(false);
    };

    const handleClear = () => {
        props.setFilter('', props.name);
        setValue('');
        setOpen(false);
    };

    const onEsc = event => {
        if (textInputRef !== document.activeElement) return;
        // https://www.w3.org/TR/uievents-key/#named-key-attribute-values
        if ('Escape' === event.key) handleClear();
    };

    useEffect(() => {
        if (open) {
            window.addEventListener('keydown', onEsc);
        } else {
            window.removeEventListener('keydown', onEsc);
        }
    });

    return (
        <ClickAwayListener onClickAway={handleClickAway}>
            <div className={classes.container}>
                <Grow in={open} timeout={300} unmountOnExit>
                    <Input
                        className={classes.input}
                        value={value}
                        onChange={handleChangeValue}
                        inputRef={input => (textInputRef = input)}
                        endAdornment={
                            <InputAdornment position="end">
                                <IconButton
                                    className={classes.button}
                                    onClick={handleClear}
                                >
                                    <ClearIcon className={classes.icon} />
                                </IconButton>
                            </InputAdornment>
                        }
                    />
                </Grow>
                <IconButton
                    className={classes.button}
                    style={{ transform: 'translateY(-3px)' }}
                    onClick={() => setOpen(!open)}
                >
                    <ContentFilter
                        className={classes.icon}
                        style={{
                            color: `${value && '#2196f3'}`,
                        }}
                    />
                </IconButton>
            </div>
        </ClickAwayListener>
    );
};

export default withStyles(styles)(FilterField);
