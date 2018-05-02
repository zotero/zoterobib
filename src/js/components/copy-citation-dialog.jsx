'use strict';

const React = require('react');
const PropTypes = require('prop-types');
const cx = require('classnames');
const KeyHandler = require('react-key-handler').default;
const { KEYDOWN } = require('react-key-handler');
const Button = require('zotero-web-library/lib/component/ui/button');
const Modal = require('./modal');
const Input = require('zotero-web-library/lib/component/form/input');
const Select = require('zotero-web-library/lib/component/form/select');

const locators = [
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
].map(locator => ({
	value: locator,
	label: locator[0].toUpperCase() + locator.slice(1)
}));

class CopyCitationDialog extends React.PureComponent {
	state = {
		isCopied: false
	}

	componentWillUnmount() {
		if(this.timeout) {
			this.cleanUp();
			delete this.timeout;
		}
	}

	componentWillReceiveProps({ isCitationCopyDialogOpen }) {
		if(this.props.isCitationCopyDialogOpen != isCitationCopyDialogOpen) {
			this.cleanUp();
			this.setState({ isCopied: false });
		}
	}

	cleanUp() {
		if(this.timeout) {
			clearTimeout(this.timeout);
			delete this.timeout;
		}
	}

	handleChange(name, value) {
		this.props.onCitationModifierChange({
			...this.props.citationCopyModifiers,
			[name]: value
		});
	}

	handleCancel() {
		this.cleanUp();
		this.props.onCitationCopyCancel();
	}

	handleConfirm() {
		if(this.props.onCitationCopy()) {
			this.setState({ isCopied: true });
			this.timeout = setTimeout(() => {
				this.props.onCitationCopyCancel();
				this.setState({ isCopied: false });
			}, 1000);
		}
	}

	handleInputCommit(_val, _hasChanged, ev) {
		if(ev.type === 'keydown') {
			this.handleConfirm();
			ev.preventDefault();
		}
	}

	render() {
		const title = this.props.isNoteStyle ? 'Copy Note' : 'Copy Citation';
		const { isCopied } = this.state;
		return (
			<Modal
				className="modal modal-centered copy-citation-dialog"
				isOpen={ this.props.isCitationCopyDialogOpen }
				contentLabel={ title }
				onRequestClose={ () => { this.props.onCitationCopyCancel(); } }
			>
				<React.Fragment>
					<KeyHandler
						keyEventName={ KEYDOWN }
						keyValue="Escape"
						onKeyHandle={ this.handleCancel.bind(this) }
					/>
					<div className="modal-content" tabIndex={ -1 }>
						<div className="modal-body">
							<div className="form-row form-group">
								<div className="col-xs-6">
									<Select
										clearable={ false }
										isDisabled={ isCopied }
										onChange={ () => true }
										onCommit={ this.handleChange.bind(this, 'label') }
										options={ locators }
										searchable={ false}
										tabIndex={ 0 }
										value={ this.props.citationCopyModifiers.citationLabel || 'page' }
										className="form-control-sm"
									/>
									</div>
								<div className="col-xs-6">
									<Input
										autoFocus
										isDisabled={ isCopied }
										onChange={ this.handleChange.bind(this, 'locator') }
										onCommit={ this.handleInputCommit.bind(this) }
										tabIndex={ 0 }
										value={ this.props.citationCopyModifiers.citationLocator }
										className="form-control-sm"
										placeholder="Number"
									/>
								</div>
							</div>
							{ !this.props.isNoteStyle && (
								<div className="form-group">
									<div className="checkbox">
										<label>
											<input
												disabled={ isCopied }
												type="checkbox"
												checked={ 'suppressAuthor' in this.props.citationCopyModifiers ? this.props.citationCopyModifiers.suppressAuthor : false }
												onChange={ ev => this.handleChange('suppressAuthor', ev.target.checked) }
											/>
											Omit Author
										</label>
									</div>
								</div>
							) }
							<div>
								<h5>Preview:</h5>
								<p
									className="preview"
									dangerouslySetInnerHTML={ { __html: this.props.citationHtml } }
								/>
							</div>
						</div>
						<div className="modal-footer">
							<div className="buttons">
								<Button
									className="btn-outline-secondary"
									onClick={ this.handleCancel.bind(this) }
								>
									Cancel
								</Button>
								<Button
									className={ cx('btn-secondary', { 'success': isCopied}) }
									onClick={ this.handleConfirm.bind(this) }
								>
									<span className={ cx('inline-feedback', { 'active': isCopied }) }>
										<span className="default-text" aria-hidden={ !isCopied }>{ title }</span>
										<span className="shorter feedback" aria-hidden={ isCopied }>Copied!</span>
									</span>
								</Button>
							</div>
						</div>
					</div>
				</React.Fragment>
			</Modal>
		);
	}

	static propTypes = {
		citationCopyModifiers: PropTypes.object,
		citationHtml: PropTypes.string,
		isCitationCopyDialogOpen: PropTypes.bool,
		isNoteStyle: PropTypes.bool,
		onCitationCopy: PropTypes.func.isRequired,
		onCitationCopyCancel: PropTypes.func.isRequired,
		onCitationModifierChange: PropTypes.func.isRequired,
	}
}


module.exports = CopyCitationDialog;
