'use strict';

const React = require('react');
const PropTypes = require('prop-types');
const cx = require('classnames');
const KeyHandler = require('react-key-handler').default;
const { KEYDOWN } = require('react-key-handler');
const Button = require('zotero-web-library/lib/component/ui/button');
const Modal = require('./modal');
const Icon = require('zotero-web-library/lib/component/ui/icon');
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
	handleChange(name, value) {
		this.props.onCitationModifierChange({
			...this.props.citationCopyModifiers,
			[name]: value
		});
	}

	handleCancel() {
		this.props.onCitationCopyCancel();
	}

	handleConfirm() {
		this.props.onCitationCopy();
	}

	handleInputCommit(_val, _hasChanged, ev) {
		if(ev.type === 'keydown') {
			this.props.onCitationCopy();
			ev.preventDefault();
		}
	}

	render() {
		const title = this.props.isNoteStyle ? 'Copy Note' : 'Copy Citation';
		const isCopied = true;
		return (
			<Modal
				className="modal modal-centered"
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
							<div>
								<Select
									tabIndex={ 0 }
									clearable={ false }
									searchable={ false}
									value={ this.props.citationCopyModifiers.citationLabel || 'page' }
									options={ locators }
									onChange={ () => true }
									onCommit={ this.handleChange.bind(this, 'label') }
								/>
								<Input
									autoFocus
									onChange={ this.handleChange.bind(this, 'locator') }
									onCommit={ this.handleInputCommit.bind(this) }
									tabIndex={ 0 }
									value={ this.props.citationCopyModifiers.citationLocator }
								/>
							</div>
							{ !this.props.isNoteStyle && (
								<div>
									<label>
										<input
											type="checkbox"
											checked={ 'suppressAuthor' in this.props.citationCopyModifiers ? this.props.citationCopyModifiers.suppressAuthor : false }
											onChange={ ev => this.handleChange('suppressAuthor', ev.target.checked) }
										/>
										Omit Author
									</label>
								</div>
							) }
							<div>
								<p>Preview:</p>
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
