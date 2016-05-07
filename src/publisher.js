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