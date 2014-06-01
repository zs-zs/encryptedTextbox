var id = 0; // we could use a different starting number
var minLength = 5; // minimum length of URLs
var reservedUrls = {};

var shuffleText = function shuffleText(text) {
	var array = text.split('');
	for (var i = array.length - 1; i > 0; i--) {
		var randomIndex = Math.floor(Math.random() * (i+1)); // random index in [0, i]
		var temp = array[i];
		array[i] = array[randomIndex];
		array[randomIndex] = temp;
	};
	return array.join('');
};

var ABC = shuffleText('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHUJKLMNOPQRSTUVWXYZ');
 
var toABC = function toABC(n) {
	var base = ABC.length;
	return n < base ? ABC[n] : toABC(Math.floor(n / base)) + ABC[n % base];
};

var padText = function padText(text, padding, length) {
	while (text.length < length) {
		text += padding;
	}
	return text;
};

module.exports.createNewUrl = function createNewUrl() {
	var url = padText(toABC(id++), ABC[0], minLength);
	reservedUrls[url] = url;
	return url;
};

module.exports.resolve = function resolve(url) {
	if(typeof url !== 'string') {
		throw new TypeError('Parameter with name "url" is not a string');
	}

	if(reservedUrls.hasOwnProperty(url) && typeof reservedUrls[url] === 'string')
		return reservedUrls[url];

	return undefined;
};