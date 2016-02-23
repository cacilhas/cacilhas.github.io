angular.module('cacilhasApp', ['ngRoute'])
.controller('CacilhasController', function() {

    this.homeActive = true;
    this.aboutActive = false;
    this.currentPage = $('<li>');

    var url = window.location.href.split('?url=')[1];
    url = url || '/home';

    if (url === '/about') {
        this.homeActive = false;
        this.aboutActive = true;
    } else if (url !== '/home') {
        this.homeActive = false;
        $('<a href="' + window.location.href + '">')
            .text(url).appendTo($('#current'));
    }

    url = '/templates' + url + '.html';
    $('#main').load(url);

});
