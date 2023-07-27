
import Utilities_Item from '../../modules/zotero-utilities/utilities_item.js';
import Schema from '../../modules/zotero-utilities/schema.js';
import CachedTypes from '../../modules/zotero-utilities/cachedTypes.js';
import ZOTERO_TYPE_SCHEMA from '../../modules/zotero-utilities/resource/zoteroTypeSchemaData.js';
import Utilities_Date from '../../modules/zotero-utilities/date.js';
import Utilities from '../../modules/zotero-utilities/utilities.js';
import dateFormats from '../../modules/zotero-utilities/resource/dateFormats.json';

const Zotero = {
	debug: console.log,
	Date: Utilities_Date,
	Schema: { init: Schema.init },
	Utilities: {
		...Utilities,
		Item: Utilities_Item
	},
	...CachedTypes
};

window.Zotero = Zotero;

const configureZoteroShim = (schema, intl) => {
	const collator = new Intl.Collator([intl.locale], {
		numeric: true,
		sensitivity: 'base'
	});

	Zotero.locale = intl.locale;
	Zotero.getString = identifier => {
		switch (identifier) {
			case 'date.yesterday':
				return intl.formatMessage({ id: 'date.yesterday', defaultMessage: 'yesterday' });
			case 'date.today':
				return intl.formatMessage({ id: 'date.today', defaultMessage: 'today' });
			case 'date.tomorrow':
				return intl.formatMessage({ id: 'date.tomorrow', defaultMessage: 'tomorrow' });
			default:
				return identifier;
		}
	}
	Zotero.Schema.init(schema);
	Zotero.setTypeSchema(ZOTERO_TYPE_SCHEMA);
	Zotero.Date.init(dateFormats);
	Zotero.localeCompare = collator.compare;
	return Zotero;
}

export { configureZoteroShim, Zotero };
