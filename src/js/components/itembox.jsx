import cx from 'classnames';
import PropTypes from 'prop-types';
import React, { forwardRef, memo, useCallback, useImperativeHandle, useRef, useState } from 'react';

import Creators from './form/creators';
import Editable from './ui/editable';
import Field from './form/field';
import Input from './form/input';
import SelectInput from './form/select';
import TextAreaInput from './form/text-area';

const pickInputComponent = field => {
	switch(field.key) {
		case 'itemType': return SelectInput;
		case 'abstractNote': return TextAreaInput;
		case 'extra': return TextAreaInput;
		default: return Input;
	}
};

const FieldLabel = memo(({ field }) => {
	switch(field.key) {
		case 'url':
			return (
				<a rel='nofollow' href={ field.value }>
					{ field.label }
				</a>
			);
		case 'DOI':
			return (
				<a rel='nofollow' href={ 'http://dx.doi.org/' + field.value }>
					{ field.label }
				</a>
			);
		default:
			return field.label;
	}
});

FieldLabel.displayName = 'FieldLabel';

FieldLabel.propTypes = {
	field: PropTypes.object
};

const ItemBoxField = memo(forwardRef((props, ref) => {
	const { field, isActive, isForm, onCancel, onCommit } = props;

	const isSelect = field.options && Array.isArray(field.options);
	const className = {
		'empty': !field.value || !field.value.length,
		'select': isSelect,
		'editing': isActive,
		'abstract': field.key === 'abstractNote',
		'extra': field.key === 'extra',
	};
	const display = field.key === 'itemType' ?
		field.options.find(o => o.value === field.value) :
		null;
	const fieldProps = {
		autoFocus: !isForm,
		display: display ? display.label : null,
		inputComponent: pickInputComponent(field),
		isActive,
		isBusy: field.processing || false,
		onCancel: onCancel,
		onCommit: onCommit,
		options: field.options || null,
		selectOnFocus: !isForm,
		value: field.value || '',
		className: 'form-control form-control-sm',
		id: field.key,
		[isForm ? 'ref' : 'inputRef']: ref,
	};

	if(isForm) {
		fieldProps['tabIndex'] = 0;
	}

	if(fieldProps.inputComponent === SelectInput) {
		fieldProps['onChange'] = () => true; //commit on change
	}

	if(fieldProps.inputComponent !== SelectInput) {
		fieldProps['onBlur'] = () => false; //commit on blur
	}
	if(fieldProps.inputComponent === TextAreaInput) {
		fieldProps['rows'] = 5;
	}

	const FormField = isForm ? fieldProps.inputComponent : Editable;

	return (
		<Field
			className={ cx(className) }
			data-key={ field.key }
		>
			<label htmlFor={ field.key} >
				<FieldLabel field={ field } />
			</label>
			<FormField { ...fieldProps } />
		</Field>
	);
}));

ItemBoxField.displayName = 'ItemBoxField';

ItemBoxField.propTypes = {
	field: PropTypes.object,
	isActive: PropTypes.bool,
	isForm: PropTypes.bool,
	onCancel: PropTypes.func.isRequired,
	onCommit: PropTypes.func.isRequired,
};

const ItemBox = memo(forwardRef((props, ref) => {
	const { creatorTypes, fields = [], isEditing, isForm, onSave } = props;
	const [activeEntry, setActiveEntry] = useState(null);
	const itemTypeField = useRef(null);

	useImperativeHandle(ref, () => ({
		focus: () => {
			itemTypeField.current.focus();
		}
	}));

	const handleCancel = useCallback((_isChanged, ev) => {
		const key = ev.target && ev.target.closest('[data-key]')?.dataset.key;
		if(key === activeEntry) {
			setActiveEntry(null);
		}
	}, [activeEntry]);

	const saveField = useCallback((key, newValue, isChanged, srcEvent) => {
		if(isChanged) {
			onSave(key, newValue);
		}
		if(key === activeEntry) {
			setActiveEntry(null);
		}
		if(isForm && srcEvent) {
			if(srcEvent.type === 'keydown' && srcEvent.key == 'Enter') {
				srcEvent.target.blur();
			}
		}
	}, [activeEntry, isForm, onSave]);

	const handleCommit = useCallback((newValue, isChanged, ev) => {
		const key = ev.target.closest('[data-key]').dataset.key;
		saveField(key, newValue, isChanged);
	}, [saveField]);

	const handleCreatorsCommit = useCallback((newValue, isChanged) => {
		saveField('creators', newValue, isChanged);
	}, [saveField])

	return (
		<ol className={cx('metadata-list', 'horizontal', { editing: isEditing }) }>
			{ fields.map(field => (
				field.key === 'creators' ?
				<Creators
					key={ field.key }
					name={ field.key }
					creatorTypes = { creatorTypes }
					value={ field.value || [] }
					onSave={ handleCreatorsCommit }
					isForm={ isForm }
				/> :
				<ItemBoxField
					field={ field }
					isActive={ field.key === activeEntry }
					key={ field.key }
					onCancel={ handleCancel }
					onCommit={ handleCommit }
					isForm={ isForm }
					{ ...(field.key === 'itemType' ? { ref: itemTypeField } : {}) }
				/>
			)) }
		</ol>
	);

}));

ItemBox.displayName = 'ItemBox';

ItemBox.propTypes = {
	creatorTypes: PropTypes.array,
	fields: PropTypes.array,
	isEditing: PropTypes.bool, // relevant on small screens only
	isForm: PropTypes.bool,
	onSave: PropTypes.func.isRequired
};

export default ItemBox;
