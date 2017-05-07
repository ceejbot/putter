'use strict';

var
	html = require('choo/html'),
	choo = require('choo');

var header = choo();
header.route('/*', mainView);
header.mount('#headerapp');

function getCookieValue(a)
{
	var b = document.cookie.match('(^|;)\\s*' + a + '\\s*=\\s*([^;]+)');
	return b ? b.pop() : '';
}

function mainView(state, emit)
{
	var user = decodeURIComponent(getCookieValue('user'));
	if (user)
	{
		return html`<div>
	<a class="f6 fw6 hover-blue link white-70 mr2 mr3-m mr4-l dib" href="https://github.com/ceejbot/putter">Source</a>
	<span class="f6 fw6 hover-blue link white-70 mr2 mr3-m mr4-l dib">Welcome ${user}</span>
	<a class="f6 fw6 hover-blue link white-70 mr2 mr3-m mr4-l dib" href="/profile">Profile</a>
</div>`;
	}

	return html`<div>
	<a class="f6 fw6 hover-blue link white-70 mr2 mr3-m mr4-l dib" href="https://github.com/ceejbot/putter">Source</a>
	<a class="f6 fw6 hover-blue link white-70 mr2 mr3-m mr4-l dib" href="/signup">Sign up</a>
	<a class="f6 fw6 hover-blue link white-70 mr2 mr3-m mr4-l dib" href="/signin">Sign in  <i class="fa fa-sign-in fa-lg mr1"></i></a>
</div>`;
}

module.exports = header;
