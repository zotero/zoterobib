const React = require('react');
const PropTypes = require('prop-types');

const { Toolbar } = require('zotero-web-library/lib/component/ui/toolbars');
const ReactModal = require('react-modal');
const Button = require('zotero-web-library/lib/component/ui/button');

class ReadOnlyControls extends React.PureComponent {
	constructor(props) {
		super(props);
		this.state = {
			showModal: false
		};
	}

	handleOpenModal() {
		this.setState({ showModal: true });
	}

	handleCloseModal() {
		this.setState({ showModal: false });
	}

	handleEdit() {
		if(this.props.localCitationsCount > 0) {
			this.handleOpenModal();
		} else {
			this.handleOverride();
		}
	}

	handleOverride() {
		this.props.onOverride();
		this.handleCloseModal();
	}

	render() {
		return(
			<div>
				<Toolbar className="toolbar-large">
					<div className="toolbar-right">
						<Button onClick={ this.handleEdit.bind(this) }>
							Edit Bibliography
						</Button>
					</div>
				</Toolbar>
				<ReactModal 
					isOpen={ this.state.showModal }
					contentLabel="Minimal Modal Example"
					className="modal"
					overlayClassName="overlay"
				>
					<h1 className="title">
						Override existing bibliography?
					</h1>
					<p>
						There is an existing bibliography with { this.props.localCitationsCount } entries in the editor. If you continue, the existing bibliography will be replaced with this one.
					</p>
					<p className="buttons">
						<Button onClick={ this.handleCloseModal.bind(this) }>Cancel</Button>
						<Button onClick={ this.handleOverride.bind(this) }>Override</Button>
					</p>
				</ReactModal>
			</div>
		);
	}

	static defaultProps = {
		citations: {},
		localCitationsCount: 0
	}
	
	static propTypes = {
		localCitationsCount: PropTypes.number,
		citations: PropTypes.object,
		onOverride: PropTypes.func
	}
}

module.exports = ReadOnlyControls;