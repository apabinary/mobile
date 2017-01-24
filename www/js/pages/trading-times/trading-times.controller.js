/**
 * @name Trading Times controller
 * @author Nazanin Reihani Haghighi
 * @contributors []
 * @since 01/24/2017
 * @copyright Binary Ltd
 */

(function() {
    'use strict';

    angular
        .module('binary.pages.trading-times.controllers')
        .controller('TradingTimesController', TradingTimes);

    TradingTimes.$inject = ['$scope', '$filter', 'websocketService'];

    function TradingTimes($scope, $filter, websocketService) {
			var vm = this;
      vm.data = {};
      // document.getElementById('date').setAttribute('min', Math.round(new Date().getTime()));
      angular.element(document).ready(function() {
        vm.epochDate = Math.round(new Date().getTime());
        document.getElementById('date').value = $filter('date')(vm.epochDate, 'yyyy-MM-dd');
      });

      vm.sendTradingTimes = function() {
        vm.epochDate = vm.data.date || (Math.round(new Date().getTime()));
        vm.date = $filter('date')(vm.epochDate, 'yyyy-MM-dd');
        websocketService.sendRequestFor.tradingTimes(vm.date);
      }

      vm.sendTradingTimes();

      $scope.$on('trading_times:success', (e, trading_times) => {
        vm.tradingTimes = trading_times;
        $scope.$applyAsync(() => {
          vm.data.markets = vm.tradingTimes.markets;
          vm.market = vm.data.markets[0].name;
        });

      });

    }
})();
