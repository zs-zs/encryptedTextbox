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
