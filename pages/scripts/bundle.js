(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
function CryptoService(cipherType, key, iv) {
	this.key = key || forge.random.getBytesSync(32);
	this.iv  = iv  || forge.random.getBytesSync(32);
	this.cipherType = cipherType;
}

CryptoService.prototype.encryptMessage = function encryptMessage(inputString) {
	var encryptedText = encrypt(this, inputString);
	return {
		encryptedText: encryptedText, 
		hash: hash(this, encryptedText)
	};
};

CryptoService.prototype.decryptMessage = function decryptMessage(message) {
	return decrypt(this, message.encryptedText);
};

CryptoService.prototype.isDataIntegrityOK = function isDataIntegrityOK(message) {
	var calculatedHash = hash(this, message.encryptedText);
	return message.hash === calculatedHash;
};

var encrypt = function encrypt(cryptoService, inputString) {
	var cipher = forge.cipher.createCipher(cryptoService.cipherType, cryptoService.key);
	cipher.start({iv: cryptoService.iv});
	cipher.update(forge.util.createBuffer(inputString, 'utf8'));
	cipher.finish();
	return cipher.output.toHex();
};

var decrypt = function decrypt(cryptoService, encryptedHex) {
	var encryptedBytes = hexToByteBuffer(encryptedHex);
	var decipher = forge.cipher.createDecipher(cryptoService.cipherType, cryptoService.key);
	decipher.start({iv: cryptoService.iv});	
	decipher.update(encryptedBytes);
	decipher.finish();
	return decipher.output.toString();
};

var hash = function hash(cryptoService, messageHex) {
	var messageBytes = hexToBytes(messageHex);
	var hmac = forge.hmac.create();
	hmac.start('sha1', cryptoService.key);
	hmac.update(messageBytes);
	return hmac.digest().toHex();
};

var hexToBytes = function hexToBytes(hexString) {
	return forge.util.hexToBytes(hexString);
};

var hexToByteBuffer = function hexToByteBuffer(hexString) {
	return forge.util.createBuffer(hexToBytes(hexString), 'raw');
};

module.exports = CryptoService;

},{}],2:[function(require,module,exports){
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

},{"./cryptoService":1,"./urlStateHandler":3}],3:[function(require,module,exports){
module.exports.getData = function getData() {
	var fragment = decodeFragment(document.location.hash);
	return {
		key: fragment.substr(0, 32),
		iv: fragment.substr(32, 32),
		message: fragment.substr(64)
	};
};

module.exports.setData = function setData() {
	var fragment = Array.prototype.join.call(arguments, '');
	document.location.hash = encodeFragment(fragment);
};

module.exports.getUrl = function getUrl() {
	return document.location.pathname;
};

module.exports.redirect = function redirect(path, fragmentArgs) {
	var fragment = fragmentArgs.join('');
	document.location.href = path + '#' + encodeFragment(fragment);
};

var encodeFragment = function encodeFragment(keyString) {
	var base64Key = forge.util.encode64(keyString);
	return encodeURIComponent(base64Key);
};

var decodeFragment = function decodeFragment(urlFragment) {
	var base64Key = decodeURIComponent(urlFragment);
	return forge.util.decode64(base64Key);
};
},{}]},{},[2])