'use strict';

const React = require('react');
const PropTypes = require('prop-types');
const KeyHandler = require('react-key-handler').default;
const { KEYDOWN } = require('react-key-handler');
const Editable = require('zotero-web-library/lib/component/editable');
const Button = require('zotero-web-library/lib/component/ui/button');
const Modal = require('./modal');

class CopyCitation extends React.Component {
	defaultState = {
		locator: '',
		label: 'page'
	};

	constructor(props) {
		super(props);

		this.state = this.defaultState;
	}

	componentDidUpdate(prevProps, prevState) {
		if (prevState.locator == this.state.locator
				&& prevState.label == this.state.label) {
			return;
		}
		this.handleDataChange();
	}

	handleChange(event) {
		const target = event.target;
		const name = target.name;
		const value = target.value;
		this.setState({
			[name]: value
		});
	}

	handleDataChange() {
		this.props.onCitationModifierChange(this.state);
	}

	handleClose() {
		this.setState(this.defaultState);
		this.props.onCancel();
	}

	renderLocators() {
		var locators = [
			'page',
			'book',
			'chapter',
			'column',
			'figure',
			'folio',
			'issue',
			'line',
			'note',
			'opus',
			'paragraph',
			'part',
			'section',
			'sub verbo',
			'verse',
			'volume'
		];

		return (
			<select
				name="label"
				value={ this.state.label }
				onChange={ this.handleChange.bind(this) }
			>
				{ locators.map((locator) => {
					return <option key={locator} value={locator}>
						{locator[0].toUpperCase() + locator.slice(1)}
					</option>;
				}) }
			</select>
		);
	}

	render() {
		return (
			<Modal
				key="react-modal"
				className="modal modal-centered"
				isOpen={ this.props.isOpen }
				contentLabel={ this.props.title }
				onRequestClose={ this.handleClose.bind(this) }
			>
				<React.Fragment>
					<KeyHandler
						keyEventName={ KEYDOWN }
						keyValue="Escape"
						onKeyHandle={ () => this.props.onCancel() }
					/>
					<KeyHandler
						keyEventName={ KEYDOWN }
						keyValue="Enter"
						onKeyHandle={ () => this.props.onConfirm() }
					/>
					<div className="modal-content" tabIndex={ -1 }>
						<div className="modal-body">
							<div>
								{ this.renderLocators() }
								{' '}
								<input
									name="locator"
									onKeyUp={ this.handleChange.bind(this) }
								/>
							</div>
							<div>
								<p>Preview:</p>
								<p className="CopyCitation-preview" dangerouslySetInnerHTML={ { __html: this.props.citationPreview } } />
							</div>
						</div>
						<div className="modal-footer">
							<div className="buttons">
								<Button
									className="btn-outline-secondary"
									onClick={ () => this.props.onCancel() }
								>
									Cancel
								</Button>
								<Button
									className="btn-secondary"
									onClick={ () => this.props.onConfirm() }
								>
									{ this.props.confirmLabel }
								</Button>
							</div>
						</div>
					</div>
				</React.Fragment>
			</Modal>
		);
	}

	static propTypes = {
		isOpen: PropTypes.bool,
		confirmLabel: PropTypes.string,
		citationPreview: PropTypes.string,
		onCitationModifierChange: PropTypes.func.isRequired,
		onCancel: PropTypes.func.isRequired,
		onConfirm: PropTypes.func.isRequired,
	}
}


module.exports = CopyCitation;
