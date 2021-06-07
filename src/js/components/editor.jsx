/* eslint-disable react/no-deprecated */
// @TODO: migrate to getDerivedStateFromProps()
import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import deepEqual from 'deep-equal';
import { default as KeyHandler } from 'react-key-handler';
import { KEYDOWN } from 'react-key-handler';
import baseMappings from 'zotero-base-mappings';

import Button from './ui/button';
import ItemBox from './itembox';
import Spinner from './ui/spinner';
import { getItemTypeMeta } from '../api-utils';
import { hideFields, noEditFields } from '../constants/item';
import { reverseMap } from '../utils';
import Modal from './modal';

class Editor extends React.PureComponent {
	constructor(props) {
		super(props);
		this.state = {
			isLoading: true,
			hasCreatedItem: false
		};
	}

	async componentDidMount() {
		this.prepareState(this.props);
	}

	componentWillReceiveProps(nextProps) {
		if(this.props.activeDialog === nextProps.activeDialog
			&& deepEqual(this.props.editorItem, nextProps.editorItem)) {
			return;
		}

		this.prepareState(nextProps);
	}

	componentDidUpdate({ activeDialog }) {
		if(this.props.activeDialog === 'EDITOR' && activeDialog !== 'EDITOR') {
			this.isRecentlyOpen = true;
		}
		if(this.isRecentlyOpen && this.itemBox) {
			this.itemBox.focusField('itemType');
			this.isRecentlyOpen = false;
		}
	}

	async prepareState(props) {
		var item;
		if(props.activeDialog !== 'EDITOR') {
			this.setState({
				fields: [],
				isLoading: true,
				item: null,
			});
			return;
		}

		if(!props.editorItem) {
			item = {
				version: 0,
				itemType: 'book',
				tags: [],
				creators: []
			};
		} else {
			item = { ...props.editorItem };
		}

		try {
			var { itemTypes, itemTypeFields, itemTypeCreatorTypes } = await getItemTypeMeta(item.itemType);
		} catch(e) {
			this.props.onError('Failed to obtain metadata. Please check your connection and try again.', e);
			this.setState({
				isLoading: false
			});
			return;
		}

		itemTypes = itemTypes.map(it => ({
			value: it.itemType,
			label: it.localized
		})).filter(it => it.value != 'note');

		itemTypeCreatorTypes = itemTypeCreatorTypes.map(ct => ({
			value: ct.creatorType,
			label: ct.localized
		}));

		const hiddenFields = [
			...hideFields,
			'rights',
			'extra',
		];

		const titleField = item.itemType in baseMappings && baseMappings[item.itemType]['title'] || 'title';

		var fields = [
			{ field: 'itemType', localized: 'Item Type' },
			itemTypeFields.find(itf => itf.field === titleField),
			{ field: 'creators', localized: 'Creators' },
			...itemTypeFields.filter(itf => itf.field !== titleField)
		];

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

		fields = fields.filter(f => f && !hiddenFields.includes(f.field))
			.concat([
				itemTypeFields.find(itf => itf.field === 'abstractNote'),
				itemTypeFields.find(itf => itf.field === 'extra'),
		])
			.map(f => ({
				options: f.field === 'itemType' ? itemTypes : null,
				key: f.field,
				label: f.localized,
				readonly: noEditFields.includes(f.field),
				processing: false,
				value: f.field in item ? item[f.field] : null
		}));

		this.setState({
			item,
			fields,
			creatorTypes: itemTypeCreatorTypes,
			isLoading: false
		});
	}

	async handleItemUpdate(fieldKey, newValue) {
		// Add Original Date field to book and bookSection #188
		if(fieldKey === 'original-date') {
			let extra = 'extra' in this.state.item ? this.state.item.extra : '';
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
		if((fieldKey === 'publisher') && ['webpage'].includes(this.state.item.itemType)) {
			let extra = 'extra' in this.state.item ? this.state.item.extra : '';
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

		if(!('key' in this.state.item)) {
			this.state.item.key = Math.random().toString(36).substr(2, 8).toUpperCase();
			this.props.onItemCreated({
				...this.state.item,
				[fieldKey]: newValue
			});
			this.setState({ hasCreatedItem: true });
			return;
		}

		let fieldIndex = this.state.fields.findIndex(field => field.key == fieldKey);
		this.setState({
			fields: [
				...this.state.fields.slice(0, fieldIndex),
				{
					...this.state.fields[fieldIndex],
					processing: true,
					value: newValue
				},
				...this.state.fields.slice(fieldIndex + 1)
			]
		}, () => {
			var patch = {
				[fieldKey]: newValue
			};
			// @TODO: deduplicate from web-library
			// when changing itemType, map fields to base types and back to item-specific types
			if(fieldKey === 'itemType') {
				const baseValues = {};
				if(this.state.item.itemType in baseMappings) {
					const namedToBaseMap = reverseMap(baseMappings[this.state.item.itemType]);
					Object.keys(this.state.item).forEach(fieldName => {
						if(fieldName in namedToBaseMap) {
							if(this.state.item[fieldName].toString().length > 0) {
								baseValues[namedToBaseMap[fieldName]] = this.state.item[fieldName];
							}
						}
					});
				}

				patch = { ...patch, ...baseValues };

				if(newValue in baseMappings) {
					const namedToBaseMap = baseMappings[newValue];
					const itemWithBaseValues = { ...this.state.item, ...baseValues };
					Object.keys(itemWithBaseValues).forEach(fieldName => {
						if(fieldName in namedToBaseMap) {
							patch[namedToBaseMap[fieldName]] = itemWithBaseValues[fieldName];
							patch[fieldName] = '';
						}
					});
				}
			}
			this.props.onItemUpdate(this.state.item.key, patch);
		});
	}

	handleClose() {
		this.props.onEditorClose(this.state.hasCreatedItem);
	}

	get itemTitle() {
		let item = this.state.item;
		if(item) {
			let field = item.itemType in baseMappings && baseMappings[item.itemType]['title'] || 'title';
			return item[field];
		}
		return '';
	}

	renderModalContent() {
		return (
			<div className="modal-content" tabIndex={ -1 }>
				<div className="modal-header">
					<h4 className="modal-title text-truncate">
					{ this.itemTitle }
					</h4>
					<Button
						className="btn-outline-inverse-blue-dark"
						onClick={ () => this.props.onEditorClose(this.state.hasCreatedItem) }
					>
						Done
					</Button>
				</div>
				<div className="modal-body">
					<div className={ cx('editor', this.props.className ) }>
						<ItemBox
							{ ...this.state }
							ref={ ref => this.itemBox = ref}
							isForm={ true }
							onSave={ this.handleItemUpdate.bind(this) }
						/>
					</div>
				</div>
			</div>
		);
	}

	render() {
		return (
			<Modal
				isOpen={ this.props.activeDialog === 'EDITOR' }
				contentLabel="Item Editor"
				className={ cx('editor-container modal modal-lg', { loading: this.state.isLoading })}
				onRequestClose={ this.handleClose.bind(this) }
			>
				<KeyHandler
					keyEventName={ KEYDOWN }
					keyValue="Escape"
					onKeyHandle={ this.handleClose.bind(this) }
				/>
				{ this.state.isLoading ? <Spinner /> : this.renderModalContent() }
			</Modal>
		);
	}

	static propTypes = {
		activeDialog: PropTypes.string,
		className: PropTypes.string,
		editorItem: PropTypes.object,
		location: PropTypes.object,
		onEditorClose: PropTypes.func.isRequired,
		onError: PropTypes.func.isRequired,
		onItemCreated: PropTypes.func.isRequired,
		onItemUpdate: PropTypes.func.isRequired,
	}
}

export default Editor;
