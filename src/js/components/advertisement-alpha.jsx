'use strict';

const React = require('react');


export default class AdvertisementAlpha extends React.PureComponent {
	componentDidMount () {
	  (window.adsbygoogle = window.adsbygoogle || []).push({});
	}
  
  render () {
	  return (
		  <ins className='adsbygoogle advertisement-alpha'
			style={{ display: 'block' }}
			data-ad-client='ca-pub-6344797609391119'
			data-ad-slot='3922555336'
			data-ad-format='auto'
			data-full-width-responsive="true"/>
	  );
	}
  }
  
  module.exports = AdvertisementAlpha;
