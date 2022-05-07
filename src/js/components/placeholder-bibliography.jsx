import PropTypes from 'prop-types';
import React, { memo } from 'react';

// When hydrating from static markup, this placeholder component is used instead of actual
// <Bibliography />. I matches static markup enough so that react won't attempt to re-render it and
// does not take any props, other than initial item count, so it won't re-render while app is
// fetching real data and getting ready.
const PlaceholderBibliography = ({ itemCount }) => {
	return (
		<React.Fragment>
			<div
				suppressHydrationWarning={ true }
				className="bibliography read-only placeholder"
				dangerouslySetInnerHTML={ { __html: "" } }
			/>
			{ Array(itemCount).fill().map((_, id) => (
				<script
					suppressHydrationWarning={ true }
					key={ id }
					type="application/vnd.zotero.data+json">
					{ "{}" }
				</script>
			)) }
		</React.Fragment>
	);
}

PlaceholderBibliography.propTypes = {
	itemCount: PropTypes.number
}

export default memo(PlaceholderBibliography);
