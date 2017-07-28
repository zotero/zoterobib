'use strict';

const api = require('zotero-api-client');
const React = require('react');
const ItemBox = require('zotero-web-library/lib/component/item/box');
const { hideFields, noEditFields } = require('zotero-web-library/lib/constants/item');

class Editor extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			isLoading: true
		};
	}
	async componentWillReceiveProps(nextProps) {
		const item = nextProps.items.find(item => item.itemKey === nextProps.match.params.item);

		//@TODO caching middleware
		const itemTypes = (await api().itemTypes().get()).getData();
		const itemTypeFields = (await api().itemTypeFields(item.itemType).get()).getData();
		const creatorTypes = (await api().itemTypeCreatorTypes(item.itemType).get()).getData();
		// console.log(item, itemTypes, fields, itemTypeCreatorTypes);

		const fields = itemTypeFields
			.filter(f => !hideFields.includes(f.field))
			.map(f => ({
				options: f.name === 'itemType' ? itemTypes : null,
				key: f.field,
				label: f.localized,
				readonly: noEditFields.includes(f.field),
				processing: false,
				value: f.field in item ? item[f.field] : null
		}));

		this.setState({
			fields,
			creatorTypes,
			isLoading: false
		});
	}

	render() {
		// const itemId = this.props.match.params.item;
		// const rawItem = this.bib.rawItems.find(item => item.itemKey === itemId);
		// console.log(rawItem);
		
		return (
			<div>
				<ItemBox { ...this.state } />
			</div>
		);
	}
}

module.exports = Editor;
