/** @jsx React.DOM */
(function(){

	var Dispatcher = require('../dispatcher.js');

	TopbarView = React.createClass({

		render : function() {

			return (

				<header>

					<button onClick={this.showNewItemForm} className='add'>

						<i className='icon-plus'/> Add New Movie

					</button>

					<label htmlFor='searchinput' className='icon-search' />

					<input type="text" 
					name='searchinput' 
					className="search-input" 
					onKeyUp={this.handleSearch} 
					placeholder="Filter..." 
					ref="search" />

				</header>

			)
		},

		handleSearch : function(e) {

			var searchTerm = this.refs.search.state.value;

			if (searchTerm.length > 2 || searchTerm.length == 0){

				Dispatcher.dispatch('items:search', searchTerm)

			}
		},

		showNewItemForm : function() {

			Dispatcher.dispatch('actions:open', {

				type : 'newItem',

				lock : true

			});
		}
	});

	module.exports = TopbarView;

}).call(this);