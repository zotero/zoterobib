'use strict';

const React = require('react');
const PropTypes = require('prop-types');
const cx = require('classnames');
const ItemBox = require('zotero-web-library/lib/component/item/box');
const { Toolbar } = require('zotero-web-library/lib/component/ui/toolbars');
const Button = require('zotero-web-library/lib/component/ui/button');
const { withRouter, Link } = require('react-router-dom');
const { hideFields, noEditFields } = require('zotero-web-library/lib/constants/item');
const { getItemTypeMeta } = require('../utils');
const { baseMappings } = require('zotero-web-library/lib/constants/item');
const { reverseMap } = require('zotero-web-library/lib/utils');

class Editor extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			isLoading: true
		};
	}

	async componentDidMount() {
		this.prepareState(this.props);
	}

	async componentWillReceiveProps(nextProps) {
		if(this.props.location === nextProps.location
			&& this.props.items === nextProps.items) {
			return;
		}

		this.prepareState(nextProps);
	}

	async prepareState(props) {
		var item;
		if('item' in props.match.params && typeof props.match.params.item === 'undefined') {
			item = {
				'version': 0,
				'itemType': 'book',
				'title': '(No Title)',
				tags: [],
				creators: []
			};
		} else {
			item = props.items.find(item => item.key === props.match.params.item);
			if(!item) {
				this.setState({
					isLoading: true
				});
				return;
			}
		}

		try {
			var { itemTypes, itemTypeFields, itemTypeCreatorTypes } = await getItemTypeMeta(item.itemType);
		} catch(e) {
			this.props.onError('Failed to obtain metadata. Please check your connection and try again.');
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
			...hideFields.filter(f => f != 'abstractNote'),
			'rights'
		];

		const titleField = item.itemType in baseMappings && baseMappings[item.itemType]['title'] || 'title';

		const fields = [
			{ field: 'itemType', localized: 'Item Type' },
			itemTypeFields.find(itf => itf.field === titleField),
			{ field: 'creators', localized: 'Creators' },
			...itemTypeFields.filter(itf => itf.field !== titleField)
		]
			.filter(f => f && !hiddenFields.includes(f.field))
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
		if(!('key' in this.state.item)) {
			this.state.item.key = Math.random().toString(36).substr(2, 8).toUpperCase();
			this.props.onItemCreated(this.state.item);
			this.props.title.replace(`/editor/${this.state.item.key}/`);
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

	render() {
		return (
			<div className={ cx('editor', this.props.className ) }>
				<Toolbar className="hidden-xs-down toolbar-large">
					<div className="toolbar-left">
						<div className="logo">
							<Link to="/">
								ZBib
							</Link>
						</div>
					</div>
				</Toolbar>
				<ItemBox
					{ ...this.state }
					isEditing={ true }
					onSave={ this.handleItemUpdate.bind(this) } />
				<div className="buttons">
					<Link to="/">
						<Button className="btn-primary">
							Back
						</Button>
					</Link>
				</div>
			</div>
		);
	}

	static propTypes = {
		className: PropTypes.string,
		title: PropTypes.object,
		items: PropTypes.array,
		location: PropTypes.object,
		onError: PropTypes.func.isRequired,
		onItemCreated: PropTypes.func.isRequired,
		onItemUpdate: PropTypes.func.isRequired,
	}
}

module.exports = withRouter(Editor);
