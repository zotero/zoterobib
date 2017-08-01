'use strict';

const api = require('zotero-api-client');
const React = require('react');
const ItemBox = require('zotero-web-library/lib/component/item/box');
const { hideFields, noEditFields } = require('zotero-web-library/lib/constants/item');
const { Link } = require('react-router-dom');

class Editor extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			isLoading: true
		};
		
		this.onRouterChange(props);
	}

	componentWillReceiveProps(nextProps) {
		this.onRouterChange(nextProps);
	}

	async onRouterChange(props) {
		const item = props.items.find(item => item.itemKey === props.match.params.item);
		if(!item) {
			return;
		}
		const itemTypes = (await api().itemTypes().get()).getData()
			.map(it => ({
				value: it.itemType,
				label: it.localized
			}));
		const itemTypeFields = (await api().itemTypeFields(item.itemType).get()).getData();
		const creatorTypes = (await api().itemTypeCreatorTypes(item.itemType).get()).getData()
			.map(ct => ({
				value: ct.creatorType,
				label: ct.localized
			}));

		const fields = [
			...itemTypeFields, 
			{ field: 'itemType', localized: 'Item Type' },
			{ field: 'creators', localized: 'creators' }
		]
			.filter(f => !hideFields.includes(f.field))
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
			creatorTypes,
			isLoading: false
		});
	}

	async handleItemUpdate(key, newValue) {
		let fieldIndex = this.state.fields.findIndex(field => field.key == key);
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
			this.props.onItemUpdate(this.state.item.itemKey, key, newValue);
		});
	}

	render() {
		return (
			<div className="item-box-container">
				<Link to="/">Back</Link>
				<ItemBox 
					{ ...this.state }
					onSave={ this.handleItemUpdate.bind(this) } />
			</div>
		);
	}
}

module.exports = Editor;