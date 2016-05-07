/** @jsx React.DOM */
(function() {

  var Dispatcher = require('../dispatcher.js');

  ItemView = React.createClass({

    render : function() {

      return (

        <article>

        		<img className='poster' src={this.props.itemData.get('poster')} />

        		<p className='rating'>{this.props.itemData.get('rating')}</p>

        		<p className='title'>{this.props.itemData.get('title')}</p>

        		<p className='year'>{this.props.itemData.get('year')}</p>

        		<p className='synopsis'>{this.props.itemData.get('synopsis')}</p>

        		<p className='actors'>{this.props.itemData.get('actors')}</p>
        		
            <footer>

              <button className='delete' onClick={this.delete}>

                <i className='icon-cancel'/>

              </button>

              <button className='edit' onClick={this.showEditForm}>

                <i className='icon-pencil'/>

              </button>

            </footer>

        </article>

      )
    },

    delete : function(e) {
    
      e.preventDefault();

      Dispatcher.dispatch('items:delete', this.props.itemData.cid);

    },
    
    showEditForm : function(e) {

      e.preventDefault();

      Dispatcher.dispatch('actions:open', {

        type : 'editItem', itemData : this.props.itemData, lock : true

      });

    }

  });

  module.exports = ItemView;

}).call(this);