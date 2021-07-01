import React from 'react';
import PropTypes from 'prop-types';

const forumsUrl = 'https://forums.zotero.org/';

const CrashHandler = ({ error = {}, info = {} }) => (
	<div className="crash-handler">
		<h1>An error has occurred</h1>

		<p>Please try reloading this page.</p>

		<p>If you encounter a persistent problem, please let us know in the <a href={ forumsUrl }>Zotero Forums</a>. Be sure to mention <em>zbib</em> in the thread title, and include the details below in your post.</p>

		<textarea
			onClick={ ev => ev.currentTarget.select() }
			rows={ 10 }
			cols={ 120 }
			value={ '<code>' + '\n' + error.stack + '\n\n' + info.componentStack + '\n\n' + (navigator || {}).userAgent + '\n\n' + (window.location.href) + '\n' + '</code>' }
			readOnly={ true }
		/>
	</div>
);

CrashHandler.propTypes = {
	error: PropTypes.object,
	info: PropTypes.object,
}

export default CrashHandler;
