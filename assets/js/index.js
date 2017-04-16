const
	html = require('choo/html'),
	choo = require('choo');

const app = choo();
app.use(logger);
app.use(countStore);
app.route('/', mainView);
app.mount('#choo');

function mainView(state, emit)
{
	return html`
    <div>
		count is <span class="label label-primary">${state.count}</span>
		<button type="button" class="btn btn-default" onclick=${onclick}>
			<span class="glyphicon glyphicon-star" aria-hidden="true"></span> Star
		</button>
    </div>
  `;

	function onclick()
	{
		emit('increment', 1);
	}
}

function logger(state, emitter)
{
	emitter.on('*', (messageName, data) =>
	{
		console.log('event', messageName, data);
	});
}

function countStore(state, emitter)
{
	state.count = 0;
	emitter.on('increment', count =>
	{
		state.count += count;
		emitter.emit('render');
	});
}
