import cx from 'classnames';
import PropTypes from 'prop-types';
import React, { useEffect, useCallback, useReducer, useRef, memo } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { FormattedMessage, useIntl } from 'react-intl';

import baseMappings from '../../../data/mappings.js';
import Button from './ui/button';
import ItemBox from './itembox';
import Modal from './modal';
import Spinner from './ui/spinner';
import { getItemTypeMeta } from '../api-utils';
import { hideFields, noEditFields } from '../constants/item';
import { reverseMap } from '../utils';
import { usePrevious } from '../hooks';

const REQUEST_META = 'REQUEST_META';
const RECEIVE_META = 'RECEIVE_META';
const ERROR_META = 'ERROR_META';
const ITEM_UPDATED = 'ITEM_UPDATED';
const BEGIN_ITEM_UPDATE = 'BEGIN_ITEM_UPDATE';

const hiddenFields = [
	...hideFields,
	'rights',
	'extra',
];

const getFieldsAndItems = (item, itemTypeFields, itemTypes) => {
	if(!item || !itemTypeFields || !itemTypes) {
		return { item, fields: [] }
	}

	const titleField = item.itemType in baseMappings && baseMappings[item.itemType]['title'] || 'title';
	let fields = [
			{ field: 'itemType', localized: 'Item Type' },
			itemTypeFields.find(itf => itf.field === titleField),
			{ field: 'creators', localized: 'Creators' },
			...itemTypeFields.filter(itf => itf.field !== titleField)
		]
		.filter(f => f && !hiddenFields.includes(f.field))
		.concat([
			itemTypeFields.find(itf => itf.field === 'abstractNote'),
			itemTypeFields.find(itf => itf.field === 'extra'),
		]);

	// Add Original Date field to book and bookSection #188
	if(['book', 'bookSection'].includes(item.itemType)) {
		let dateIndex = fields.findIndex(f => f.field === 'date');
		fields.splice(dateIndex + 1, 0, { field: 'original-date', localized: 'Original Date' });
		let matches = 'extra' in item && item.extra.match(/^original-date:\s*(.*?)$/);
		if(matches) {
			item['original-date'] = matches[1];
			item.extra = item.extra.replace(/^original-date:\s*.*?$/, '');
		}
	}

	// Add Publisher to webpage
	if(['webpage'].includes(item.itemType)) {
		let beforeIndex = fields.findIndex(f => f.field === 'websiteType');
		fields.splice(beforeIndex + 1, 0, { field: 'publisher', localized: 'Publisher' });
		let matches = 'extra' in item && item.extra.match(/^publisher:\s*(.*?)$/i);
		if (matches) {
			item['publisher'] = matches[1];
			item.extra = item.extra.replace(/^publisher:\s*.*?$/, '');
		}
	}

	fields = fields.map(f => ({
			options: f.field === 'itemType' ? itemTypes : null,
			key: f.field,
			label: f.localized,
			readonly: noEditFields.includes(f.field),
			processing: false,
			value: f.field in item ? item[f.field] : null
	}));

	return { item, fields };
}

const editorReducer = (state, action) => {
	if(action.type === REQUEST_META) {
		return { ...state, isLoading: action.skipLoading ? false : true }
	}

	if(action.type === RECEIVE_META) {
		const itemTypes = action.itemTypes.map(it => ({
			value: it.itemType,
			label: it.localized
		})).filter(it => it.value != 'note');
		const itemTypeCreatorTypes = action.itemTypeCreatorTypes.map(ct => ({
			value: ct.creatorType,
			label: ct.localized
		}));
		const itemTypeFields = action.itemTypeFields;

		return {
			...state, itemTypes, itemTypeFields, itemTypeCreatorTypes,
			...getFieldsAndItems(state.item, itemTypeFields, itemTypes),
			isLoading: false
		}
	}

	if(action.type === ERROR_META) {
		return { ...state, isLoading: false }
	}

	if(action.type === ITEM_UPDATED) {
		return {
			...state,
			...getFieldsAndItems(action.item, state.itemTypeFields, state.itemTypes)
		}
	}

	if(action.type === BEGIN_ITEM_UPDATE) {
		const fieldIndex = state.fields.findIndex(field => field.key === action.fieldKey);
		return {
			...state,
			fields: [
				...state.fields.slice(0, fieldIndex),
				{
					...state.fields[fieldIndex],
					processing: true,
					value: action.newValue
				},
				...state.fields.slice(fieldIndex + 1)
			]
		}
	}

	return state;
}

const Editor = props => {
	const { activeDialog, className, editorItem, onEditorClose, onError, onItemCreated, onItemUpdate } = props;
	const prevEditorItem = usePrevious(editorItem);
	const itemBox = useRef(null);
	const hasCreatedItem = useRef(null);
	const accumulatedPatch = useRef({});
	const debouncedApplyAccumulatedPatchRef = useRef(useDebouncedCallback(itemKey => {
		onItemUpdate(itemKey, accumulatedPatch.current);
		accumulatedPatch.current = {};
	}, 1000));
	const [editor, dispatchEditor] = useReducer(editorReducer, {
		isLoading: true,
		fields: [],
		item: editorItem,
	});
	const intl = useIntl();

	const itemTitle = editor.item ?
		editor.item[editor.item.itemType in baseMappings && baseMappings[editor.item.itemType]['title'] || 'title'] : '';

	const getMeta = useCallback(async (itemType, skipLoading = false) => {
		try {
			dispatchEditor({ type: REQUEST_META, skipLoading })
			var { itemTypes, itemTypeFields, itemTypeCreatorTypes } = await getItemTypeMeta(itemType);
			dispatchEditor({ type: RECEIVE_META, itemTypes, itemTypeFields, itemTypeCreatorTypes });
		} catch(e) {
			onError(intl.formatMessage({ id: 'zbib.error.fetchMetadata', defaultMessage: 'Failed to obtain metadata. Please check your connection and try again.' }), e);
			dispatchEditor({ type: ERROR_META });
		}
	}, [intl, onError]);

	const handleItemUpdate = useCallback(async (fieldKey, newValue) => {
		// Add Original Date field to book and bookSection #188
		if(fieldKey === 'original-date') {
			let extra = editor.item?.extra ?? '';
			let matches = extra.match(/^original-date:\s*(.*?)$/);
			if(matches) {
				extra = extra.replace(/^original-date:\s*(.*?)$/, `original-date: ${newValue}`);
			} else {
				if(extra.length > 0) {
					extra += `\noriginal-date: ${newValue}`;
				} else {
					extra = `original-date: ${newValue}`;
				}
			}
			fieldKey = 'extra';
			newValue = extra;
		}

		// Add Publisher to webpage
		if((fieldKey === 'publisher') && editor.item.itemType === 'webpage') {
			let extra = editor.item?.extra ?? '';
			let matches = extra.match(/^publisher:\s*(.*?)$/);
			if (matches) {
				extra = extra.replace(/^publisher:\s*(.*?)$/, `publisher: ${newValue}`);
			}
			else {
				if (extra.length > 0) {
					extra += `\npublisher: ${newValue}`;
				}
				else {
					extra = `publisher: ${newValue}`;
				}
			}
			fieldKey = 'extra';
			newValue = extra;
		}

		if(!('key' in editor.item)) {
			editor.item.key = Math.random().toString(36).substr(2, 8).toUpperCase();
			onItemCreated({
				...editor.item,
				[fieldKey]: newValue
			});
			hasCreatedItem.current = true;
			return;
		}

		dispatchEditor({ type: BEGIN_ITEM_UPDATE, fieldKey, newValue });

		// TODO: deduplicate from web-library
		// when changing itemType, map fields to base types and back to item-specific types
		var patch = {
			[fieldKey]: newValue
		};

		if(fieldKey === 'itemType') {
			const baseValues = {};
			if(editor.item.itemType in baseMappings) {
				const namedToBaseMap = reverseMap(baseMappings[editor.item.itemType]);
				Object.keys(editor.item).forEach(fieldName => {
					if(fieldName in namedToBaseMap) {
						if(editor.item[fieldName].toString().length > 0) {
							baseValues[namedToBaseMap[fieldName]] = editor.item[fieldName];
						}
					}
				});
			}

			patch = { ...patch, ...baseValues };

			if(newValue in baseMappings) {
				const namedToBaseMap = baseMappings[newValue];
				const itemWithBaseValues = { ...editor.item, ...baseValues };
				Object.keys(itemWithBaseValues).forEach(fieldName => {
					if(fieldName in namedToBaseMap) {
						patch[namedToBaseMap[fieldName]] = itemWithBaseValues[fieldName];
						patch[fieldName] = '';
					}
				});
			}
		}
		accumulatedPatch.current = { ...accumulatedPatch.current, ...patch };
		debouncedApplyAccumulatedPatchRef.current(editor.item.key);
	}, [editor.item, onItemCreated]);

	const handleClose = useCallback(() => {
		debouncedApplyAccumulatedPatchRef.current.flush();
		onEditorClose(hasCreatedItem.current);
	}, [onEditorClose]);

	useEffect(() => {
		if(activeDialog === 'EDITOR' && !editor.isLoading) {
			itemBox.current?.focus();
		}
	}, [activeDialog, editor.isLoading]);

	useEffect(() => {
		if(activeDialog === 'EDITOR') {
			hasCreatedItem.current = false;
		}
	}, [activeDialog]);

	useEffect(() => {
		if(editorItem !== prevEditorItem) {
			dispatchEditor({ type: ITEM_UPDATED, item: editorItem });
		}
		if(typeof prevEditorItem !== 'undefined' && editorItem?.itemType && prevEditorItem?.itemType !== editorItem?.itemType) {
			const skipLoading = editorItem?.itemType && prevEditorItem?.itemType;
			getMeta(editorItem.itemType, skipLoading);
		}

	}, [editorItem, getMeta, prevEditorItem])

	return (
		<Modal
			isOpen={ activeDialog === 'EDITOR' }
			contentLabel={ intl.formatMessage({ id: 'zbib.editor.title', defaultMessage: 'Item Editor' }) }
			className={ cx('editor-container modal modal-lg', { loading: editor.isLoading })}
			onRequestClose={ handleClose }
		>
			{ editor.isLoading ? <Spinner /> : (
				<div className="modal-content" tabIndex={ -1 }>
				<div className="modal-header">
					<h4 className="modal-title text-truncate">
					{ itemTitle }
					</h4>
					<Button
						className="btn-outline-inverse-blue-dark"
						onClick={ handleClose }
					>
						<FormattedMessage id="zbib.general.done" defaultMessage="Done" />
					</Button>
				</div>
				<div className="modal-body">
					<div className={ cx('editor', className ) }>
						<ItemBox
							creatorTypes={ editor.itemTypeCreatorTypes }
							fields={ editor.fields }
							isForm={ true }
							onSave={ handleItemUpdate }
							ref={ itemBox }
						/>
					</div>
				</div>
			</div>
			) }
		</Modal>
	);
}

Editor.propTypes = {
	activeDialog: PropTypes.string,
	className: PropTypes.string,
	editorItem: PropTypes.object,
	onEditorClose: PropTypes.func.isRequired,
	onError: PropTypes.func.isRequired,
	onItemCreated: PropTypes.func.isRequired,
	onItemUpdate: PropTypes.func.isRequired,
}

export default memo(Editor);
