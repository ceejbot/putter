'use strict';

var
	getFormData = require('get-form-data'),
	html = require('choo/html'),
	choo = require('choo');

var app = choo();
app.use(logger);
app.route('/', mainView);
app.route('/signup', signupView);
app.route('/signin', signinView);
app.mount('#main');

function logger(state, emitter)
{
	emitter.on('*', function(messageName, data)
	{
		console.log('event', messageName, data);
	});
}

function mainView(state, emit)
{
	var which = window.location.hash.replace(/^#/, '');
	if (which.length > 0)
		location.href = "/" + which;

	return html`<div class="fl w-100">teaser view goes here.</div>`;
}

function signupView(state, emit)
{
	return html`
<div class="fl w-100">
	<form action="/signup" method="POST" class="pa4 ma4 black-80 bg-washed-blue">
		<div class="measure-narrow ma4">
			<h3 class="w-80 mt3">Sign up</h3>

			<label for="handle" class="f6 b db mb2">Handle</label>
			<input class="input-reset ba b--black-20 pa2 mb2 db w-100" type="text" id="handle" name="handle" aria-describedby="handle-desc">
			<small id="handle-desc" class="f6 lh-copy black-60 db mb2">
			You need at least one public pseud or handle. You can make other handles later.
			</small>

			<label for="email" class="f6 b db mb2">Email</label>
			<input class="input-reset ba b--black-20 pa2 mb2 db w-100" type="email" id="email" name="email" aria-describedby="email-desc">
			<small id="email-desc" class="f6 lh-copy black-60 db mb2">A valid email address is required. Never made public.</small>

			<label for="password" class="f6 b db mb2">Password</label>
			<input class="input-reset ba b--black-20 pa2 mb2 db w-100" type="password" id="password" name="password" aria-describedby="password-desc">
			<small id="password-desc" class="f6 lh-copy black-60 db mb2">Make it long.</small>

			<button type="submit" onsubmit=${signup} class="btn btn--blue w-100">Sign up</button>
			<small class="f6 lh-copy black-60 db mb2">Already have an account? <a href="/signin">Sign in.</a></small>
		</div>
	</form>
</div>`;

	function signup(e)
	{
		var data = getFormData(e.target);
		// TODO input validation
		// TODO submit form
		e.preventDefault();
	}
}

function signinView(state, emit)
{
	return html`
<div class="fl w-100">
	<form action="/signin" method="POST" class="pa4 ma4 black-80 bg-washed-blue">
		<div class="measure-narrow ma4">
			<h3 class="w-80 mt3">Sign in</h3>

			<label for="email" class="f6 b db mb2">Email</label>
			<input class="input-reset ba b--black-20 pa2 mb2 db w-100" placeholder="youremail@example.com" type="email" id="email" name="email" aria-describedby="email-desc">

			<label for="password" class="f6 b db mb2">Password</label>
			<input class="input-reset ba b--black-20 pa2 mb2 db w-100" placeholder="your password" type="password" id="password" name="password" aria-describedby="password-desc">

			<button type="submit" class="btn btn--blue w-100">
				Sign in
				<i class="fa fa-sign-in fa-lg mr1"></i>
			</button>
			<small class="f6 lh-copy black-60 db mb2">Need an account? <a href="/signup">Sign up.</a></small>
		</div>
	</form>
</div>`;

	function signin()
	{
		// TODO input validation
		// TODO submit form
	}
}
