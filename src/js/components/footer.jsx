import React, { memo } from 'react';
import { FormattedMessage } from 'react-intl';

const Footer = () => (
	<footer>
		<nav className="social-nav">
			<FormattedMessage
				id="zbib.footer.follow"
				defaultMessage="Stay in touch! Follow <link>@zotero</link> on Twitter."
				values={ {
					link: chunk => <a href="https://twitter.com/zotero">{ chunk }</a> //eslint-disable-line react/display-name
				} }
			/>
		</nav>
		<small className="copyright">
			© 2018–2021 Zotero &nbsp;•&nbsp; <a href="/faq#privacy">Privacy</a>
		</small>
	</footer>
);

export default memo(Footer);
