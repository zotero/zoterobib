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
			&& this.state.selectedIndex !== null
			&& this.state.items[this.state.selectedIndex]) {
			const styleName = this.state.items[this.state.selectedIndex].name;
			if(styleName && this.listEl) {
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

	handleEscapeKey(ev) {
		this.handleCancel();
		ev.preventDefault();
	}

	handleArrowDownKey(ev) {
		this.setState({
			selectedIndex: this.state.selectedIndex === null ? 0 : Math.min(this.state.selectedIndex + 1, this.state.items.length)
		});
		ev.preventDefault();
	}

	handleArrowUpKey(ev) {
		this.setState({
			selectedIndex: Math.max(this.state.selectedIndex - 1, 0)
		});
		ev.preventDefault();
	}

	handleEnterKey(ev) {
		this.handleSelect(this.state.items[this.state.selectedIndex]);
		ev.preventDefault();
	}

	handleInputKeydown(ev) {
		switch(ev.key) {
			case 'Escape': this.handleEscapeKey(ev); break;
			case 'ArrowDown': this.handleArrowDownKey(ev); break;
			case 'ArrowUp': this.handleArrowUpKey(ev); break;
			case 'Enter': this.handleEnterKey(ev); break;
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
				key="key-handler-escape"
				keyEventName={ KEYDOWN }
				keyValue="Escape"
				onKeyHandle={ this.handleEscapeKey.bind(this) }
			/>,
			<KeyHandler
				key="key-handler-arrow-down"
				keyEventName={ KEYDOWN }
				keyValue="ArrowDown"
				onKeyHandle={ this.handleArrowDownKey.bind(this) }
			/>,
			<KeyHandler
				key="key-handler-arrow-up"
				keyEventName={ KEYDOWN }
				keyValue="ArrowUp"
				onKeyHandle={ this.handleArrowUpKey.bind(this) }
			/>,
			<KeyHandler
				key="key-handler-enter"
				keyEventName={ KEYDOWN }
				keyValue="Enter"
				onKeyHandle={ this.handleEnterKey.bind(this) }
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