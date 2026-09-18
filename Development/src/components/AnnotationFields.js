import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    Button,
    FormControl,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography,
    makeStyles,
} from '@material-ui/core';
import { get, has } from 'lodash';
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline';
import CloseIcon from '@material-ui/icons/Close';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import PublishIcon from '@material-ui/icons/Publish';
import {
    Labeled,
    TextField as ReadOnlyTextField,
    fetchUtils,
    useNotify,
    useRecordContext,
    useResourceContext,
} from 'react-admin';
import { makeBearerAuthHeader } from '../authProvider';
import { Parameter, TAGS } from './ParameterRegisters';
import ObjectField from './ObjectField';
import { TableInput } from './ObjectInput';
import { useEditingField } from './EditingContext';
import labelize from './labelize';
import { resourceUrl } from '../dataProvider';
import { concatUrl, usingAuth } from '../settings';

const ANNOTATION_SERVICE_TYPE = 'urn:x-nmos:service:annotation/';
// the only namespace which must be read-write
const USER_TAG_PREFIX = 'urn:x-nmos:tag:user:';

const requestHeaders = () => {
    const headers = new Headers({ Accept: 'application/json' });
    if (usingAuth()) {
        headers.set('Authorization', makeBearerAuthHeader().Authorization);
    }
    return headers;
};

const getQueryResource = async (resource, id) => {
    const response = await fetch(resourceUrl(resource, `/${id}`), {
        headers: requestHeaders(),
    });
    if (!response.ok) {
        throw new Error(
            `GET ${resource}/${id} returned HTTP ${response.status}`
        );
    }
    return response.json();
};

export const annotationResourceUrl = async (resource, record) => {
    let node;
    if (resource === 'nodes') {
        node = record;
    } else {
        let device;
        if (resource === 'devices') {
            device = record;
        } else if (record.device_id) {
            device = await getQueryResource('devices', record.device_id);
        } else {
            // Flow.device_id was added in v1.1
            const source = await getQueryResource('sources', record.source_id);
            device = await getQueryResource('devices', source.device_id);
        }
        node = await getQueryResource('nodes', device.node_id);
    }

    const service = (node.services || [])
        .filter(
            ({ type, href }) => type.startsWith(ANNOTATION_SERVICE_TYPE) && href
        )
        .sort((left, right) => right.type.localeCompare(left.type))[0];
    if (!service) return null;

    const path =
        resource === 'nodes'
            ? '/node/self/'
            : `/node/${resource}/${record.id}/`;
    return concatUrl(service.href, path);
};

// each field gets the wrapper that SimpleShowLayout gives its own children,
// so that they are laid out in one column as usual
const AnnotationField = ({ source, children }) => (
    <div className={`ra-field ra-field-${source}`}>
        <Labeled label={labelize(source)}>{children}</Labeled>
    </div>
);

const AnnotationTextInput = ({ name, value, onPatch }) => {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(value || '');
    const [saving, setSaving] = useState(false);

    useEditingField(editing);

    useEffect(() => {
        if (!editing) setDraft(value || '');
    }, [editing, value]);

    const patch = async nextValue => {
        setSaving(true);
        try {
            if (await onPatch({ [name]: nextValue })) setEditing(false);
        } finally {
            setSaving(false);
        }
    };

    if (!editing) {
        return (
            <AnnotationField source={name}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Typography style={{ whiteSpace: 'pre-wrap' }}>
                        {value}
                    </Typography>
                    <Tooltip title={`Edit ${name}`}>
                        <IconButton
                            aria-label={`Edit ${name}`}
                            onClick={() => setEditing(true)}
                            size="small"
                        >
                            <EditIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title={`Reset ${name}`}>
                        <span>
                            <IconButton
                                aria-label={`Reset ${name}`}
                                disabled={saving}
                                onClick={() => patch(null)}
                                size="small"
                            >
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </span>
                    </Tooltip>
                </div>
            </AnnotationField>
        );
    }

    return (
        <div
            className={`ra-field ra-field-${name}`}
            style={{
                display: 'flex',
                alignItems: 'flex-start',
                marginBottom: 8,
            }}
        >
            <TextField
                autoFocus
                fullWidth
                label={labelize(name)}
                onChange={event => setDraft(event.target.value)}
                onKeyDown={event => {
                    if (event.key === 'Enter') {
                        event.preventDefault();
                        if (!saving) patch(draft);
                    } else if (event.key === 'Escape' && !saving) {
                        setEditing(false);
                    }
                }}
                value={draft}
            />
            <Tooltip title={`Save ${name}`}>
                <span>
                    <IconButton
                        aria-label={`Save ${name}`}
                        disabled={saving}
                        onClick={() => patch(draft)}
                    >
                        <PublishIcon />
                    </IconButton>
                </span>
            </Tooltip>
            <Tooltip title="Cancel">
                <span>
                    <IconButton
                        aria-label={`Cancel editing ${name}`}
                        disabled={saving}
                        onClick={() => setEditing(false)}
                    >
                        <CloseIcon />
                    </IconButton>
                </span>
            </Tooltip>
        </div>
    );
};

const valuesToText = values => (values || []).join('\n');
const textToValues = text => text.split('\n');

// each input needs its own FormControl, otherwise they all share the focused
// state, and the dense margin, of the FormControl that Labeled provides
const TagInput = props => (
    <FormControl>
        <TableInput {...props} />
    </FormControl>
);

// the label says what the bin icons on each row cannot, but it is the same
// kind of action, so it gets the same colour rather than the button default
const useStyles = makeStyles(theme => ({
    resetAll: {
        color: theme.palette.action.active,
    },
}));

const AnnotationTagsInput = ({ tags, onPatch }) => {
    const classes = useStyles();
    const [editing, setEditing] = useState(null);
    const [values, setValues] = useState('');
    const [adding, setAdding] = useState(false);
    const [newName, setNewName] = useState('');
    const [newValues, setNewValues] = useState('');
    const [saving, setSaving] = useState(false);

    useEditingField(editing !== null || adding);

    // each editor closes itself when saved, so that a new tag can be added
    // while an existing tag is being edited
    const patchTag = async (tagName, tagValues) => {
        setSaving(true);
        try {
            return await onPatch({ tags: { [tagName]: tagValues } });
        } finally {
            setSaving(false);
        }
    };

    return (
        <AnnotationField source="tags">
            <div>
                <Table size="small" style={{ width: 'auto' }}>
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Values</TableCell>
                            <TableCell />
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {Object.entries(tags || {}).map(
                            ([tagName, tagValues]) => {
                                return (
                                    <TableRow key={tagName}>
                                        <TableCell>
                                            <Parameter
                                                register={TAGS}
                                                value={tagName}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {editing === tagName ? (
                                                <TagInput
                                                    id="value"
                                                    multiline
                                                    placeholder="One value per line"
                                                    onChange={event =>
                                                        setValues(
                                                            event.target.value
                                                        )
                                                    }
                                                    value={values}
                                                />
                                            ) : (
                                                <Typography
                                                    style={{
                                                        whiteSpace: 'pre-line',
                                                    }}
                                                    variant="body2"
                                                >
                                                    {valuesToText(tagValues)}
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell align="right">
                                            {editing !== tagName && (
                                                <>
                                                    <Tooltip title="Edit tag">
                                                        <IconButton
                                                            aria-label={`Edit ${tagName}`}
                                                            onClick={() => {
                                                                setEditing(
                                                                    tagName
                                                                );
                                                                setValues(
                                                                    valuesToText(
                                                                        tagValues
                                                                    )
                                                                );
                                                            }}
                                                            size="small"
                                                        >
                                                            <EditIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Reset tag">
                                                        <span>
                                                            <IconButton
                                                                aria-label={`Reset ${tagName}`}
                                                                disabled={
                                                                    saving
                                                                }
                                                                onClick={() =>
                                                                    patchTag(
                                                                        tagName,
                                                                        null
                                                                    )
                                                                }
                                                                size="small"
                                                            >
                                                                <DeleteIcon fontSize="small" />
                                                            </IconButton>
                                                        </span>
                                                    </Tooltip>
                                                </>
                                            )}
                                            {editing === tagName && (
                                                <>
                                                    <Tooltip title="Save tag">
                                                        <span>
                                                            <IconButton
                                                                aria-label={`Save ${tagName}`}
                                                                disabled={
                                                                    saving
                                                                }
                                                                onClick={() =>
                                                                    patchTag(
                                                                        tagName,
                                                                        textToValues(
                                                                            values
                                                                        )
                                                                    ).then(
                                                                        ok =>
                                                                            ok &&
                                                                            setEditing(
                                                                                null
                                                                            )
                                                                    )
                                                                }
                                                                size="small"
                                                            >
                                                                <PublishIcon fontSize="small" />
                                                            </IconButton>
                                                        </span>
                                                    </Tooltip>
                                                    <Tooltip title="Cancel">
                                                        <IconButton
                                                            aria-label={`Cancel editing ${tagName}`}
                                                            onClick={() =>
                                                                setEditing(null)
                                                            }
                                                            size="small"
                                                        >
                                                            <CloseIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            }
                        )}
                        {adding && (
                            <TableRow>
                                <TableCell>
                                    <TagInput
                                        autoFocus
                                        id="name"
                                        onChange={event =>
                                            setNewName(event.target.value)
                                        }
                                        value={newName}
                                    />
                                </TableCell>
                                <TableCell>
                                    <TagInput
                                        id="value"
                                        multiline
                                        placeholder="One value per line"
                                        onChange={event =>
                                            setNewValues(event.target.value)
                                        }
                                        value={newValues}
                                    />
                                </TableCell>
                                <TableCell align="right">
                                    <Tooltip title="Save new tag">
                                        <span>
                                            <IconButton
                                                aria-label="Save new tag"
                                                disabled={
                                                    newName ===
                                                        USER_TAG_PREFIX ||
                                                    !newName ||
                                                    saving
                                                }
                                                onClick={() =>
                                                    patchTag(
                                                        newName,
                                                        textToValues(newValues)
                                                    ).then(
                                                        ok =>
                                                            ok &&
                                                            setAdding(false)
                                                    )
                                                }
                                                size="small"
                                            >
                                                <PublishIcon fontSize="small" />
                                            </IconButton>
                                        </span>
                                    </Tooltip>
                                    <Tooltip title="Cancel">
                                        <IconButton
                                            aria-label="Cancel adding tag"
                                            onClick={() => setAdding(false)}
                                            size="small"
                                        >
                                            <CloseIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                    <TableFooter>
                        <TableRow>
                            <TableCell>
                                <Tooltip title="Add tag">
                                    <span>
                                        <IconButton
                                            aria-label="Add tag"
                                            disabled={adding}
                                            onClick={() => {
                                                setNewName(USER_TAG_PREFIX);
                                                setNewValues('');
                                                setAdding(true);
                                            }}
                                            size="small"
                                        >
                                            <AddCircleOutlineIcon fontSize="small" />
                                        </IconButton>
                                    </span>
                                </Tooltip>
                            </TableCell>
                            <TableCell />
                            <TableCell align="right">
                                <Button
                                    className={classes.resetAll}
                                    disabled={saving}
                                    onClick={() => onPatch({ tags: null })}
                                    size="small"
                                    startIcon={<DeleteIcon />}
                                >
                                    Reset all
                                </Button>
                            </TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            </div>
        </AnnotationField>
    );
};

// finding the Annotation API takes a request or two, and the show view is
// remounted on every refresh, so remember where it was found
const annotationUrls = new Map();

// the Query API record is what gets displayed, whatever its version; the
// Annotation API, when the Node has one, is where changes are written
const AnnotationContext = createContext();

const AnnotationFields = ({ children, register = TAGS }) => {
    const { record } = useRecordContext();
    const resource = useResourceContext();
    const notify = useNotify();
    const key = record && `${resource}/${record.id}`;
    const [url, setUrl] = useState(() => annotationUrls.get(key));
    const [annotation, setAnnotation] = useState(record);

    useEffect(() => {
        setAnnotation(record);
        if (!record) return;
        setUrl(annotationUrls.get(key));
        let active = true;
        annotationResourceUrl(resource, record)
            .then(nextUrl => {
                annotationUrls.set(key, nextUrl);
                if (active) setUrl(nextUrl);
            })
            .catch(() => {
                if (active) setUrl(null);
            });
        return () => {
            active = false;
        };
    }, [key, record, resource]);

    if (!record) return null;

    // returns whether the patch was applied, so that an editor stays open when
    // the Annotation API rejects the change
    const patch = async body => {
        try {
            const response = await fetchUtils.fetchJson(url, {
                method: 'PATCH',
                headers: requestHeaders(),
                body: JSON.stringify(body),
            });
            setAnnotation(response.json);
            notify('Annotation updated', 'info');
            return true;
        } catch (error) {
            // e.g. a read-only tag is rejected with 500 and says why
            notify(
                has(error, 'body.error')
                    ? [
                          get(error.body, 'error'),
                          get(error.body, 'code'),
                          get(error.body, 'debug'),
                      ]
                          .filter(Boolean)
                          .join(' - ')
                    : error.message || error.toString(),
                'warning'
            );
            return false;
        }
    };

    return (
        <AnnotationContext.Provider
            value={{
                record: annotation,
                register,
                // until the Annotation API is found, and if the Node does not
                // have one, the fields are read-only like any others
                patch: url ? patch : null,
            }}
        >
            {children}
        </AnnotationContext.Provider>
    );
};

export const AnnotationTextField = ({ source }) => {
    const { record, patch } = useContext(AnnotationContext);
    if (!patch) {
        return (
            <AnnotationField source={source}>
                <ReadOnlyTextField record={record} source={source} />
            </AnnotationField>
        );
    }
    return (
        <AnnotationTextInput
            name={source}
            onPatch={patch}
            value={get(record, source)}
        />
    );
};

export const AnnotationTagsField = () => {
    const { record, register, patch } = useContext(AnnotationContext);
    if (!patch) {
        return (
            <AnnotationField source="tags">
                <ObjectField
                    record={record}
                    register={register}
                    source="tags"
                />
            </AnnotationField>
        );
    }
    return <AnnotationTagsInput onPatch={patch} tags={get(record, 'tags')} />;
};

export default AnnotationFields;
