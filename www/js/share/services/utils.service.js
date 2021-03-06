/**
 * @name utils service
 * @author Morteza Tavnarad
 * @contributors []
 * @since 08/17/2016
 * @copyright Binary Ltd
 */

(function(){
  'use strict';

  angular
    .module('binary.share.services')
    .factory('utilsService', Utils);

  Utils.$inject = ['$rootScope'];

 function Utils ($rootScope){
   var factory = {};

   factory.spinnerLogo = {
     start: () => { $rootScope.$broadcast('spinner-logo:start'); },
     stop: () => { $rootScope.$broadcast('spinner-logo:stop'); }
   }

   return factory;
 }
})();
