var urlStateHandler = require('./urlStateHandler');
var CryptoService = require('./cryptoService');

var socket;
var cryptoService;
var encryptionMode = 'AES-CFB';

var showMessage = function showMessage(message) {
	$('#info').text(message);
};

var emitLocalChanges = function emitLocalChanges() {
	var message = cryptoService.encryptMessage($('#text').val());
	socket.emit('change', urlStateHandler.getUrl(), message);
};

var processRemoteChanges = function processRemoteChanges(message) {
	if(!cryptoService.isDataIntegrityOK(message)) {
		showMessage('Warning: the last message was corrupted!');
		return;
	}
	var decryptedText = cryptoService.decryptMessage(message);
	$('#text').val(decryptedText);
};

var subscribe = function subscribe() {
	socket = io.connect();
	var urlData = urlStateHandler.getData();
	$('#text').val(urlData.message);
	cryptoService = new CryptoService(encryptionMode, urlData.key, urlData.iv);
	urlStateHandler.setData(urlData.key, urlData.iv);
	showMessage('Now edit the document as you wish and send the link to your friends!');
	$('#save').hide();
	$('#fileUrl').show().val(window.location.href).select();
	$('#text').bind('input propertychange', emitLocalChanges);
	socket.on('connect', function() {
		socket.emit('subscribe', urlStateHandler.getUrl());
	});
	socket.on('subscribed', emitLocalChanges);
	socket.on('changed', processRemoteChanges);
};

var saved = function saved() {
	cryptoService = new CryptoService(encryptionMode);
	showMessage('Saving...');
	$.post('save').always(function(id, status) {
		if(status !== 'success') {
			showMessage('Oops! Saving was unsuccessful. Try again.');
			return;
		}
		var message = $('#text').val();
		urlStateHandler.redirect(id, [cryptoService.key, cryptoService.iv, message]);
	});
};

$(document).ready(function() {	
	if(document.location.hash) {
		subscribe();
		return;
	}
	$('#save').click(saved);
});
