/** @jsx React.DOM */
(function() {

  var ModalView = require('./modal.jsx');

  FirstLaunchView = React.createClass({

    render : function() {

      return (

        <ModalView cancelHandler={this.cancel} type='first-launch-modal' title={this.props.title}>

          <p>

            The Home Movie Collection Manager helps keep your home movie collection organized.
            
            <br /><br />

            If you'd like, I can load some sample data now.
            
            <br /><br />

          </p>

          <button type='submit' onClick={this.confirm} className='confirm'>

            <i className='icon-ok-circled'/>Load Data

          </button>

            <a href='#' onClick={this.cancel} className='cancel'>No, Thanks.</a>

        </ModalView>

      )
    },

    confirm : function(e) {

      e.preventDefault();

      var httpRequest = new XMLHttpRequest();

      var callback = function(data) {

        for (var i = data.categories.length - 1; i >= 0; i--) {

          Dispatcher.dispatch('categories:save', data.categories[i]);
  
        }

        for (var i = data.items.length - 1; i >= 0; i--) {

          Dispatcher.dispatch('items:save', data.items[i]);

        }

        Dispatcher.dispatch('actions:close', {

          type : 'firstLaunch'

        });
      }

      httpRequest.onreadystatechange = function() {

        if (httpRequest.readyState === 4) {

          if (httpRequest.status === 200) {

            var data = JSON.parse(httpRequest.responseText);

            if (callback) callback(data);

          }
        }
      };

      httpRequest.open('GET', 'exampledata.json');

      httpRequest.send();

    },

    cancel : function(e) {

      e.preventDefault();

      Dispatcher.dispatch('actions:close', { type : 'firstLaunch' });

    }

  });

  module.exports = FirstLaunchView;

}).call(this);