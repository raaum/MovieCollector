/** @jsx React.DOM */
(function() {

  var Dispatcher = require('../dispatcher.js');

  var ModalView = require('./modal.jsx');


  NewCategoryView = React.createClass({

    getDefaultProps : function() {

      var categoryData  = this.props.categoryData;

      var catName, catId, catCid;

      if (categoryData) {

        catName  = categoryData.get('catName');

        catId    = categoryData.get('catId');

        catCid   = categoryData.cid;

      }

      return { catName : catName, catId : catId, catCid : catCid }

    },

    render : function() {

      var confirmButton;

      if (this.props.categoryData) {

        confirmButton = <button type='submit' onClick={this.confirm} className='confirm'>Save Genre</button>;

      }
      else {

        confirmButton = <button type='submit' onClick={this.confirm} className='confirm'>Add Genre</button>;

      }

      return (

        <ModalView cancelHandler={this.cancel} type='category-form' title={this.props.title}>

            <input
              type         = 'text'
              ref          = 'catName'
              onKeyUp      = {this.handleKey}
              defaultValue = {this.props.catName}
              placeholder  = 'Genre' />

            {confirmButton}

            <a href='#' onClick={this.cancel} className='cancel'>Cancel</a>

        </ModalView>

      )
    },

    handleKey : function(e){ if(e.key == 'Enter') { this.confirm(); } },

    confirm : function() {

      var catName = this.refs.catName.state.value;

      var cid = this.props.catCid;

      Dispatcher.dispatch('categories:save', { catName : catName, cid : cid });

      Dispatcher.dispatch('actions:close', { type : 'newCategory' });

    },

    cancel : function(e) {

      e.preventDefault();

      Dispatcher.dispatch('actions:close', { type : 'newCategory' });

    }

  });

  module.exports = NewCategoryView;

}).call(this);