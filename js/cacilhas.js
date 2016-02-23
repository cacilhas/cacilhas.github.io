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
        var current = $('#current');
        homeActive = false;

        current.addClass('active');
        $('<a>').attr('href', window.location.href)
                .text(url)
                .appendTo(current);
        current.show();
    }

    $scope.homeActive = homeActive;
    $scope.aboutActive = aboutActive;
    $scope.page_url = '/templates' + url + '.html';

});
