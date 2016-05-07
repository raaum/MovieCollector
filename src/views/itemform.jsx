/** @jsx React.DOM */
(function() {

  var Dispatcher      = require('../dispatcher.js');

  var CategoryStore   = require('../stores/categorystore.js');

  var ModalView       = require('./modal.jsx');


  NewItemView = React.createClass({

    getDefaultProps : function() {
  
      var itemData = this.props.itemData;

      var itemTitle,  itemPoster, 
          itemActors, itemSynopsis, 
          itemRating, itemYear,
          catId,      itemCid;

      if (itemData) {

        itemTitle    = itemData.get('title');
        itemPoster   = itemData.get('poster');
        itemActors   = itemData.get('actors');
        itemSynopsis = itemData.get('synopsis');
        itemRating   = itemData.get('rating');
        itemYear     = itemData.get('year');
        catId        = itemData.get('catId');
        itemCid      = itemData.cid;

      }

      return {

        itemTitle    : itemTitle,
        itemPoster   : itemPoster,
        itemActors   : itemActors,
        itemSynopsis : itemSynopsis,
        itemRating   : itemRating,
        itemYear     : itemYear,
        catId        : catId || 0,
        categories   : CategoryStore.models,
        itemCid      : itemCid

      }
    },

    render : function() {

      var categories = [];

      for (var i = this.props.categories.length - 1; i >= 0; i--) {

        var model = this.props.categories[i];

        categories.push (

          <option key={'option-'+i} value={model.get('catId')}>

            {model.get('catName')}

          </option>

        );
      };

      var confirmButton;

      if(this.props.itemData) {

        confirmButton = <button type='submit' onClick={this.confirm} className='confirm'>Save Movie</button>;

      }

      else {

        confirmButton = <button type='submit' onClick={this.confirm} className='confirm'>Add Movie</button>;

      }

      return (

        <ModalView type='item-form' cancelHandler={this.cancel} title={this.props.title}>

          <input
            type         = 'text'
            ref          = 'itemTitle'
            onKeyUp      = {this.handleKey}
            defaultValue = {this.props.itemTitle}
            placeholder  = 'Title' />

          <input
            type         = 'text'
            ref          = 'itemPoster'
            onKeyUp      = {this.handleKey}
            defaultValue = {this.props.itemPoster}
            placeholder  = 'Poster' />

          <input
            type         = 'text'
            ref          = 'itemActors'
            onKeyUp      = {this.handleKey}
            defaultValue = {this.props.itemActors}
            placeholder  = 'Actors' />

          <textarea
            onKeyUp      = {this.handleKey}
            ref          = 'itemSynopsis'
            placeholder  = 'Synopsis'
            defaultValue = {this.props.itemSynopsis} />

          <input
            type         = 'text'
            ref          = 'itemYear'
            onKeyUp      = {this.handleKey}
            defaultValue = {this.props.itemYear}
            placeholder  = 'Release Year' />
            
          <select ref='itemRating' defaultValue={this.props.itemRating}>

            <option value='N/A'>Select Rating</option>
            <option>G</option>
            <option>PG</option>
            <option>PG-13</option>
            <option>NC-17</option>
            <option>R</option>
            <option>MA</option>
            <option>Unrated</option>

          </select>
          
          <select ref='itemCategory' defaultValue={this.props.catId}>

            <option value='0'>Select Genre...</option> {categories}
  
          </select>
          
          {confirmButton}

          <a href='#' onClick={this.cancel} className='cancel'>Cancel</a>

        </ModalView>

      )
    },

    handleKey : function(e) { if(e.key == 'Enter') { this.confirm(); } },

    confirm : function() {

      var itemTitle    = this.refs.itemTitle.state.value    || 'Untitled';
      var itemPoster   = this.refs.itemPoster.state.value   || 'images/default.jpg';
      var itemActors   = this.refs.itemActors.state.value   || 'Unknown';
      var itemYear     = this.refs.itemYear.state.value     || 'N/A';
      var itemRating   = this.refs.itemRating.state.value   || 'N/A';
      var itemCategory = this.refs.itemCategory.state.value || 0;
      var itemSynopsis = this.refs.itemSynopsis.state.value || 'No synopsis provided.';
      var itemCid      = this.props.itemCid;

      data = {
        title    : itemTitle,
        poster   : itemPoster,
        catId    : itemCategory,
        synopsis : itemSynopsis,
        actors   : itemActors,
        year     : itemYear,
        rating   : itemRating,
        cid      : itemCid
      }

      Dispatcher.dispatch('items:save', data);

      Dispatcher.dispatch('actions:close', { type : 'newItem' });

    },

    cancel : function(e) {

      e.preventDefault();

      Dispatcher.dispatch('actions:close', { type : 'newItem' });

    }

  });

  module.exports = NewItemView;

}).call(this);