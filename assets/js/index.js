'use strict';

var
	html = require('choo/html'),
	choo = require('choo');

var app = choo();
app.use(logger);
app.use(countStore);
app.route('/', signupView);
app.route('/signin', signinView);
app.mount('#signup');

function signupView(state, emit)
{
	return html`
<div class="panel panel-primary">
	<div class="panel-heading">Sign up</div>
	<div class="panel-body">
		<form class="form-horizontal" action="/signup" method="POST" enctype="application/x-www-form-urlencoded">
			<div class="form-group">
				<label for="signup_handle" class="col-sm-2">Handle</label>
				<div class="col-sm-6">
					<input type="text" class="form-control" id="signup_handle" name="signup_handle" placeholder="Handle" aria-describedby="handle-help">
					<p class="help-block" id="handle-help">The name you'll be known on the site as.</p>
				</div>
			</div>
			<div class="form-group">
				<label for="signup_email" class="col-sm-2">Email address</label>
				<div class="col-sm-6">
					<input type="email" class="form-control" id="signup_email" name="signup_email" placeholder="Email" aria-describedby="email-help">
					<p class="help-block" id="email-help">A valid email address is required. Never made public.</p>
				</div>
			</div>
			<div class="form-group">
				<label for="signup_password" class="col-sm-2">Password</label>
				<div class="col-sm-6">
					<input type="password" class="form-control" id="signup_password" name="signup_password" placeholder="Password">
				</div>
			</div>
			<div class="form-group">
				<div class="col-sm-offset-2 col-sm-6">
					<button type="submit" class="btn btn-default">Sign up</button>
				</div>
			</div>
		</form>
	</div>
	<div class="panel-footer">
		<span class="small">Already have an account? <a href="/signin">Sign in.</a></span>
	</div>
</div>`;

	function signup()
	{
		// TODO submit the form
		emit('increment', 1);
	}
}

function signinView(state, emit)
{
	return html`
<div class="panel panel-primary">
	<div class="panel-heading">Sign in</div>
	<div class="panel-body">
		<form class="form-horizontal" action="/signin" method="POST">
			<div class="form-group">
				<label for="signin_email" class="col-sm-2">Email address</label>
				<div class="col-sm-8">
					<input type="email" class="form-control" id="signin_email" name="signin_email" placeholder="Email" aria-describedby="email-help">
				</div>
			</div>
			<div class="form-group">
				<label for="signin_password" class="col-sm-2">Password</label>
				<div class="col-sm-8">
					<input type="password" class="form-control" id="signin_password" name="signin_password" placeholder="Password">
				</div>
			</div>
			<div class="form-group">
				<div class="col-sm-offset-2 col-sm-10">
					<button type="submit" class="btn btn-default" onclick=${signin}>
						<span class="glyphicon glyphicon-login" aria-hidden="true"></span>
						Sign in
					</button>
				</div>
			</div>
		</form>
	</div>
	<div class="panel-footer">
		<span class="small">Need an account? <a href="/">Sign up.</a></span>
	</div>
</div>`;

	function signin()
	{
		emit('increment', 1);
	}
}

function logger(state, emitter)
{
	emitter.on('*', function(messageName, data)
	{
		console.log('event', messageName, data);
	});
}

function countStore(state, emitter)
{
	state.count = 0;
	emitter.on('increment', function(count)
	{
		state.count += count;
		emitter.emit('render');
	});
}
