angular.module('cacilhasApp', ['ngRoute'])
.controller('CacilhasController', function($scope) {

    var homeActive = true;
    var aboutActive = false;

    var url = window.location.href.split('?url=')[1];
    url = url || '/home';

    if (url === '/about') {
        homeActive = false;
        aboutActive = true;
    } else if (url !== '/home') {
        homeActive = false;
        $('<a href="' + window.location.href + '">')
            .text(url).appendTo($('#current'));
    }

    $scope.homeActive = homeActive;
    $scope.aboutActive = aboutActive;

    url = '/templates' + url + '.html';
    $('#main').load(url);

});
