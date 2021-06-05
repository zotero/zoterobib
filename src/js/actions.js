import { CONFIRM_CURRENT_STYLE, REQUEST_FETCH_STYLE, RECEIVE_FETCH_STYLE, ERROR_FETCH_STYLE,
SELECT_CURRENT_STYLE } from './constants/actions';
import { fetchWithCachedFallback } from './utils';
import { getStyleProperties } from './get-style-properties';

const stylesCache = new Map();

const fetchAndSelectStyle = async (dispatch, styleName, opts = {}) => {
	dispatch({ type: REQUEST_FETCH_STYLE, styleName });
	let nextStyleName = styleName, styleXml, styleProps;

	do {
		if(stylesCache.has(styleName)) {
			styleXml = stylesCache.get(styleName);
		} else {
			const url = `https://www.zotero.org/styles/${styleName}`;
			try {
				const response = await fetchWithCachedFallback(url);
				if(!response.ok) {
					throw new Error(`Failed to fetch ${styleName} from ${url}`);
				}
				styleXml = await response.text();
			} catch(error) {
				dispatch({ type: ERROR_FETCH_STYLE, styleName, error });
				throw error;
			}
			stylesCache.set(styleName, styleXml);
		}
		styleProps = getStyleProperties(styleXml);
		const { parentStyleName } = styleProps
		nextStyleName = parentStyleName;
	} while(nextStyleName);

	dispatch({
		type: RECEIVE_FETCH_STYLE, styleName, styleXml, styleProps, ...opts
	});

	dispatch({
		type: SELECT_CURRENT_STYLE, styleName, styleXml, styleProps, ...opts
	});
}

const confirmStyle = dispatch => dispatch({ type: CONFIRM_CURRENT_STYLE });

export { confirmStyle, fetchAndSelectStyle };
