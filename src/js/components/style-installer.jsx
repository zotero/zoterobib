'use strict';

const React = require('react');
const PropTypes = require('prop-types');
const ReactModal = require('react-modal');
const KeyHandler = require('react-key-handler').default;
const { KEYDOWN } = require('react-key-handler');
const Spinner = require('zotero-web-library/lib/component/ui/spinner');
const Button = require('zotero-web-library/lib/component/ui/button');

class StyleInstaller extends React.Component {
	state = {
		filterInput: '',
		filter: ''
	}

	componentWillUnmount() {
		if(this.timeout) {
			clearTimeout(this.timeout);
			delete this.timeout;
		}
	}

	handleFilterChange(ev) {
		if(this.timeout) {
			clearTimeout(this.timeout);
		}
		this.setState({
			filterInput: ev.target.value
		});
		this.timeout = setTimeout(() => {
			this.setState({
				filter: this.state.filterInput.toLowerCase()
			});
		}, 100);
	}

	handleInputKeydown(ev) {
		if(ev.key === 'Escape') {
			this.handleCancel();
		}
	}

	handleCancel() {
		clearTimeout(this.timeout);
		delete this.timeout;
		this.setState({
			filterInput: '',
			filter: ''
		});
		this.props.onStyleInstallerCancel();
	}

	render() {
		return [
			<KeyHandler
				key="key-handler"
				keyEventName={ KEYDOWN }
				keyValue="Escape"
				onKeyHandle={ this.handleCancel.bind(this) }
			/>,
			<ReactModal 
				key="react-modal"
				isOpen={ this.props.isInstallingStyle }
				contentLabel="Citation Style Picker"
				className="style-installer modal"
				overlayClassName="overlay"
			>
				<h1 className="title">
					You can use dialog below to search for and install new citation styles
				</h1>
				<input
					type="text"
					placeholder="Citation Style Search"
					value={ this.state.filterInput }
					onKeyDown={ this.handleInputKeydown.bind(this) }
					onChange={ this.handleFilterChange.bind(this) }
				/>
				{
					this.props.isStylesDataLoading ? 
						<Spinner />
					: (
					<div className="scroll-container">
						{
							this.state.filter.length > 2 ? (
							<ul>
								{
									this.props.stylesData.filter(
										style => style.title.toLowerCase().includes(this.state.filter)
									).map(
										style => {
											return (
												<li 
													className="item" 
													key={ style.name }
													onClick={ () => this.props.onStyleInstallerSelect(style) }
												>
													<span>{ style.title }</span>
													<Button onClick={ () => this.props.onStyleInstallerSelect(style) }>
														Install
													</Button>
												</li>
											);
										}
									)
								}
							</ul>
							) : (
								<p>Please enter at least three characters to start searching.</p>
							)
						}
					</div>
					)
				}
				<div className="buttons">
					<Button onClick={ this.handleCancel.bind(this) }>
						Cancel
					</Button>
				</div>
			</ReactModal>
		];
	}

	static propTypes = {
		isInstallingStyle: PropTypes.bool,
		isStylesDataLoading: PropTypes.bool,
		onStyleInstallerSelect: PropTypes.func.isRequired,
		onStyleInstallerCancel: PropTypes.func.isRequired,
		stylesData: PropTypes.array,
	}
}


module.exports = StyleInstaller;