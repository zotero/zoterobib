window.getCiteprocRS = async () => {
	const { default: init, Driver: CreateDriver } = await import('/static/js/citeproc-rs/citeproc_rs_wasm.js');
	return { init, CreateDriver };
}
