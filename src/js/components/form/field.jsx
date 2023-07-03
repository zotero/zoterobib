import cx from 'classnames';
import PropTypes from 'prop-types';
import { Children, forwardRef, memo } from 'react';
import { noop, pick } from 'web-common/utils';


const Field = memo(forwardRef((props, ref) => {
	const { children, className, dragHandle=null, onClick = noop, onKeyDown = noop, tabIndex } = props;
	const [label, value] = Children.toArray(children);

	return (
		<li
			tabIndex={ tabIndex }
			onClick={ onClick }
			onKeyDown={ onKeyDown }
			className={ cx('metadata', className) }
			ref={ ref }
			{ ...pick(props, p => p.startsWith('data-') || p.startsWith('aria-')) }
		>
			<div className="key">
				{ label }
			</div>
			<div className="value">
				{ value }
			</div>
			{ dragHandle }
		</li>
	);
}));

Field.displayName = 'Field';

Field.propTypes = {
	children: PropTypes.array.isRequired,
	className: PropTypes.string,
	dragHandle: PropTypes.element,
	onClick: PropTypes.func,
	onKeyDown: PropTypes.func,
	tabIndex: PropTypes.number,
};

export default Field;
