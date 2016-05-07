(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function() {

  var AppView    = require('./views/app.jsx');

  var Dispatcher = require('./dispatcher.js');

  var Router     = Backbone.Router.extend({

    routes : {
      ""                 : "category",
      "#"                : "category",
      "category/:cat_id" : "category"
    }

  });

  var router = new Router();

  var _APP = window._APP = { catId : 0, router : router }

  router.on('route:category', function(catId) {

    _APP.catId  = catId || 0;

    Dispatcher.dispatch('categories:select', _APP.catId);

  });

  router.once('route', function() {

    React.renderComponent(AppView({ router : router }), document.body );

  });

  Backbone.history.start();

}).call(this);
},{"./dispatcher.js":2,"./views/app.jsx":7}],2:[function(require,module,exports){
(function () {

  Publisher = require('./publisher.js');

  module.exports = new Publisher()

}).call(this);
},{"./publisher.js":3}],3:[function(require,module,exports){
(function () {

  var Publisher = function () {

    this.subscribers = {}; this.topics = []; this.queue = [];

  }

  Publisher.prototype = {

    subscribe: function (topic, subscriber, thisObj) {

      var topic = topic || 'general';

      if (topic instanceof Array) {

        var len = topic.length;

        for (var i = 0; i < len; i++) {

          if (!this.subscribers[topic[i]]) { this.subscribers[topic[i]] = []; }

          if (this.topics.indexOf(topic[i]) < 0) { this.topics.push(topic[i]); }

          subscriber.thisObj = thisObj;

          this.subscribers[topic[i]].push(subscriber);

        }
      } 
      else {

        if (!this.subscribers[topic]) { this.subscribers[topic] = []; }

        if (this.topics.indexOf(topic) < 0) { this.topics.push(topic); }

        subscriber.thisObj = thisObj;

        this.subscribers[topic].push(subscriber);

      }
    },

    unSubscribe: function (topic, subscriber) {

      var topic = topic || 'general';

      var index = this.subscribers[topic].indexOf(subscriber);

      this.subscribers[topic].splice(index, 1);

    },

    addToQueue: function (topic, data) {

      topic = topic || 'general';

      var message = new Object();

      message['topic'] = topic;

      message['data'] = data;

      this.queue.push(message);

    },

    processQueue: function (len) {

      var len = len || this.queue.length;

      for (var i = 0; i < len; i++) {

        var message = this.queue.shift();

        this.dispatch(message['data'], message['topic']);

      }
    },

    clearQueue: function () { this.queue = []; },
    
    dispatch: function (topic, data) {

      var topic = topic || 'general';

      if (this.subscribers[topic]) {

        var len = this.subscribers[topic].length;

        for (i = 0; i < len; i++) {

          thisObj = this.subscribers[topic][i].thisObj || this;

          this.subscribers[topic][i].call(thisObj, topic, data);

        }
      }
    }
  }

  module.exports = Publisher

}).call(this);
},{}],4:[function(require,module,exports){
(function() {

  var Publisher  = require('../publisher.js');

  var Dispatcher = require('../dispatcher.js');

  var ActionsStore      = new Publisher;

  ActionsStore.on       = Publisher.prototype.subscribe;

  ActionsStore.actions  = [];

  ActionsStore.lockeds  = []


  Dispatcher.subscribe('actions:open', function(topic, action) {

    this.actions.push(action);

    this.dispatch('action');

  }, ActionsStore);


  Dispatcher.subscribe('actions:close', function(topic, action) {

    var index = this.actions.indexOf(action);

    this.actions.splice(index, 1);

    this.dispatch('action');
  
  }, ActionsStore)


  module.exports = ActionsStore;

}).call(this);
},{"../dispatcher.js":2,"../publisher.js":3}],5:[function(require,module,exports){
(function(){

  var Dispatcher = require('../dispatcher.js');

  var CategoryModel = Backbone.Model.extend({

    defaults : { catId : '0', catName : 'List All Movies' }

  });

  var CategoryCollection = Backbone.Collection.extend({

    initialize : function() {
  
      this.fetch();

      Dispatcher.subscribe('categories:select', function(topic, catId) {
  
        this.catId = catId;

        this.reset(this.models);

        if (catId != _APP.catId) { _APP.router.navigate('category/' + catId); }

      }, this);

      Dispatcher.subscribe('categories:delete', function(topic, catId) {
      
        var category = this.findWhere({catId:catId});
        
        category.destroy();
        
      }, this);

      Dispatcher.subscribe('categories:save', function(topic, data) {
      
        var category;

        data.persist = (data.persist === null || data.persist === undefined) ? true : data.persist;

        if (data.cid) {

          category = this.get(data.cid);

          delete data['cid'];

          category.set(data);

        }
        else {

          delete data['cid'];

          lastByCatId = this.max(function(model){ return model.get('catId'); });

          var lastCatId = 0;

          if (lastByCatId instanceof Object) { lastCatId = lastByCatId.get('catId'); };

          data.catId = lastCatId + 1;

          category = new CategoryModel(data);

          this.add(category);

        }

        if (data.persist) { category.save(); };
  
      }, this);
    },
  
    model : CategoryModel,

    localStorage : new Backbone.LocalStorage("CategoryCollection")

  });

  var CategoryStore   = new CategoryCollection();

  module.exports = CategoryStore;

}).call(this);
},{"../dispatcher.js":2}],6:[function(require,module,exports){
(function(){

  Dispatcher = require('../dispatcher.js');

  var searchIndex = lunr(function () {

    this.field('title')
    this.field('actors')
    this.field('synopsis')
    this.ref('cid')

  });

  var ItemModel = Backbone.Model.extend({
    defaults : {
      catId  : '0'
    }
  });

  var ItemCollection = Backbone.Collection.extend({
    initialize    : function(initialItems, options){
      options               = options || {};
      this.localStorage     = options.localStorage || false;

      if (options.localStorage){
        this.fetch();

        for (var i = this.models.length - 1; i >= 0; i--) {
          var data = _.clone(this.models[i].attributes);
          data.cid = this.models[i].cid;
          searchIndex.add(data);
        };
      }

      Dispatcher.subscribe('categories:delete', function(topic, catId){
        var items   = this.where({ catId : catId.toString() });
        items.map(function(item){
          item.set('catId', '0');

          if (item.get('persist')){
            item.save();
          }
        });
      }, this);

      Dispatcher.subscribe('items:save', function(topic, data){
        var item;

        data.persist = (data.persist === null || data.persist === undefined) ? true : data.persist;

        if(data.cid){
          item = this.get(data.cid);
          delete data['cid'];
          item.set(data);
        }else{
          delete data['cid'];
          item = new ItemModel(data);
          this.add(item);
        }

        if (options.localStorage){
          if (data.persist) {
            item.save();
          };

          data.cid = item.cid;
          searchIndex.add(data);
        }

        Dispatcher.dispatch('categories:select', _APP.catId);

      }, this);

      Dispatcher.subscribe('items:delete', function(topic, cid){
        var item = this.get(cid);
        if(item){ item.destroy(); }
      }, this);

    },
    model : ItemModel
  });

  var AllItems = new ItemCollection(false,{ localStorage : new Backbone.LocalStorage("ItemCollection") });
  var ItemStore = new ItemCollection();

  Dispatcher.subscribe(['categories:select', 'items:search'], function(topic, catId){ //When searching catId is searchTerm
    var models = AllItems.models;
    var searchResults = [];
    var searchTerm    = null;
    this.state        = topic;

    switch(topic){
      case 'items:search':
        searchTerm    = catId;
        catId         = _APP.catId;
        searchResults = searchIndex.search(searchTerm);
        break;
    }

    if (catId != "0"){
      models = AllItems.where({catId : catId});
    }

    if (topic == 'items:search' && searchResults.length > 0) {
      _models = [];
      searchResults.forEach(function(result){
        var ref = result.ref;
        resultModel = AllItems.get(ref);
        if (resultModel.get('catId') == _APP.catId || _APP.catId == '0') {
          _models.push(resultModel);
        };
      });
      models = _models;
    } else if(topic == 'items:search' && (!searchTerm || searchTerm == '')){
      Dispatcher.dispatch('categories:select', catId);
    } else if(topic == 'items:search') {
      models = [];
    };

    this.reset(models);
  }, ItemStore);

  module.exports = ItemStore;

}).call(this);
},{"../dispatcher.js":2}],7:[function(require,module,exports){
/** @jsx React.DOM */
(function(){

  var SidebarView      = require('./sidebar.jsx');
  var TopbarView       = require('./topbar.jsx');
  var ContentAreaView  = require('./contentarea.jsx');
  var CategoryFormView = require('./categoryform.jsx');
  var ItemFormView     = require('./itemform.jsx');
  var ItemStore        = require('../stores/itemstore.js');
  var CategoryStore    = require('../stores/categorystore.js');
  var ActionStore      = require('../stores/actionstore.js');
  var FirstLaunchView  = require('./firstlaunch.jsx');

  var ReactCSSTransitionGroup = React.addons.CSSTransitionGroup;

  var getState = function(){

    return {

      items          : ItemStore.models,
      itemCount      : ItemStore.models.length,
      itemStoreState : ItemStore.state,
      categories     : CategoryStore.models,
      catId          : CategoryStore.catId,
      actions        : ActionStore.actions

    }
  }

  AppView = React.createClass({displayName: 'AppView',

    getDefaultProps : function() {

      return {

        getItem     : ItemStore.get,

        firstLaunch : localStorage._appFirstLaunch || true

      }
    },

    getInitialState: function() { return getState(); },

    componentWillMount: function() {

      var self = this;

      var refreshState = function() { var state = getState(); self.setState(state) };

      var events = 'change reset add remove'

      ItemStore.on(events, refreshState);

      CategoryStore.on(events, refreshState);

      ActionStore.on('action', refreshState);

      if (this.props.firstLaunch != 'no') {

        localStorage._appFirstLaunch = 'no';

        Dispatcher.dispatch('actions:open', { type : 'firstLaunch' });

      }
    },

    getActions : function() {

      var actions = [];

      for (var i = this.state.actions.length - 1; i >= 0; i--) {

        switch(this.state.actions[i].type) {

          case 'newCategory':
            actions.push(CategoryFormView({title: "New Genre", key: "action-" + i}));
            break;

          case 'newItem' :
            actions.push(ItemFormView({title: "New Movie", key: "action-" + i}));
            break;

          case 'editItem' :
            var itemData = this.state.actions[i].itemData;
            actions.push(ItemFormView({title: "Edit Movie", itemData: itemData, key: "action-" + i}));
            break;

          case 'editCategory' :
            var categoryData = this.state.actions[i].categoryData;
            actions.push(CategoryFormView({title: "Edit Genre", categoryData: categoryData, key: "action-" + i}));
            break;

          case 'firstLaunch' :
            actions.push(FirstLaunchView({title: "Get Started", key: "action-" + i}));
            break;

        }
      }

      return actions;
    },

    render : function() {

      var actions = this.getActions();

      return (

        React.DOM.main({className: "app-view"}, 

          SidebarView({categories: this.state.categories, catId: this.state.catId}), 

          TopbarView(null), 

          ReactCSSTransitionGroup({transitionName: "action"}, 

          actions

          ), 

          ContentAreaView({
          items: this.state.items, 
          itemStoreState: this.state.itemStoreState, 
          itemCount: this.state.itemCount})

        )

      )
    }
  });

  module.exports = AppView;

}).call(this);
},{"../stores/actionstore.js":4,"../stores/categorystore.js":5,"../stores/itemstore.js":6,"./categoryform.jsx":8,"./contentarea.jsx":11,"./firstlaunch.jsx":12,"./itemform.jsx":14,"./sidebar.jsx":16,"./topbar.jsx":17}],8:[function(require,module,exports){
/** @jsx React.DOM */
(function() {

  var Dispatcher = require('../dispatcher.js');

  var ModalView = require('./modal.jsx');


  NewCategoryView = React.createClass({displayName: 'NewCategoryView',

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

        confirmButton = React.DOM.button({type: "submit", onClick: this.confirm, className: "confirm"}, "Save Genre");

      }
      else {

        confirmButton = React.DOM.button({type: "submit", onClick: this.confirm, className: "confirm"}, "Add Genre");

      }

      return (

        ModalView({cancelHandler: this.cancel, type: "category-form", title: this.props.title}, 

            React.DOM.input({
              type: "text", 
              ref: "catName", 
              onKeyUp: this.handleKey, 
              defaultValue: this.props.catName, 
              placeholder: "Genre"}), 

            confirmButton, 

            React.DOM.a({href: "#", onClick: this.cancel, className: "cancel"}, "Cancel")

        )

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
},{"../dispatcher.js":2,"./modal.jsx":15}],9:[function(require,module,exports){
/** @jsx React.DOM */
(function() {

  CategoryItemView = React.createClass({displayName: 'CategoryItemView',

    render : function() {

      {
        var href = '#category/' + this.props.categoryData.get('catId');

        var className = 'category-item ' + this.props.className;
      }

      return (

        React.DOM.li({className: className}, 

          React.DOM.a({href: href}, React.DOM.span(null, this.props.categoryData.get('catName'))), 

          React.DOM.button({className: "edit", onClick: this.showEditForm}, React.DOM.i({className: "icon-pencil-circled"})), 

          React.DOM.button({className: "delete", onClick: this.delete}, React.DOM.i({className: "icon-cancel-circled"}))

        )

      )
    },
    delete : function() {

      Dispatcher.dispatch('categories:delete', this.props.categoryData.get('catId'));

      if(this.props.categoryData.get('catId') == _APP.catId) {

        Dispatcher.dispatch('categories:select', 0);

      }

    },
    showEditForm : function(e) {

      e.preventDefault();

      Dispatcher.dispatch('actions:open', {

        type          : 'editCategory',

        categoryData  : this.props.categoryData,

        lock          : true

      });
    }
  });

  module.exports = CategoryItemView;

}).call(this);
},{}],10:[function(require,module,exports){
/** @jsx React.DOM */
(function() {

  var CategoryItemView = require('./categoryitem.jsx');

  var Dispatcher = require('../dispatcher.js');


  CategoryListView = React.createClass({displayName: 'CategoryListView',

    render : function() {

      var categories = [];

      for (var key in this.props.categories) {

        var className = (this.props.catId == this.props.categories[key].get("catId")) ? 'active' : ''

        categories.push(CategoryItemView({key: key, categoryData: this.props.categories[key], className: className}))

      }

      return (

        React.DOM.nav({className: "category-list"}, 

          React.DOM.h3(null, "My Movie Collection"), 

          React.DOM.ul(null, 

            React.DOM.li({className: (this.props.catId == 0) ? 'active' : ''}, 

              React.DOM.a({href: "#", className: "category-item"}, "List All Movies")

            ), 

            categories, 

            React.DOM.button({
              className: "new-category", 
              onClick: this.showNewCategoryForm}, 
              React.DOM.i({className: "icon-plus"}), " Add New Genre"
            )

          )

        )

      )
    },

    showNewCategoryForm : function(e) {

      e.preventDefault();

      Dispatcher.dispatch('actions:open', { type : 'newCategory', lock : true });

    }

  });

  module.exports = CategoryListView;

}).call(this);
},{"../dispatcher.js":2,"./categoryitem.jsx":9}],11:[function(require,module,exports){
/** @jsx React.DOM */
(function() {

  var ItemView = require('./item.jsx');

  var CategoryStore = require('../stores/categorystore.js');

  var ReactCSSTransitionGroup = React.addons.CSSTransitionGroup;


  ContentAreaView = React.createClass({displayName: 'ContentAreaView',

    statics : {

      noSearchResultMsg : 'No movies found!',

      noItemFoundMsg : 'No movies found for this genre.'

    },

    render : function() {

      var items = this.props.items;

      var views = [];

      for (var key in items){

        views.push( ItemView({key: key, itemData: items[key]}) )

      }

      if(this.props.itemCount == 0) {

        var errMsg;

        switch(this.props.itemStoreState) {

          case 'items:search':
            errMsg = ContentAreaView.noSearchResultMsg;
            break;

          case 'categories:select' :
            errMsg = ContentAreaView.noItemFoundMsg;
            break;

        }

        views.push( React.DOM.div({key: "errmsg", className: "errmsg"}, errMsg) )

      }

      return (

        ReactCSSTransitionGroup({
          component: React.DOM.div, 
          className: "content-area", 
          transitionName: "item"}, 

          views

        )

      )
    }
  });

  module.exports = ContentAreaView;

}).call(this);
},{"../stores/categorystore.js":5,"./item.jsx":13}],12:[function(require,module,exports){
/** @jsx React.DOM */
(function() {

  var ModalView = require('./modal.jsx');

  FirstLaunchView = React.createClass({displayName: 'FirstLaunchView',

    render : function() {

      return (

        ModalView({cancelHandler: this.cancel, type: "first-launch-modal", title: this.props.title}, 

          React.DOM.p(null, 

            "The Home Movie Collection Manager helps keep your home movie collection organized.", 
            
            React.DOM.br(null), React.DOM.br(null), 

            "If you'd like, I can load some sample data now.", 
            
            React.DOM.br(null), React.DOM.br(null)

          ), 

          React.DOM.button({type: "submit", onClick: this.confirm, className: "confirm"}, 

            React.DOM.i({className: "icon-ok-circled"}), "Load Data"

          ), 

            React.DOM.a({href: "#", onClick: this.cancel, className: "cancel"}, "No, Thanks.")

        )

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
},{"./modal.jsx":15}],13:[function(require,module,exports){
/** @jsx React.DOM */
(function() {

  var Dispatcher = require('../dispatcher.js');

  ItemView = React.createClass({displayName: 'ItemView',

    render : function() {

      return (

        React.DOM.article(null, 

        		React.DOM.img({className: "poster", src: this.props.itemData.get('poster')}), 

        		React.DOM.p({className: "rating"}, this.props.itemData.get('rating')), 

        		React.DOM.p({className: "title"}, this.props.itemData.get('title')), 

        		React.DOM.p({className: "year"}, this.props.itemData.get('year')), 

        		React.DOM.p({className: "synopsis"}, this.props.itemData.get('synopsis')), 

        		React.DOM.p({className: "actors"}, this.props.itemData.get('actors')), 
        		
            React.DOM.footer(null, 

              React.DOM.button({className: "delete", onClick: this.delete}, 

                React.DOM.i({className: "icon-cancel"})

              ), 

              React.DOM.button({className: "edit", onClick: this.showEditForm}, 

                React.DOM.i({className: "icon-pencil"})

              )

            )

        )

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
},{"../dispatcher.js":2}],14:[function(require,module,exports){
/** @jsx React.DOM */
(function() {

  var Dispatcher      = require('../dispatcher.js');

  var CategoryStore   = require('../stores/categorystore.js');

  var ModalView       = require('./modal.jsx');


  NewItemView = React.createClass({displayName: 'NewItemView',

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

          React.DOM.option({key: 'option-'+i, value: model.get('catId')}, 

            model.get('catName')

          )

        );
      };

      var confirmButton;

      if(this.props.itemData) {

        confirmButton = React.DOM.button({type: "submit", onClick: this.confirm, className: "confirm"}, "Save Movie");

      }

      else {

        confirmButton = React.DOM.button({type: "submit", onClick: this.confirm, className: "confirm"}, "Add Movie");

      }

      return (

        ModalView({type: "item-form", cancelHandler: this.cancel, title: this.props.title}, 

          React.DOM.input({
            type: "text", 
            ref: "itemTitle", 
            onKeyUp: this.handleKey, 
            defaultValue: this.props.itemTitle, 
            placeholder: "Title"}), 

          React.DOM.input({
            type: "text", 
            ref: "itemPoster", 
            onKeyUp: this.handleKey, 
            defaultValue: this.props.itemPoster, 
            placeholder: "Poster"}), 

          React.DOM.input({
            type: "text", 
            ref: "itemActors", 
            onKeyUp: this.handleKey, 
            defaultValue: this.props.itemActors, 
            placeholder: "Actors"}), 

          React.DOM.textarea({
            onKeyUp: this.handleKey, 
            ref: "itemSynopsis", 
            placeholder: "Synopsis", 
            defaultValue: this.props.itemSynopsis}), 

          React.DOM.input({
            type: "text", 
            ref: "itemYear", 
            onKeyUp: this.handleKey, 
            defaultValue: this.props.itemYear, 
            placeholder: "Release Year"}), 
            
          React.DOM.select({ref: "itemRating", defaultValue: this.props.itemRating}, 

            React.DOM.option({value: "N/A"}, "Select Rating"), 
            React.DOM.option(null, "G"), 
            React.DOM.option(null, "PG"), 
            React.DOM.option(null, "PG-13"), 
            React.DOM.option(null, "NC-17"), 
            React.DOM.option(null, "R"), 
            React.DOM.option(null, "MA"), 
            React.DOM.option(null, "Unrated")

          ), 
          
          React.DOM.select({ref: "itemCategory", defaultValue: this.props.catId}, 

            React.DOM.option({value: "0"}, "Select Genre..."), " ", categories
  
          ), 
          
          confirmButton, 

          React.DOM.a({href: "#", onClick: this.cancel, className: "cancel"}, "Cancel")

        )

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
},{"../dispatcher.js":2,"../stores/categorystore.js":5,"./modal.jsx":15}],15:[function(require,module,exports){
/** @jsx React.DOM */
(function(){

  ModalView = React.createClass({displayName: 'ModalView',

    escHandler : function(e){

      if (this.props.cancelHandler && e.keyCode == 27) {

        this.props.cancelHandler(e);

      }
    },
    
    componentDidMount : function() {

      window.addEventListener('keydown', this.escHandler);

    },

    componentWillUnmount : function() {

      window.removeEventListener('keydown', this.handleResize);

    },

    render : function(){
  
      return (

        React.DOM.div({className: "modal-overlay"}, 

          React.DOM.div({className: 'action-modal ' + this.props.type}, 

            React.DOM.h4(null, this.props.title), 

            this.props.children

          )

        )

      )
    }
  });

  module.exports = ModalView;

}).call(this);
},{}],16:[function(require,module,exports){
/** @jsx React.DOM */
(function() {

  var CategoryListView = require('./categorylist.jsx')

  SidebarView = React.createClass({displayName: 'SidebarView',

    render : function() {

      return (

        React.DOM.aside(null, 

          CategoryListView({categories: this.props.categories, catId: this.props.catId})

        )
      )
    }
  });

  module.exports = SidebarView;

}).call(this);
},{"./categorylist.jsx":10}],17:[function(require,module,exports){
/** @jsx React.DOM */
(function(){

	var Dispatcher = require('../dispatcher.js');

	TopbarView = React.createClass({displayName: 'TopbarView',

		render : function() {

			return (

				React.DOM.header(null, 

					React.DOM.button({onClick: this.showNewItemForm, className: "add"}, 

						React.DOM.i({className: "icon-plus"}), " Add New Movie"

					), 

					React.DOM.label({htmlFor: "searchinput", className: "icon-search"}), 

					React.DOM.input({type: "text", 
					name: "searchinput", 
					className: "search-input", 
					onKeyUp: this.handleSearch, 
					placeholder: "Filter...", 
					ref: "search"})

				)

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
},{"../dispatcher.js":2}]},{},[1]);