'use strict';

const React = require('react');
const PropTypes = require('prop-types');
const ReactModal = require('react-modal');
const KeyHandler = require('react-key-handler').default;
const { KEYDOWN } = require('react-key-handler');
const Spinner = require('zotero-web-library/lib/component/ui/spinner');
const Button = require('zotero-web-library/lib/component/ui/button');
const cx = require('classnames');
const scrollIntoViewIfNeeded = require('scroll-into-view-if-needed');

class StyleInstaller extends React.Component {
	state = {
		selectedIndex: null,
		filterInput: '',
		filter: '',
		items: [],
	}

	componentWillUnmount() {
		if(this.timeout) {
			clearTimeout(this.timeout);
			delete this.timeout;
		}
	}

	componentDidUpdate(props, state) {
		if(this.state.selectedIndex !== state.selectedIndex 
			&& this.state.selectedIndex !== null) {
			const styleName = this.state.items[this.state.selectedIndex].name;
			if(styleName) {
				const itemEl = this.listEl.querySelector(`[data-name="${styleName}"]`);
				if(itemEl) {
					scrollIntoViewIfNeeded(itemEl);
				}
			}
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
				selectedIndex: null,
				items: this.props.stylesData.filter(
					style => style.title.toLowerCase().includes(
						this.state.filterInput.toLowerCase()
					)
				)
			});
		}, 100);
	}

	handleInputKeydown(ev) {
		if(ev.key === 'Escape') {
			this.handleCancel();
			ev.preventDefault();
		}
		if(ev.key === 'ArrowDown') {
			this.setState({
				selectedIndex: this.state.selectedIndex === null ? 0 : Math.min(this.state.selectedIndex + 1, this.state.items.length)
			});
			ev.preventDefault();
		}
		if(ev.key === 'ArrowUp') {
			this.setState({
				selectedIndex: Math.max(this.state.selectedIndex - 1, 0)
			});
			ev.preventDefault();
		}
		if(ev.key === 'Enter') {
			this.handleSelect(this.state.items[this.state.selectedIndex]);
			ev.preventDefault();
		}
	}

	handleSelect(style) {
		this.handleCancel();
		this.props.onStyleInstallerSelect(style);
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
					autoFocus
					type="text"
					placeholder="Citation Style Search"
					value={ this.state.filterInput }
					onKeyDown={ this.handleInputKeydown.bind(this) }
					onChange={ this.handleFilterChange.bind(this) }
				/>
				<div className="scroll-container">
					{
						this.props.isStylesDataLoading ? <Spinner /> : (
							this.state.filterInput.length > 2 ? (
							<ul ref={ listEl => this.listEl = listEl }>
								{
									this.state.items.map(
										style => {
											return (
												<li 
													className={ cx('item', {
														selected: this.state.items[this.state.selectedIndex] ? this.state.items[this.state.selectedIndex].name === style.name : false
													}) }
													data-name={ style.name }
													key={ style.name }
													onClick={ () => this.handleSelect(style) }
												>
													<span>{ style.title }</span>
												</li>
											);
										}
									)
								}
							</ul>
							) : (
								<p>Please enter at least three characters to start searching.</p>
							)
						)
					}
				</div>
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