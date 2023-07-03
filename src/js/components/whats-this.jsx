import { memo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

const WhatsThis = () => {
	const intl = useIntl();
	return (
		<a
			href="/faq#where-is-my-bibliography-stored"
			title={intl.formatMessage({
				id: `zbib.whatsThis`,
				defaultMessage: 'What’s this?'
			})}
			className="whats-this"
		>
			<FormattedMessage id='zbib.whatsThis' defaultMessage="What’s this?" />
			<svg className="icon-question-mark" viewBox="0 0 16 16" width="16" height="16">
				<path className="circle-large"d="M8,0a8,8,0,1,0,8,8A8,8,0,0,0,8,0Z" />
				<path className="circle-small" d="M8,1A7,7,0,1,1,1,8,7.008,7.008,0,0,1,8,1" />
				<path className="character" d="M7.322,10.2v-.86a2.906,2.906,0,0,1,.058-.637,1.679,1.679,0,0,1,.167-.459,1.81,1.81,0,0,1,.3-.395c.129-.127.285-.28.473-.459.152-.141.3-.285.453-.431a4.395,4.395,0,0,0,.409-.452,2.507,2.507,0,0,0,.3-.494,1.393,1.393,0,0,0,.119-.587,1.488,1.488,0,0,0-.119-.6,1.546,1.546,0,0,0-.317-.473A1.456,1.456,0,0,0,8.7,4.045a1.537,1.537,0,0,0-.586-.113,1.5,1.5,0,0,0-1.122.438,1.9,1.9,0,0,0-.517,1.144l-1.44-.141A2.971,2.971,0,0,1,6.058,3.445a3.15,3.15,0,0,1,2.083-.7,3.434,3.434,0,0,1,1.11.176,2.7,2.7,0,0,1,.9.509,2.365,2.365,0,0,1,.6.819,2.7,2.7,0,0,1,.219,1.109,2.611,2.611,0,0,1-.154.939,2.928,2.928,0,0,1-.439.756l-.849.875-.14.127c-.152.142-.271.262-.361.361a1.357,1.357,0,0,0-.211.311,1.23,1.23,0,0,0-.106.359,3.755,3.755,0,0,0-.028.5V10.2Zm-.269,1.949A.928.928,0,0,1,8.642,11.5a.928.928,0,1,1-1.589.655Z" />
			</svg>
		</a>
	)
};

export default memo(WhatsThis);
