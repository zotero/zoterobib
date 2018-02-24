'use strict';

const React = require('react');
const PropTypes = require('prop-types');
const ReactModal = require('react-modal');
const KeyHandler = require('react-key-handler').default;
const { KEYDOWN } = require('react-key-handler');
const Spinner = require('zotero-web-library/lib/component/ui/spinner');
const Button = require('zotero-web-library/lib/component/ui/button');
const Icon = require('zotero-web-library/lib/component/ui/icon');
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
			const filter = this.state.filterInput.toLowerCase();
			this.setState({
				selectedIndex: null,
				items: this.props.stylesData.filter(
					style => style.name.toLowerCase().includes(filter)
					|| style.title.toLowerCase().includes(filter)
					|| (style.titleShort && style.titleShort.toLowerCase().includes(filter))
				)
			});
		}, 250);
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

	handleInstall(style) {
		this.props.onStyleInstallerInstall(style);
	}

	handleDelete(style) {
		this.props.onStyleInstallerDelete(style);
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
		let keyHandlers = [
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
		];
		return [
			...(this.props.isInstallingStyle ? keyHandlers : []),
			<ReactModal
				key="react-modal"
				isOpen={ this.props.isInstallingStyle }
				contentLabel="Citation Style Picker"
				className="style-installer modal modal-lg"
				overlayClassName="modal-backdrop"
				onRequestClose={ this.handleCancel.bind(this) }
				appElement={ document.querySelector('main') }
			>
				<div className="modal-header">
					<h4 className="modal-title">
						Install Citation Styles
					</h4>
					<Button
						className="close btn-icon"
						onClick={ this.handleCancel.bind(this) }
					>
						<Icon type={ '24/remove' } width="24" height="24" />
					</Button>
				</div>
				<div className="modal-body">
					<input
						autoFocus
						className="filter-input"
						onChange={ this.handleFilterChange.bind(this) }
						onKeyDown={ this.handleInputKeydown.bind(this) }
						placeholder="Citation Style Search"
						type="text"
						value={ this.state.filterInput }
					/>
					<div className="scroll-container">
						{
							this.props.isStylesDataLoading ? <Spinner /> : (
								this.state.filterInput.length > 2 ? (
								<ul ref={ listEl => this.listEl = listEl }>
									{
										this.state.items.map(
											style => {
												const isInstalled = this.props.citationStyles.find(cs => cs.name === style.name);
												const isSelected = style.name === this.props.citationStyle;
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
														{
															isInstalled && !isSelected ? (
																<Button className="btn-danger" onClick={ (ev) => { ev.stopPropagation(); this.handleDelete(style); } }>
																	Remove
																</Button>
															) : !isSelected && (
																<Button className="btn-primary" onClick={ (ev) => { ev.stopPropagation(); this.handleInstall(style); } }>
																	Install
																</Button>
															)
														}
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
				</div>
			</ReactModal>
		];
	}

	static propTypes = {
		citationStyle: PropTypes.string,
		citationStyles: PropTypes.array,
		isInstallingStyle: PropTypes.bool,
		isStylesDataLoading: PropTypes.bool,
		onStyleInstallerCancel: PropTypes.func.isRequired,
		onStyleInstallerDelete: PropTypes.func.isRequired,
		onStyleInstallerInstall: PropTypes.func.isRequired,
		onStyleInstallerSelect: PropTypes.func.isRequired,
		stylesData: PropTypes.array,
	}
}


module.exports = StyleInstaller;
