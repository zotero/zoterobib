import React from 'react';
import whyDidYouRender from "@welldone-software/why-did-you-render";

if (process.env.NODE_ENV === 'development') {
	whyDidYouRender(React, {
		onlyLogs: true,
		titleColor: '#957DAD',
		diffNameColor: '#FFDFD3',
		logOnDifferentValues: true,
		// trackAllPureComponents: true,
	});
	console.warn('whyDidYouRender installed');
}
