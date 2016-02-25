angular.module('cacilhasApp', ['ngRoute'])
.controller('CacilhasController', function($scope) {

    var homeActive = true;
    var aboutActive = false;
    this.currentURL = window.location.href;
    var url = window.location.href.split('?t=')[1];
    url = url || '/home';
    this.currentTitle = url;

    if (url === '/about') {
        homeActive = false;
        aboutActive = true;
    } else if (url !== '/home') {
        var current = $('#current');
        homeActive = false;
        current.addClass('active');
        current.show();
    }

    $scope.homeActive = homeActive;
    $scope.aboutActive = aboutActive;
    $scope.templateURL = '/templates' + url + '.html';

    this.getSiteMap = function() {
        if (typeof siteMap === 'undefined')
            return [];
        else
            return siteMap;
    }

    this.getHighlight = function() {
        if (typeof siteMap === 'undefined')
            return [];
        else
            return siteMap.filter(function(page) { return page.highlight; });
    }

})
.filter('trusted', ['$sce', function($sce) {
    return function(text) {
        return $sce.trustAsHtml(text);
    }
}]);
