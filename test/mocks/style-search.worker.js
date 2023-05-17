
export default class SearchWorker {
	constructor () {
		this.data = [];
		this.matches = [];
		this.filter = null;
		this.callback = () => {}
	}

  postMessage (evData) {
		const [command, payload] = evData;
		switch (command) {
			case 'LOAD':
				this.data = payload;
				this.callback({ data: ['READY', null] });
				break;
			case 'FILTER':
				this.filter = payload.toLowerCase();
				this.matches = this.data.filter(
					style => style.name.toLowerCase().includes(this.filter)
						|| style.title.toLowerCase().includes(this.filter)
						|| (style.titleShort && style.titleShort.toLowerCase().includes(this.filter))
				);
				this.callback({ data: ['FILTER_COMPLETE', this.matches] });
				break;
		}
  }

  addEventListener (event, callback) {
		this.callback = callback;
  }

	removeEventListener() {
		this.callback = () => {};
	}
}
