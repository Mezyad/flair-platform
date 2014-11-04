/*jshint expr: true*/
'use strict';

var assert = require('assert');
var app = require('../app.js');
var Browser = require('zombie');
var async = require('async');
var chai = require('chai');
var expect = chai.expect;
var _ = require('lodash');
var request = require('request');

var HOST = 'localhost';
var PORT = parseInt(process.env.PORT) || 3005;

describe('The home page',function(){
  before(function(done){
    this.port = PORT;
    this.site = 'http://' + HOST + ':' + this.port;
    this.browser = new Browser({
      site: this.site,
    });
    this.server = app.listen(this.port, done);
  });

  before(function(done){
    this.browser.visit(this.site, done);
  });

  it('should be up and running', function(){
    expect(this.browser.success).to.be.ok;
  });

  it('should include bootstrap css', function(done){
    expect(this.browser.query('link[href*="bootstrap.css"]')).to.be.ok;
  });

  it('should have a link to the about page in the footer of all pages that exist', function(done){
    var browser = this.browser;
    function getAboutLink (url, callback) {
      browser.visit(url, function(){
        if (!browser.success) {
          return callback(null, true);
        }
        return callback(null, expect(browser.query('footer a[href="/about"]')).to.be.ok); 
      });
    }
    var urls = ['/', '/about', '/events/new', '/events/0', '/events/1', '/events/2'];
    async.mapSeries(urls, getAboutLink, function(err, results){
      expect(_.all(results)).to.be.true;
      done();
    });
  });


  it('should have your team logo', function(){
    expect(this.browser.query('img#logo[src*=".png"]')).to.be.ok;
  });

  it('should have a list of events', function(){
    expect(this.browser.query('li.event[id*="event-"]')).to.be.ok;
  });

  it('should have a time tag for each event', function(){
    var numEvents = this.browser.queryAll('li.event[id*="event-"]').length;
    var numEventsWithTime = this.browser.queryAll('li.event[id*="event-"] time[datetime]').length;
    expect(numEvents).to.equal(numEventsWithTime).and.to.be.above(0);
  });

  it('should have a link for each event', function(){
    var numEvents = this.browser.queryAll('li.event[id*="event-"]').length;
    var numEventsWithLinks = this.browser.queryAll('li.event[id*="event-"] a[href^="/events/"]').length;
    expect(numEvents).to.equal(numEventsWithLinks).and.to.be.above(0);
  });
  
  after(function(done){
    this.server.close(done);
  });
});

describe('The API',function(){
  before(function(done){
    this.server = app.listen(PORT, done);
    this.url = 'http://' + HOST + ':' + PORT + '/api/events';

  });

  it('should return an array of upcoming events in JSON format', function(done){
    request(this.url, function (error, response, body) {
      expect(error).is.null;
      var data = JSON.parse(body);
      expect(data).to.have.key('events');
      expect(data.events).to.be.a('Array');
      done();
    })
  });

  after(function(done){
    this.server.close(done);
  });
});
