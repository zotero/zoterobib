var data = [];
var items = [];
var filter = null;

self.addEventListener('message', function(ev) {
	const [command, payload] = ev.data;
	switch(command) {
		case 'LOAD':
			data = payload;
			self.postMessage(['READY', null]);
		break;
		case 'FILTER':
			filter = payload;
			items =  data.filter(
				style => style.name.toLowerCase().includes(filter)
					|| style.title.toLowerCase().includes(filter)
					|| (style.titleShort && style.titleShort.toLowerCase().includes(filter))
			);
			self.postMessage(['FILTER_COMPLETE', items]);
		break;
	}
});
