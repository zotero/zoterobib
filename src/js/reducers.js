import { CONFIRM_CURRENT_STYLE, REQUEST_FETCH_STYLE, RECEIVE_FETCH_STYLE, ERROR_FETCH_STYLE,
SELECT_CURRENT_STYLE } from './constants/actions';
import { pick } from './immutable';

const styleReducer = (state, action) => {
	switch(action.type) {
		case REQUEST_FETCH_STYLE:
			return { ...state, isFetching: true };
		case RECEIVE_FETCH_STYLE:
		case ERROR_FETCH_STYLE:
			return { ...state, isFetching: false };
		case SELECT_CURRENT_STYLE:
			return {
				...state,
				selected: action.styleName,
				xml: action.styleXml,
				isConfirmed: typeof(action.isConfirmed) === 'boolean' ? action.isConfirmed : !action.styleProps.isSentenceCaseStyle,
				...pick(
					action.styleProps,
					['styleHasBibliography', 'isNumericStyle', 'isNoteStyle', 'isUppercaseSubtitlesStyle', 'isSentenceCaseStyle']
				)
			}
		case CONFIRM_CURRENT_STYLE:
			return {
				...state,
				isConfirmed: true
			}
	}
	return state;
}

export { styleReducer };
