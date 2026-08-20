jQuery(document).ready(() => {

	QUICKDRAW.state.set('category', 'all');
	QUICKDRAW.state.set('search', '');

	QUICKDRAW.library.bind();
	QUICKDRAW.editor.bind();

	jQuery('#qd-detail-modal').modal({ observeChanges: true, closable: true });
	jQuery('#qd-edit-modal').modal({ observeChanges: true, closable: true });

	QUICKDRAW.library.load();

	//TODO BACKEND CANNOT HANDLE _DEVTOKEN GETTING SENT IN REQUEST
	jQuery.ajaxSetup({
	      data:""
	});
});
