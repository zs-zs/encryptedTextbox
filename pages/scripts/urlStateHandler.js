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